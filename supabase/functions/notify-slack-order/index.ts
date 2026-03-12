import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
  quantity: number;
  unit_price: number;
  line_total: number;
  is_subscription?: boolean;
}

interface SlackOrderPayload {
  order_id: string;
  email: string;
  first_name: string;
  last_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  items: OrderItem[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const webhookUrl = Deno.env.get("SLACK_ORDERS_WEBHOOK_URL");
  if (!webhookUrl) {
    console.error("SLACK_ORDERS_WEBHOOK_URL not configured");
    return new Response("Slack webhook not configured", { status: 500 });
  }

  try {
    const payload: SlackOrderPayload = await req.json();
    console.log("Sending Slack notification for order:", payload.order_id);

    // Format items list
    const itemsList = payload.items
      .map((item) => {
        const subscriptionTag = item.is_subscription ? " 🔄" : "";
        return `• ${item.quantity}x ${item.product_name}${subscriptionTag} - £${item.line_total.toFixed(2)}`;
      })
      .join("\n");

    // Create Slack message with rich formatting
    const slackMessage = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🎉 New Order Received!",
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Order ID:*\n\`${payload.order_id.slice(0, 8)}...\``,
            },
            {
              type: "mrkdwn",
              text: `*Total:*\n*£${payload.total.toFixed(2)}*`,
            },
          ],
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Customer:*\n${payload.first_name} ${payload.last_name}`,
            },
            {
              type: "mrkdwn",
              text: `*Email:*\n${payload.email}`,
            },
          ],
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*📦 Items:*\n${itemsList}`,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Subtotal:* £${payload.subtotal.toFixed(2)}`,
            },
            {
              type: "mrkdwn",
              text: `*Shipping:* £${payload.shipping_cost.toFixed(2)}`,
            },
          ],
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*📍 Shipping Address:*\n${payload.shipping_address}\n${payload.shipping_city}, ${payload.shipping_postal_code}\n${payload.shipping_country}`,
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Order placed at ${new Date().toLocaleString("en-GB", { timeZone: "Europe/London" })}`,
            },
          ],
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Slack API error:", errorText);
      throw new Error(`Slack API error: ${response.status}`);
    }

    console.log("Slack notification sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error sending Slack notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
