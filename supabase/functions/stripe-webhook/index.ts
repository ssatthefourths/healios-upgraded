import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_TEST_RESTRICT_KEY");
  if (!stripeKey) {
    console.error("Stripe key not configured");
    return new Response("Stripe key not configured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2023-10-16",
  });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_SIGNING_SECRET");

    // Verify webhook signature for security
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    if (!signature) {
      console.error("Missing stripe-signature header");
      return new Response("Missing signature", { status: 400 });
    }

    let event: Stripe.Event;
    
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    console.log("Received Stripe webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session, supabase, stripe);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, supabase);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, supabase);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice, supabase);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge, supabase);
        break;
      }

      case "charge.refund.updated": {
        const refund = event.data.object as Stripe.Refund;
        console.log("Refund updated:", refund.id, "Status:", refund.status);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent, supabase);
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        await handleDisputeCreated(dispute, supabase);
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function handleCheckoutComplete(
  session: Stripe.Checkout.Session,
  supabase: any,
  stripe: Stripe
) {
  console.log("Processing checkout.session.completed:", session.id);
  
  const metadata = session.metadata || {};
  
  // Parse cart items from metadata
  let cartItems: any[] = [];
  try {
    cartItems = JSON.parse(metadata.cart_items || "[]");
  } catch (e) {
    console.error("Error parsing cart items:", e);
  }

  // Calculate order totals
  const subtotal = cartItems.reduce((sum: number, item: any) => {
    const price = item.isSubscription ? item.price * 0.85 : item.price;
    return sum + (price * item.quantity);
  }, 0);
  
  const shippingCost = parseFloat(metadata.shipping_cost || "0");
  const total = subtotal + shippingCost;

  // Generate secure access token for guest orders with expiration
  let accessToken: string | null = null;
  let tokenExpiresAt: string | null = null;
  
  if (!metadata.user_id) {
    // Generate cryptographically secure 64-character token
    const { data: tokenData, error: tokenError } = await supabase.rpc("generate_secure_order_token");
    
    if (tokenError) {
      console.error("Error generating secure token, falling back:", tokenError);
      // Fallback to crypto.randomUUID if database function fails
      accessToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
    } else {
      accessToken = tokenData;
    }
    
    // Set token expiration to 30 days from now
    tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    console.log("Generated secure guest order token with 30-day expiration");
  }

  // Create order
  const orderData = {
    user_id: metadata.user_id || null,
    email: metadata.customer_email,
    first_name: metadata.customer_first_name,
    last_name: metadata.customer_last_name,
    phone: metadata.customer_phone || null,
    shipping_address: metadata.shipping_address,
    shipping_city: metadata.shipping_city,
    shipping_postal_code: metadata.shipping_postal_code,
    shipping_country: metadata.shipping_country,
    billing_address: metadata.billing_address || null,
    billing_city: metadata.billing_city || null,
    billing_postal_code: metadata.billing_postal_code || null,
    billing_country: metadata.billing_country || null,
    subtotal: subtotal,
    shipping_cost: shippingCost,
    discount_amount: 0,
    discount_code: metadata.discount_code || null,
    total: total,
    shipping_method: metadata.shipping_method || null,
    status: "pending",
    stripe_session_id: session.id,
    access_token: accessToken,
    token_expires_at: tokenExpiresAt,
  };

  console.log("Creating order:", orderData);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert(orderData)
    .select()
    .single();

  if (orderError) {
    console.error("Error creating order:", orderError);
    throw orderError;
  }

  console.log("Order created:", order.id);

  // Create order items
  const orderItems = cartItems.map((item: any) => ({
    order_id: order.id,
    product_id: item.id,
    product_name: item.name,
    product_image: item.image,
    product_category: item.category,
    quantity: item.quantity,
    unit_price: item.isSubscription ? item.price * 0.85 : item.price,
    line_total: (item.isSubscription ? item.price * 0.85 : item.price) * item.quantity,
    is_subscription: item.isSubscription || false,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    console.error("Error creating order items:", itemsError);
    throw itemsError;
  }

  console.log("Order items created");

  // Increment discount code usage if one was used
  if (metadata.discount_code) {
    const { error: discountError } = await supabase.rpc("increment_discount_usage", {
      discount_code: metadata.discount_code
    });
    
    if (discountError) {
      console.error("Error incrementing discount code usage:", discountError);
    } else {
      console.log("Discount code usage incremented:", metadata.discount_code);
    }
  }

  // Decrement stock for each item
  for (const item of cartItems) {
    const { data: stockResult, error: stockError } = await supabase.rpc(
      "decrement_stock",
      { p_product_id: item.id, p_quantity: item.quantity }
    );

    if (stockError) {
      console.error(`Error decrementing stock for ${item.id}:`, stockError);
    } else {
      console.log(`Stock decremented for ${item.id}:`, stockResult);
    }
  }

  // Track purchase analytics for each product
  const sessionId = `stripe_${session.id}`;
  for (const item of cartItems) {
    const { error: analyticsError } = await supabase.from("product_analytics").insert({
      product_id: item.id,
      event_type: "purchase",
      user_id: metadata.user_id || null,
      session_id: sessionId,
      metadata: { quantity: item.quantity, price: item.price, order_id: order.id },
    });
    
    if (analyticsError) {
      console.error(`Error tracking purchase analytics for product ${item.id}:`, analyticsError);
    } else {
      console.log(`Purchase analytics tracked for product ${item.id}`);
    }
  }

  // Create subscriptions for subscription items
  if (session.mode === "subscription" && session.subscription) {
    const subscriptionId = typeof session.subscription === "string" 
      ? session.subscription 
      : session.subscription.id;

    // Get subscription details from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

    for (const item of cartItems.filter((i: any) => i.isSubscription)) {
      const subscriptionData = {
        user_id: metadata.user_id || null,
        product_id: item.id,
        status: "active",
        frequency: "monthly",
        price: item.price * 0.85,
        next_delivery_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        stripe_subscription_id: subscriptionId,
      };

      if (metadata.user_id) {
        const { error: subError } = await supabase
          .from("subscriptions")
          .insert(subscriptionData);

        if (subError) {
          console.error("Error creating subscription:", subError);
        } else {
          console.log("Subscription created for product:", item.id);
        }
      }
    }
  }

  // Send confirmation email
  try {
    const emailPayload = {
      type: "confirmation",
      order_id: order.id,
      email: metadata.customer_email,
      first_name: metadata.customer_first_name,
      last_name: metadata.customer_last_name,
      shipping_address: metadata.shipping_address,
      shipping_city: metadata.shipping_city,
      shipping_postal_code: metadata.shipping_postal_code,
      shipping_country: metadata.shipping_country,
      subtotal: subtotal,
      shipping_cost: shippingCost,
      total: total,
      shipping_method: metadata.shipping_method || "standard",
      items: orderItems,
    };

    const { error: emailError } = await supabase.functions.invoke("send-order-email", {
      body: emailPayload,
    });

    if (emailError) {
      console.error("Error sending confirmation email:", emailError);
    } else {
      console.log("Confirmation email sent");
    }
  } catch (emailErr) {
    console.error("Error invoking email function:", emailErr);
  }

  // Send Slack notification
  try {
    const slackPayload = {
      order_id: order.id,
      email: metadata.customer_email,
      first_name: metadata.customer_first_name,
      last_name: metadata.customer_last_name,
      shipping_address: metadata.shipping_address,
      shipping_city: metadata.shipping_city,
      shipping_postal_code: metadata.shipping_postal_code,
      shipping_country: metadata.shipping_country,
      subtotal: subtotal,
      shipping_cost: shippingCost,
      total: total,
      items: orderItems,
    };

    const { error: slackError } = await supabase.functions.invoke("notify-slack-order", {
      body: slackPayload,
    });

    if (slackError) {
      console.error("Error sending Slack notification:", slackError);
    } else {
      console.log("Slack notification sent");
    }
  } catch (slackErr) {
    console.error("Error invoking Slack function:", slackErr);
  }

  // Award loyalty points for logged-in users (1 point per £1 spent)
  if (metadata.user_id) {
    const pointsToAward = Math.floor(total);
    if (pointsToAward > 0) {
      try {
        const { data: pointsResult, error: pointsError } = await supabase.rpc(
          "add_loyalty_points",
          {
            p_user_id: metadata.user_id,
            p_points: pointsToAward,
            p_order_id: order.id,
            p_description: `Earned from order #${order.id.slice(0, 8)}`
          }
        );
        
        if (pointsError) {
          console.error("Error awarding loyalty points:", pointsError);
        } else {
          console.log(`Awarded ${pointsToAward} loyalty points to user ${metadata.user_id}`);
        }
      } catch (loyaltyErr) {
        console.error("Error in loyalty points function:", loyaltyErr);
      }
    }

    // Complete referral if this is user's first order with a referral code
    if (metadata.referral_code) {
      try {
        const { data: referralResult, error: referralError } = await supabase.rpc(
          "complete_referral",
          {
            p_referred_user_id: metadata.user_id,
            p_order_id: order.id
          }
        );
        
        if (referralError) {
          console.error("Error completing referral:", referralError);
        } else if (referralResult) {
          console.log(`Referral completed for user ${metadata.user_id}`);
        }
      } catch (refErr) {
        console.error("Error in referral completion:", refErr);
      }
    }
  }

  // Fraud detection: Check for suspicious order patterns
  await checkFraudIndicators(supabase, order.id, orderData, cartItems);
}

/**
 * Check for potential fraud indicators on new orders
 */
async function checkFraudIndicators(
  supabase: any,
  orderId: string,
  orderData: any,
  cartItems: any[]
) {
  const fraudIndicators: string[] = [];
  
  // High-value order threshold (£150+)
  if (orderData.total >= 150) {
    fraudIndicators.push("high_value_order");
    console.log(`🚨 High-value order detected: £${orderData.total}`);
  }
  
  // Large quantity single item (5+)
  const largeQuantityItems = cartItems.filter((item: any) => item.quantity >= 5);
  if (largeQuantityItems.length > 0) {
    fraudIndicators.push("large_quantity");
    console.log(`🚨 Large quantity order detected: ${largeQuantityItems.map((i: any) => `${i.name} x${i.quantity}`).join(", ")}`);
  }
  
  // Multiple different items (5+ unique products)
  if (cartItems.length >= 5) {
    fraudIndicators.push("many_unique_items");
    console.log(`🚨 Many unique items: ${cartItems.length} different products`);
  }
  
  // Guest checkout with high value
  if (!orderData.user_id && orderData.total >= 100) {
    fraudIndicators.push("guest_high_value");
    console.log(`🚨 Guest checkout with high value: £${orderData.total}`);
  }

  // Check for repeat orders from same email in last hour
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentOrders, error } = await supabase
      .from("orders")
      .select("id")
      .eq("email", orderData.email)
      .gte("created_at", oneHourAgo)
      .neq("id", orderId);
    
    if (!error && recentOrders && recentOrders.length >= 2) {
      fraudIndicators.push("rapid_repeat_orders");
      console.log(`🚨 Rapid repeat orders: ${recentOrders.length + 1} orders in last hour from ${orderData.email}`);
    }
  } catch (err) {
    console.error("Error checking recent orders:", err);
  }
  
  // Log fraud indicators if any were found
  if (fraudIndicators.length > 0) {
    await logFraudIndicator(supabase, orderId, "new_order_flags", {
      indicators: fraudIndicators,
      order_total: orderData.total,
      item_count: cartItems.length,
      is_guest: !orderData.user_id,
      email: orderData.email,
      shipping_country: orderData.shipping_country,
    });
    
    console.log(`⚠️ Order ${orderId} flagged with ${fraudIndicators.length} indicator(s): ${fraudIndicators.join(", ")}`);
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log("Processing subscription update:", subscription.id);

  const status = subscription.status === "active" ? "active" : 
                 subscription.status === "paused" ? "paused" : 
                 subscription.status === "canceled" ? "cancelled" : subscription.status;

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: status,
      updated_at: new Date().toISOString(),
      paused_at: subscription.status === "paused" ? new Date().toISOString() : null,
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Error updating subscription:", error);
  } else {
    console.log("Subscription updated successfully");
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log("Processing subscription deletion:", subscription.id);

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Error cancelling subscription:", error);
  } else {
    console.log("Subscription cancelled successfully");
  }
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
) {
  console.log("Processing invoice payment:", invoice.id);

  // Only process subscription renewals (not initial payments)
  if (invoice.billing_reason !== "subscription_cycle") {
    console.log("Not a renewal invoice, skipping");
    return;
  }

  // Update next delivery date for the subscription
  if (invoice.subscription) {
    const subscriptionId = typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription.id;

    const nextDeliveryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("subscriptions")
      .update({
        next_delivery_date: nextDeliveryDate,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId);

    if (error) {
      console.error("Error updating subscription delivery date:", error);
    } else {
      console.log("Subscription delivery date updated");
    }
  }
}

async function handleChargeRefunded(
  charge: Stripe.Charge,
  supabase: any
) {
  console.log("Processing refund for charge:", charge.id);
  
  // Find the order by looking at the payment intent's metadata or session
  const paymentIntentId = typeof charge.payment_intent === "string" 
    ? charge.payment_intent 
    : charge.payment_intent?.id;
  
  if (!paymentIntentId) {
    console.error("No payment intent found for charge:", charge.id);
    return;
  }
  
  // Try to find the order via stripe_session_id or by matching the payment
  // First, let's look for orders that might match this payment
  const { data: orders, error: orderError } = await supabase
    .from("orders")
    .select("id, status, total")
    .or(`stripe_session_id.ilike.%${charge.id}%,stripe_session_id.ilike.%${paymentIntentId}%`)
    .limit(1);
  
  if (orderError) {
    console.error("Error finding order for refund:", orderError);
    
    // Alternative approach: find by amount and recent creation date
    const { data: recentOrders, error: recentError } = await supabase
      .from("orders")
      .select("id, status, total, stripe_session_id")
      .eq("total", charge.amount / 100) // Stripe amounts are in pence
      .in("status", ["pending", "processing", "shipped", "delivered"])
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (!recentError && recentOrders && recentOrders.length > 0) {
      // Log for manual review
      console.log("Potential orders for refund (manual review may be needed):", recentOrders.map((o: any) => o.id));
    }
    
    return;
  }
  
  if (!orders || orders.length === 0) {
    console.log("No matching order found for refund. Charge ID:", charge.id);
    // Log refund details for manual reconciliation
    console.log("Refund details - Amount:", charge.amount_refunded, "Currency:", charge.currency);
    return;
  }
  
  const order = orders[0];
  const isFullRefund = charge.refunded;
  const refundedAmount = charge.amount_refunded / 100; // Convert from pence to pounds
  
  console.log(`Refund detected for order ${order.id}. Full refund: ${isFullRefund}, Amount: £${refundedAmount}`);
  
  // Update order status to refunded
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "refunded",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);
  
  if (updateError) {
    console.error("Error updating order status to refunded:", updateError);
  } else {
    console.log("Order status updated to refunded:", order.id);
  }
  
  // Fraud logging: log refund for analysis
  logFraudIndicator(supabase, order.id, "refund", {
    charge_id: charge.id,
    refunded_amount: refundedAmount,
    is_full_refund: isFullRefund,
    refund_reason: charge.refunds?.data?.[0]?.reason || "unknown",
  });
}

