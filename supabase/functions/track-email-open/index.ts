import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b
]);

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get("c");
    const email = url.searchParams.get("e");

    if (campaignId && email) {
      const decodedEmail = decodeURIComponent(atob(email));
      
      console.log(`Tracking email open: campaign=${campaignId}, email=${decodedEmail}`);

      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

      // Check if we already recorded an open for this campaign/email combo
      const { data: existingOpen } = await supabase
        .from('email_campaign_events')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('recipient_email', decodedEmail)
        .eq('event_type', 'opened')
        .maybeSingle();

      // Only record first open to avoid duplicate counts
      if (!existingOpen) {
        const { error } = await supabase
          .from('email_campaign_events')
          .insert({
            campaign_id: campaignId,
            event_type: 'opened',
            recipient_email: decodedEmail,
            metadata: {
              user_agent: req.headers.get('user-agent'),
              opened_at: new Date().toISOString()
            }
          });

        if (error) {
          console.error('Error recording email open:', error);
        } else {
          console.log(`Recorded open for ${decodedEmail}`);
        }
      }
    }

    // Always return the tracking pixel
    return new Response(TRACKING_PIXEL, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error: any) {
    console.error("Error in track-email-open:", error);
    // Still return the pixel even on error
    return new Response(TRACKING_PIXEL, {
      status: 200,
      headers: { "Content-Type": "image/gif" },
    });
  }
};

serve(handler);
