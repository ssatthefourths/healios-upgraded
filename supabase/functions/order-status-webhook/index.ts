import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderStatusEvent {
  event_type: "order.status_changed" | "order.created" | "order.shipped" | "order.delivered" | "order.cancelled" | "order.refunded";
  order_id: string;
  previous_status?: string;
  new_status: string;
  timestamp: string;
  order_data: {
    email: string;
    first_name: string;
    last_name: string;
    total: number;
    items_count: number;
  };
}

interface WebhookSubscriber {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  is_active: boolean;
}

/**
 * Emit order status change events to registered webhook subscribers
 * This function can be called internally or triggered by database changes
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { order_id, previous_status, new_status, trigger_source } = await req.json();

    console.log(`Order status webhook triggered for order ${order_id}: ${previous_status} -> ${new_status}`);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        email,
        first_name,
        last_name,
        total,
        status,
        created_at,
        updated_at,
        shipping_address,
        shipping_city,
        shipping_country
      `)
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch order items count
    const { count: itemsCount } = await supabase
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .eq("order_id", order_id);

    // Determine event type based on status
    const eventType = getEventType(new_status);

    // Create event payload
    const event: OrderStatusEvent = {
      event_type: eventType,
      order_id: order.id,
      previous_status: previous_status,
      new_status: new_status,
      timestamp: new Date().toISOString(),
      order_data: {
        email: order.email,
        first_name: order.first_name,
        last_name: order.last_name,
        total: order.total,
        items_count: itemsCount || 0,
      },
    };

    console.log("Event payload:", JSON.stringify(event));

    // Send customer notification email for status changes
    if (previous_status && previous_status !== new_status) {
      await sendStatusNotification(supabase, order, new_status, itemsCount || 0);
    }

    // Log event for analytics
    await logOrderEvent(supabase, event);

    // Notify Slack for important status changes
    if (["shipped", "delivered", "cancelled", "refunded"].includes(new_status)) {
      await notifySlackStatusChange(order, previous_status, new_status);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        event: eventType,
        order_id: order_id,
        message: `Order status webhook processed: ${previous_status} -> ${new_status}`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Error in order-status-webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getEventType(status: string): OrderStatusEvent["event_type"] {
  switch (status) {
    case "pending":
      return "order.created";
    case "shipped":
      return "order.shipped";
    case "delivered":
      return "order.delivered";
    case "cancelled":
      return "order.cancelled";
    case "refunded":
      return "order.refunded";
    default:
      return "order.status_changed";
  }
}

async function sendStatusNotification(
  supabase: any,
  order: any,
  newStatus: string,
  itemsCount: number
) {
  try {
    // Fetch order items for email
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);

    const emailPayload = {
      type: "status_update",
      order_id: order.id,
      email: order.email,
      first_name: order.first_name,
      last_name: order.last_name,
      status: newStatus,
      shipping_address: order.shipping_address,
      shipping_city: order.shipping_city,
      shipping_country: order.shipping_country,
      total: order.total,
      items: items || [],
    };

    const { error } = await supabase.functions.invoke("send-order-email", {
      body: emailPayload,
    });

    if (error) {
      console.error("Error sending status notification email:", error);
    } else {
      console.log(`Status notification email sent for order ${order.id}: ${newStatus}`);
    }
  } catch (err) {
    console.error("Error in sendStatusNotification:", err);
  }
}

async function logOrderEvent(supabase: any, event: OrderStatusEvent) {
  try {
    // Log to product_analytics for general event tracking
    // This creates a record of all order status changes for analytics
    const { error } = await supabase.from("product_analytics").insert({
      product_id: event.order_id, // Using order_id as reference
      event_type: event.event_type,
      session_id: `order_${event.order_id}`,
      metadata: {
        previous_status: event.previous_status,
        new_status: event.new_status,
        order_email: event.order_data.email,
        order_total: event.order_data.total,
        items_count: event.order_data.items_count,
      },
    });

    if (error) {
      console.error("Error logging order event:", error);
    } else {
      console.log(`Order event logged: ${event.event_type}`);
    }
  } catch (err) {
    console.error("Error in logOrderEvent:", err);
  }
}

async function notifySlackStatusChange(
  order: any,
  previousStatus: string | undefined,
  newStatus: string
) {
  const webhookUrl = Deno.env.get("SLACK_ORDERS_WEBHOOK_URL");
  if (!webhookUrl) {
    console.log("Slack webhook not configured, skipping notification");
    return;
  }

  try {
    const statusEmoji: Record<string, string> = {
      shipped: "📦",
      delivered: "✅",
      cancelled: "❌",
      refunded: "💸",
    };

    const emoji = statusEmoji[newStatus] || "📋";

    const slackMessage = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${emoji} Order Status Updated`,
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Order ID:*\n\`${order.id.slice(0, 8)}...\``,
            },
            {
              type: "mrkdwn",
              text: `*Status:*\n${previousStatus || "new"} → *${newStatus}*`,
            },
          ],
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Customer:*\n${order.first_name} ${order.last_name}`,
            },
            {
              type: "mrkdwn",
              text: `*Total:*\n£${order.total.toFixed(2)}`,
            },
          ],
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Updated at ${new Date().toLocaleString("en-GB", { timeZone: "Europe/London" })}`,
            },
          ],
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      console.error("Slack notification failed:", await response.text());
    } else {
      console.log("Slack status change notification sent");
    }
  } catch (err) {
    console.error("Error sending Slack notification:", err);
  }
}