/**
 * Handle payment failure and send recovery email
 */
async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
) {
  console.log("Processing payment failure:", paymentIntent.id);
  
  const metadata = paymentIntent.metadata || {};
  const email = paymentIntent.receipt_email || metadata.customer_email;
  
  if (!email) {
    console.log("No email available for payment failure recovery");
    return;
  }
  
  // Parse cart items if available
  let cartItems: any[] = [];
  try {
    cartItems = JSON.parse(metadata.cart_items || "[]");
  } catch (e) {
    console.log("No cart items in payment intent metadata");
  }
  
  if (cartItems.length === 0) {
    console.log("No cart items to recover");
    return;
  }
  
  const failureReason = paymentIntent.last_payment_error?.message || "Payment declined";
  const failureCode = paymentIntent.last_payment_error?.code || "unknown";
  
  console.log("Payment failure reason:", failureReason, "Code:", failureCode);
  
  // Generate recovery token
  const recoveryToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
  
  // Store recovery data
  const { error: recoveryError } = await supabase.from("checkout_recovery").insert({
    token: recoveryToken,
    email: email,
    cart_items: cartItems,
    customer_details: {
      first_name: metadata.customer_first_name,
      last_name: metadata.customer_last_name,
      phone: metadata.customer_phone,
    },
    shipping_address: {
      address: metadata.shipping_address,
      city: metadata.shipping_city,
      postal_code: metadata.shipping_postal_code,
      country: metadata.shipping_country,
    },
    expires_at: expiresAt,
  });
  
  if (recoveryError) {
    console.error("Error creating recovery record:", recoveryError);
    return;
  }
  
  console.log("Recovery record created with token:", recoveryToken);
  
  // Send recovery email using Resend
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("RESEND_API_KEY not configured, cannot send recovery email");
    return;
  }
  
  const siteUrl = Deno.env.get("SITE_URL") || "https://healios.lovable.app";
  const recoveryUrl = `${siteUrl}/checkout?recover=${recoveryToken}`;
  
  const cartSummary = cartItems
    .map((item: any) => `${item.name} × ${item.quantity}`)
    .join(", ");
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="${siteUrl}/healios-logo.png" alt="Healios" style="height: 40px;" />
      </div>
      
      <h1 style="font-size: 24px; font-weight: 400; margin-bottom: 20px;">We noticed your payment didn't go through</h1>
      
      <p>Don't worry – your cart is saved and ready for you.</p>
      
      <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; font-weight: 500;">Your items:</p>
        <p style="margin: 0; color: #666;">${cartSummary}</p>
      </div>
      
      <p><strong>What happened:</strong> ${failureReason}</p>
      
      <p>This sometimes happens due to:</p>
      <ul style="color: #666;">
        <li>Insufficient funds</li>
        <li>Card security blocks for online purchases</li>
        <li>Temporary bank or network issues</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${recoveryUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500;">
          Complete Your Order
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">This link expires in 24 hours. If you need help, reply to this email.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      
      <p style="color: #999; font-size: 12px; text-align: center;">
        The Healios Health Co. | hello@thehealios.com
      </p>
    </body>
    </html>
  `;
  
  try {
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Healios <orders@thehealios.com>",
        to: email,
        subject: "Complete your Healios order – your cart is saved",
        html: emailHtml,
      }),
    });
    
    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Failed to send recovery email:", errorData);
    } else {
      console.log("Payment recovery email sent to:", email);
    }
  } catch (emailErr) {
    console.error("Error sending recovery email:", emailErr);
  }
  
  // Log for analytics
  try {
    await supabase.from("product_analytics").insert({
      product_id: "payment_recovery",
      event_type: "recovery_email_sent",
      session_id: `recovery_${recoveryToken}`,
      metadata: {
        email: email,
        failure_reason: failureReason,
        failure_code: failureCode,
        cart_item_count: cartItems.length,
        recovery_token: recoveryToken,
      },
    });
  } catch (analyticsErr) {
    console.error("Error logging recovery analytics:", analyticsErr);
  }
}

/**
 * Handle dispute (chargeback) created
 */
async function handleDisputeCreated(
  dispute: Stripe.Dispute,
  supabase: any
) {
  console.log("Processing dispute:", dispute.id);
  
  const chargeId = typeof dispute.charge === "string" 
    ? dispute.charge 
    : dispute.charge?.id;
  
  console.log("Dispute details:", {
    id: dispute.id,
    amount: dispute.amount / 100,
    reason: dispute.reason,
    status: dispute.status,
    charge_id: chargeId,
  });
  
  // Log dispute for admin review
  await logFraudIndicator(supabase, null, "dispute_created", {
    dispute_id: dispute.id,
    charge_id: chargeId,
    amount: dispute.amount / 100,
    reason: dispute.reason,
    status: dispute.status,
    evidence_due_by: dispute.evidence_details?.due_by 
      ? new Date(dispute.evidence_details.due_by * 1000).toISOString() 
      : null,
  });
  
  // Try to find and update the related order
  if (chargeId) {
    const { data: orders } = await supabase
      .from("orders")
      .select("id")
      .ilike("stripe_session_id", `%${chargeId}%`)
      .limit(1);
    
    if (orders && orders.length > 0) {
      console.log("Found order for dispute:", orders[0].id);
      // Don't auto-cancel, just log for manual review
    }
  }
  
  console.log("⚠️ DISPUTE ALERT: Requires immediate attention. Evidence due:", 
    dispute.evidence_details?.due_by 
      ? new Date(dispute.evidence_details.due_by * 1000).toISOString() 
      : "Unknown");
}

/**
 * Log potential fraud indicators for analysis
 * This creates a log entry that can be reviewed by admins
 */
async function logFraudIndicator(
  supabase: any,
  orderId: string | null,
  indicatorType: string,
  metadata: Record<string, any>
) {
  console.log("🚨 Fraud indicator logged:", {
    order_id: orderId,
    indicator_type: indicatorType,
    metadata: metadata,
    timestamp: new Date().toISOString(),
  });
  
  // Store in product_analytics table for now (as a generic event log)
  // This could be enhanced to use a dedicated fraud_logs table
  try {
    await supabase.from("product_analytics").insert({
      product_id: orderId || "system",
      event_type: `fraud_indicator_${indicatorType}`,
      session_id: `fraud_${Date.now()}`,
      metadata: {
        ...metadata,
        indicator_type: indicatorType,
        logged_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to log fraud indicator:", error);
  }
}
