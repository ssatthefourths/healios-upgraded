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

interface NewsletterRequest {
  subject: string;
  content: string;
  recipients: string[];
  campaignId?: string;
  segments?: string[] | null;
}

const generateTrackingPixelUrl = (campaignId: string, email: string): string => {
  const encodedEmail = btoa(encodeURIComponent(email));
  return `https://yvctrcoftphjvcvgwbql.supabase.co/functions/v1/track-email-open?c=${campaignId}&e=${encodedEmail}`;
};

const generateUnsubscribeUrl = (campaignId: string | undefined, email: string): string => {
  const encodedEmail = btoa(encodeURIComponent(email));
  const params = campaignId ? `c=${campaignId}&e=${encodedEmail}` : `e=${encodedEmail}`;
  return `https://yvctrcoftphjvcvgwbql.supabase.co/functions/v1/track-unsubscribe?${params}`;
};

const generateNewsletterHtml = (content: string, campaignId?: string, recipientEmail?: string) => {
  const trackingPixel = campaignId && recipientEmail 
    ? `<img src="${generateTrackingPixelUrl(campaignId, recipientEmail)}" width="1" height="1" alt="" style="display:none;"/>`
    : '';
  
  const unsubscribeUrl = recipientEmail 
    ? generateUnsubscribeUrl(campaignId, recipientEmail)
    : 'https://www.thehealios.com';

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
            You received this email because you subscribed to our newsletter.<br>
            <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
          </p>
        </div>
      </div>
      ${trackingPixel}
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: verify_jwt = false — validate JWT in code
  // Reason: Newsletter sending requires admin role
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check admin role
  const userId = claimsData.claims.sub as string;
  const adminCheckClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: isAdmin } = await adminCheckClient.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { subject, content, recipients, campaignId, segments }: NewsletterRequest = await req.json();

    if (!subject || !content || !recipients?.length) {
      throw new Error("Missing required fields: subject, content, or recipients");
    }

    console.log(`Sending newsletter to ${recipients.length} recipients`);

    // Initialize Supabase client for tracking events
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Send emails in batches of 50 to avoid rate limits
    const batchSize = 50;
    const results = [];
    const sentEvents = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (email) => {
        try {
          // Generate personalized HTML with tracking pixel for this recipient
          const html = generateNewsletterHtml(content, campaignId, email);
          
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
            const error = await response.text();
            console.error(`Failed to send to ${email}: ${error}`);
            return { email, success: false, error };
          }

          return { email, success: true };
        } catch (error: any) {
          console.error(`Error sending to ${email}:`, error.message);
          return { email, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Track sent events for successful sends
      if (campaignId) {
        for (const result of batchResults) {
          if (result.success) {
            sentEvents.push({
              campaign_id: campaignId,
              event_type: 'sent',
              recipient_email: result.email,
              segment: segments && segments.length > 0 ? segments[0] : null,
            });
          }
        }
      }
      
      // Small delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Insert sent events in batches
    if (campaignId && sentEvents.length > 0) {
      const eventBatchSize = 100;
      for (let i = 0; i < sentEvents.length; i += eventBatchSize) {
        const eventBatch = sentEvents.slice(i, i + eventBatchSize);
        const { error: eventError } = await supabase
          .from('email_campaign_events')
          .insert(eventBatch);
        
        if (eventError) {
          console.error('Error inserting sent events:', eventError);
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Newsletter sent: ${successCount} successful, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: failCount,
        total: recipients.length 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-newsletter function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
