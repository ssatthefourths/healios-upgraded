import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Allowed origins for CORS - prevents cross-origin attacks
const ALLOWED_ORIGINS = [
  Deno.env.get("ALLOWED_ORIGIN") || "https://www.thehealios.com",
  "https://healios.lovable.app",
  "http://localhost:8080",
  "http://localhost:5173",
];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
};

// Default CORS headers for backwards compatibility
const corsHeaders = getCorsHeaders(null);

interface OrderItem {
  product_name: string;
  product_image: string | null;
  quantity: number;
}

interface OrderForReview {
  id: string;
  email: string;
  first_name: string;
  created_at: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting review request email job...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find orders that are 7 days old, delivered or shipped, and haven't received a review email
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();

    // Also set a cutoff so we don't email very old orders (30 days max)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    console.log(`Looking for orders between ${thirtyDaysAgoStr} and ${sevenDaysAgoStr}`);

    const { data: ordersToReview, error: ordersError } = await supabase
      .from("orders")
      .select("id, email, first_name, created_at")
      .is("review_email_sent_at", null)
      .in("status", ["delivered", "shipped", "processing"])
      .lte("created_at", sevenDaysAgoStr)
      .gte("created_at", thirtyDaysAgoStr)
      .limit(50); // Process in batches

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    if (!ordersToReview || ordersToReview.length === 0) {
      console.log("No orders need review emails at this time");
      return new Response(
        JSON.stringify({ message: "No orders need review emails", processed: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${ordersToReview.length} orders to send review emails`);

    let successCount = 0;
    let errorCount = 0;

    for (const order of ordersToReview as OrderForReview[]) {
      try {
        // Get order items for this order
        const { data: orderItems, error: itemsError } = await supabase
          .from("order_items")
          .select("product_name, product_image, quantity")
          .eq("order_id", order.id);

        if (itemsError) {
          console.error(`Error fetching items for order ${order.id}:`, itemsError);
          errorCount++;
          continue;
        }

        const items = orderItems as OrderItem[] || [];
        const productNames = items.map(item => item.product_name).join(", ");
        const firstProduct = items[0];

        // Generate review email HTML
        const emailHtml = generateReviewEmailHtml(order.first_name, items, order.id);

        // Send review request email
        const emailResponse = await resend.emails.send({
          from: "Healios <hello@thehealios.com>",
          to: [order.email],
          subject: `How are you enjoying your ${firstProduct?.product_name || 'Healios products'}?`,
          html: emailHtml,
        });

        console.log(`Review email sent to ${order.email} for order ${order.id}:`, emailResponse);

        // Mark order as review email sent
        const { error: updateError } = await supabase
          .from("orders")
          .update({ review_email_sent_at: new Date().toISOString() })
          .eq("id", order.id);

        if (updateError) {
          console.error(`Failed to update order ${order.id}:`, updateError);
        }

        successCount++;
      } catch (emailError) {
        console.error(`Failed to send review email for order ${order.id}:`, emailError);
        errorCount++;
      }
    }

    console.log(`Review email job complete. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({ 
        message: "Review email job complete",
        processed: ordersToReview.length,
        success: successCount,
        errors: errorCount
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-review-request function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

/**
 * HTML entity encoding to prevent XSS in emails
 */
const escapeHtml = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

function generateReviewEmailHtml(firstName: string, items: OrderItem[], orderId: string): string {
  // Escape user-provided values
  const safeFirstName = escapeHtml(firstName);

  const productListHtml = items.map(item => {
    const safeProductName = escapeHtml(item.product_name);
    return `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="60" style="padding-right: 16px;">
              ${item.product_image 
                ? `<img src="https://www.thehealios.com${escapeHtml(item.product_image)}" alt="${safeProductName}" width="60" height="60" style="display: block; border-radius: 4px; object-fit: cover;" />`
                : `<div style="width: 60px; height: 60px; background: #f5f5f5; border-radius: 4px;"></div>`
              }
            </td>
            <td style="vertical-align: middle;">
              <p style="margin: 0; font-size: 14px; color: #333; font-weight: 500;">${safeProductName}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Qty: ${item.quantity}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9f9f9;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff;">
              
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #eee;">
                  <img src="https://www.thehealios.com/healios-logo.png" alt="Healios" height="32" style="display: inline-block;" />
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px;">
                  <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 400; color: #333; text-align: center;">
                    How's your wellness journey going?
                  </h1>
                  
                  <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #555; text-align: center;">
                    Hi ${safeFirstName},
                  </p>
                  
                  <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #555;">
                    It's been a week since your Healios order arrived, and we hope you're loving your new wellness routine! We'd really appreciate hearing about your experience.
                  </p>
                  
                  <!-- Products -->
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                    ${productListHtml}
                  </table>
                  
                  <!-- CTA Button -->
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="https://www.thehealios.com/account" 
                           style="display: inline-block; padding: 16px 40px; background-color: #333; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;">
                          SHARE YOUR EXPERIENCE
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Tips Section -->
                  <div style="background-color: #f9f9f9; padding: 24px; margin-top: 20px;">
                    <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #333;">
                      Quick Tips for Best Results
                    </h3>
                    <ul style="margin: 0; padding: 0 0 0 20px; font-size: 14px; line-height: 1.8; color: #555;">
                      <li>Take your gummies at the same time each day</li>
                      <li>Stay consistent for at least 30 days to feel the full benefits</li>
                      <li>Store in a cool, dry place away from direct sunlight</li>
                    </ul>
                  </div>
                  
                  <!-- Running Low? -->
                  <p style="margin: 30px 0 0 0; font-size: 14px; line-height: 1.6; color: #555; text-align: center;">
                    Running low? Subscribe & Save 15% on your next order.
                  </p>
                  
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 16px 0 0 0;">
                        <a href="https://www.thehealios.com/subscribe" 
                           style="display: inline-block; padding: 12px 30px; border: 1px solid #333; color: #333; text-decoration: none; font-size: 13px; font-weight: 500;">
                          VIEW SUBSCRIPTIONS
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #f9f9f9; border-top: 1px solid #eee;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #888; text-align: center;">
                    Questions? We're here to help at 
                    <a href="mailto:support@thehealios.com" style="color: #555;">support@thehealios.com</a>
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #aaa; text-align: center;">
                    © ${new Date().getFullYear()} The Healios Health Co. All rights reserved.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

serve(handler);
