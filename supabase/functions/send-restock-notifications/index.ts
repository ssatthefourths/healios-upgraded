import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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

const sendEmail = async (to: string, subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Healios <hello@thehealios.com>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
};

const generateRestockEmailHtml = (productName: string, productImage: string, productPrice: number, productUrl: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: 2px;">HEALIOS</h1>
          <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">The Healios Health Co.</p>
        </div>

        <div style="background-color: #ffffff; padding: 40px; border-radius: 0;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h2 style="font-size: 24px; font-weight: 300; color: #1a1a1a; margin: 0;">
              It's Back! 🎉
            </h2>
          </div>

          <!-- Product Image -->
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${productImage}" alt="${productName}" style="max-width: 200px; height: auto;" />
          </div>

          <!-- Content -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h3 style="font-size: 20px; font-weight: 500; color: #1a1a1a; margin: 0 0 12px 0;">
              ${productName}
            </h3>
            <p style="font-size: 16px; color: #666; margin: 0 0 8px 0;">
              The product you've been waiting for is back in stock.
            </p>
            <p style="font-size: 18px; font-weight: 500; color: #1a1a1a; margin: 0;">
              £${productPrice.toFixed(2)}
            </p>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${productUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;">
              SHOP NOW
            </a>
          </div>

          <!-- Note -->
          <p style="font-size: 14px; color: #888; text-align: center; margin: 0;">
            Don't miss out - popular items sell fast!
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 24px 0;">
          <p style="font-size: 12px; color: #999; margin: 0;">
            You received this email because you signed up for a restock notification on thehealios.com
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("Starting restock notification check...");

    // Find all pending notifications for products that are now back in stock
    const { data: pendingNotifications, error: notifError } = await supabase
      .from('stock_notifications')
      .select(`
        id,
        product_id,
        user_id,
        products!inner (
          id,
          name,
          image,
          price,
          stock_quantity,
          slug
        )
      `)
      .is('notified_at', null)
      .gt('products.stock_quantity', 0);

    if (notifError) {
      console.error("Error fetching notifications:", notifError);
      throw notifError;
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      console.log("No pending restock notifications found");
      return new Response(
        JSON.stringify({ message: "No pending notifications", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log(`Found ${pendingNotifications.length} pending notifications`);

    let sentCount = 0;
    const errors: string[] = [];

    for (const notification of pendingNotifications) {
      try {
        // Get user email from auth.users
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
          notification.user_id
        );

        if (userError || !userData?.user?.email) {
          console.error(`Could not get email for user ${notification.user_id}:`, userError);
          errors.push(`User ${notification.user_id}: email not found`);
          continue;
        }

        const userEmail = userData.user.email;
        const product = notification.products as any;
        const productUrl = `https://www.thehealios.com/product/${product.slug || product.id}`;

        const subject = `Great news! ${product.name} is back in stock`;
        const html = generateRestockEmailHtml(product.name, product.image, product.price, productUrl);

        // Send email via Resend
        const emailResponse = await sendEmail(userEmail, subject, html);
        console.log(`Email sent to ${userEmail} for product ${product.name}:`, emailResponse);

        // Update notification as sent
        const { error: updateError } = await supabase
          .from('stock_notifications')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', notification.id);

        if (updateError) {
          console.error(`Error updating notification ${notification.id}:`, updateError);
          errors.push(`Notification ${notification.id}: failed to update`);
        } else {
          sentCount++;
        }
      } catch (emailError: any) {
        console.error(`Error processing notification ${notification.id}:`, emailError);
        errors.push(`Notification ${notification.id}: ${emailError.message}`);
      }
    }

    console.log(`Restock notifications complete. Sent: ${sentCount}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({ 
        message: "Restock notifications processed",
        sent: sentCount,
        total: pendingNotifications.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error in send-restock-notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
