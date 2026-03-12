import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const generateUnsubscribeHtml = (success: boolean, email: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? 'Unsubscribed' : 'Error'} - Healios</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f9f9f9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 500px;
      padding: 40px;
      text-align: center;
    }
    h1 {
      margin: 0 0 16px 0;
      font-size: 28px;
      font-weight: 300;
      color: #1a1a1a;
      letter-spacing: 2px;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 24px;
    }
    h2 {
      margin: 0 0 16px 0;
      font-size: 24px;
      font-weight: 500;
      color: #1a1a1a;
    }
    p {
      color: #666;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }
    .email {
      font-weight: 500;
      color: #1a1a1a;
    }
    a {
      display: inline-block;
      padding: 12px 24px;
      background: #1a1a1a;
      color: #fff;
      text-decoration: none;
      border-radius: 4px;
      font-size: 14px;
    }
    a:hover {
      background: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>HEALIOS</h1>
    <div class="icon">${success ? '✓' : '⚠'}</div>
    <h2>${success ? 'Successfully Unsubscribed' : 'Something Went Wrong'}</h2>
    <p>
      ${success 
        ? `You have been unsubscribed from our newsletter. <span class="email">${email}</span> will no longer receive marketing emails from us.`
        : 'We could not process your unsubscribe request. Please try again or contact support.'
      }
    </p>
    ${success 
      ? '<p style="color: #999; font-size: 14px;">Changed your mind? You can always resubscribe on our website.</p>'
      : ''
    }
    <a href="https://www.thehealios.com">Visit Healios</a>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get("c");
    const encodedEmail = url.searchParams.get("e");

    if (!encodedEmail) {
      return new Response(generateUnsubscribeHtml(false, ''), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    const email = decodeURIComponent(atob(encodedEmail));
    console.log(`Processing unsubscribe: campaign=${campaignId}, email=${email}`);

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Unsubscribe the user by setting is_active to false
    const { error: unsubError } = await supabase
      .from('newsletter_subscriptions')
      .update({ is_active: false })
      .eq('email', email);

    if (unsubError) {
      console.error('Error unsubscribing:', unsubError);
      return new Response(generateUnsubscribeHtml(false, email), {
        status: 500,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Track the unsubscribe event if campaign ID is provided
    if (campaignId) {
      const { error: eventError } = await supabase
        .from('email_campaign_events')
        .insert({
          campaign_id: campaignId,
          event_type: 'unsubscribed',
          recipient_email: email,
          metadata: {
            unsubscribed_at: new Date().toISOString()
          }
        });

      if (eventError) {
        console.error('Error recording unsubscribe event:', eventError);
      }
    }

    console.log(`Successfully unsubscribed ${email}`);

    return new Response(generateUnsubscribeHtml(true, email), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  } catch (error: any) {
    console.error("Error in track-unsubscribe:", error);
    return new Response(generateUnsubscribeHtml(false, ''), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
};

serve(handler);
