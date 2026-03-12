import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionReminder {
  id: string;
  user_id: string;
  product_id: string;
  price: number;
  frequency: string;
  next_delivery_date: string;
}

interface Profile {
  first_name: string | null;
}

interface Product {
  name: string;
  image: string;
}

interface UserEmail {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting subscription reminder email job...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find subscriptions that renew in 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const targetDateStart = new Date(threeDaysFromNow);
    targetDateStart.setHours(0, 0, 0, 0);
    const targetDateEnd = new Date(threeDaysFromNow);
    targetDateEnd.setHours(23, 59, 59, 999);

    console.log(`Looking for subscriptions renewing between ${targetDateStart.toISOString()} and ${targetDateEnd.toISOString()}`);

    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("subscriptions")
      .select("id, user_id, product_id, price, frequency, next_delivery_date")
      .eq("status", "active")
      .gte("next_delivery_date", targetDateStart.toISOString())
      .lte("next_delivery_date", targetDateEnd.toISOString())
      .limit(100);

    if (subscriptionsError) {
      console.error("Error fetching subscriptions:", subscriptionsError);
      throw new Error(`Failed to fetch subscriptions: ${subscriptionsError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No subscriptions need reminder emails at this time");
      return new Response(
        JSON.stringify({ message: "No subscriptions need reminders", processed: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${subscriptions.length} subscriptions to send reminder emails`);

    let successCount = 0;
    let errorCount = 0;

    for (const subscription of subscriptions as SubscriptionReminder[]) {
      try {
        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", subscription.user_id)
          .single();

        // Get user email from auth
        const { data: userData } = await supabase.auth.admin.getUserById(subscription.user_id);

        if (!userData?.user?.email) {
          console.log(`No email found for user ${subscription.user_id}, skipping`);
          continue;
        }

        // Get product details
        const { data: product } = await supabase
          .from("products")
          .select("name, image")
          .eq("id", subscription.product_id)
          .single();

        const firstName = (profile as Profile | null)?.first_name || "there";
        const productName = (product as Product | null)?.name || "your subscription";
        const productImage = (product as Product | null)?.image || "";
        const renewalDate = new Date(subscription.next_delivery_date).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        });

        const emailHtml = generateReminderEmailHtml(
          firstName,
          productName,
          productImage,
          subscription.price,
          subscription.frequency,
          renewalDate
        );

        const emailResponse = await resend.emails.send({
          from: "Healios <hello@thehealios.com>",
          to: [userData.user.email],
          subject: `Your ${productName} subscription renews in 3 days`,
          html: emailHtml,
        });

        console.log(`Reminder email sent to ${userData.user.email} for subscription ${subscription.id}:`, emailResponse);
        successCount++;
      } catch (emailError) {
        console.error(`Failed to send reminder for subscription ${subscription.id}:`, emailError);
        errorCount++;
      }
    }

    console.log(`Subscription reminder job complete. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({ 
        message: "Subscription reminder job complete",
        processed: subscriptions.length,
        success: successCount,
        errors: errorCount
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-subscription-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

const escapeHtml = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

function generateReminderEmailHtml(
  firstName: string,
  productName: string,
  productImage: string,
  price: number,
  frequency: string,
  renewalDate: string
): string {
  const safeFirstName = escapeHtml(firstName);
  const safeProductName = escapeHtml(productName);
  const frequencyText = frequency === "monthly" ? "monthly" : frequency === "bimonthly" ? "every 2 months" : frequency;

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
                    Your Subscription Renews Soon
                  </h1>
                  
                  <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #555;">
                    Hi ${safeFirstName},
                  </p>
                  
                  <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #555;">
                    Just a friendly reminder that your ${safeProductName} subscription will automatically renew on <strong>${renewalDate}</strong>.
                  </p>
                  
                  <!-- Product Card -->
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9f9f9; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px;">
                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td width="80" style="padding-right: 16px;">
                              ${productImage 
                                ? `<img src="https://www.thehealios.com${escapeHtml(productImage)}" alt="${safeProductName}" width="80" height="80" style="display: block; border-radius: 8px; object-fit: cover;" />`
                                : `<div style="width: 80px; height: 80px; background: #eee; border-radius: 8px;"></div>`
                              }
                            </td>
                            <td style="vertical-align: middle;">
                              <p style="margin: 0 0 4px 0; font-size: 16px; color: #333; font-weight: 500;">${safeProductName}</p>
                              <p style="margin: 0 0 4px 0; font-size: 14px; color: #666;">Delivered ${frequencyText}</p>
                              <p style="margin: 0; font-size: 18px; color: #333; font-weight: 600;">£${price.toFixed(2)}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Info Box -->
                  <div style="background-color: #e8f5e9; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
                    <p style="margin: 0; font-size: 14px; color: #2e7d32;">
                      ✓ 15% subscriber discount already applied
                    </p>
                  </div>
                  
                  <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #555;">
                    No action needed if you're happy with your subscription. Want to make changes? You can skip, pause, or modify your subscription anytime from your account.
                  </p>
                  
                  <!-- CTA Buttons -->
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 10px 0;">
                        <a href="https://www.thehealios.com/account" 
                           style="display: inline-block; padding: 14px 32px; background-color: #333; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;">
                          MANAGE SUBSCRIPTION
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 16px;">
                    <tr>
                      <td align="center">
                        <a href="https://www.thehealios.com/shop" 
                           style="display: inline-block; padding: 12px 28px; border: 1px solid #333; color: #333; text-decoration: none; font-size: 13px; font-weight: 500;">
                          ADD MORE PRODUCTS
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
                    Need help? Contact us at 
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
