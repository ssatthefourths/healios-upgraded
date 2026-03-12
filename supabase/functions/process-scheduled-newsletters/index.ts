import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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

const generateNewsletterHtml = (content: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9f9f9;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: 2px;">HEALIOS</h1>
          <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">The Healios Health Co.</p>
        </div>
        
        <div style="background: #fff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <div style="color: #1a1a1a; line-height: 1.6; font-size: 16px;">
            ${content.replace(/\n/g, '<br>')}
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 32px; color: #999; font-size: 12px;">
          <p style="margin: 0 0 8px 0;">
            <a href="https://www.thehealios.com" style="color: #666;">Visit our website</a>
          </p>
          <p style="margin: 0 0 8px 0;">Questions? Contact us at <a href="mailto:support@thehealios.com" style="color: #666;">support@thehealios.com</a></p>
          <p style="margin: 0;">© ${new Date().getFullYear()} The Healios Health Co. All rights reserved.</p>
          <p style="margin: 16px 0 0 0; color: #bbb; font-size: 11px;">
            You received this email because you subscribed to our newsletter.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const sendEmailBatch = async (recipients: string[], subject: string, html: string) => {
  const batchSize = 50;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    const batchPromises = batch.map(async (email) => {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Healios <hello@thehealios.com>",
            to: [email],
            subject,
            html,
          }),
        });

        if (!response.ok) {
          console.error(`Failed to send to ${email}`);
          return false;
        }
        return true;
      } catch (error) {
        console.error(`Error sending to ${email}:`, error);
        return false;
      }
    });

    const results = await Promise.all(batchPromises);
    successCount += results.filter(r => r).length;
    failCount += results.filter(r => !r).length;

    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { successCount, failCount };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Checking for scheduled newsletters to send...");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get pending newsletters that are due
    const now = new Date().toISOString();
    const { data: pendingNewsletters, error: fetchError } = await supabase
      .from("scheduled_newsletters")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", now);

    if (fetchError) {
      console.error("Error fetching scheduled newsletters:", fetchError);
      throw fetchError;
    }

    if (!pendingNewsletters || pendingNewsletters.length === 0) {
      console.log("No newsletters to send at this time");
      return new Response(
        JSON.stringify({ message: "No newsletters to send" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${pendingNewsletters.length} newsletter(s) to send`);

    // Get active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from("newsletter_subscriptions")
      .select("email")
      .eq("is_active", true);

    if (subError) {
      console.error("Error fetching subscribers:", subError);
      throw subError;
    }

    const recipients = subscribers?.map(s => s.email) || [];

    if (recipients.length === 0) {
      console.log("No active subscribers");
      return new Response(
        JSON.stringify({ message: "No active subscribers" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Process each newsletter
    for (const newsletter of pendingNewsletters) {
      console.log(`Sending newsletter: ${newsletter.subject}`);

      const html = generateNewsletterHtml(newsletter.content);
      const { successCount, failCount } = await sendEmailBatch(recipients, newsletter.subject, html);

      // Update newsletter status
      const status = failCount === recipients.length ? "failed" : "sent";
      await supabase
        .from("scheduled_newsletters")
        .update({
          status,
          sent_at: new Date().toISOString(),
          recipients_count: successCount,
          updated_at: new Date().toISOString()
        })
        .eq("id", newsletter.id);

      console.log(`Newsletter ${newsletter.id} sent: ${successCount} success, ${failCount} failed`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: pendingNewsletters.length,
        recipients: recipients.length 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in process-scheduled-newsletters:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
