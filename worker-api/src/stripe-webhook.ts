/**
 * Stripe Webhook Handler
 * Verifies Stripe signatures using Web Crypto (no npm package needed).
 * Creates orders in D1 after successful payment.
 */

import { Env } from './index';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// ─── Stripe Signature Verification ────────────────────────────────────────────

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const parts = signature.split(',');
  const tPart = parts.find(p => p.startsWith('t='));
  const v1Part = parts.find(p => p.startsWith('v1='));
  if (!tPart || !v1Part) return false;

  const timestamp = tPart.substring(2);
  const v1 = v1Part.substring(3);

  // Reject stale webhooks (> 5 minutes old)
  const tolerance = 300;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > tolerance) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${timestamp}.${payload}`)
  );

  const computed = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Timing-safe comparison
  if (computed.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ v1.charCodeAt(i);
  }
  return diff === 0;
}

// ─── Main Handler ──────────────────────────────────────────────────────────────

export async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const webhookSecret = (env as any).STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return json({ error: 'Webhook secret not configured' }, 500);
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) return json({ error: 'Missing stripe-signature' }, 400);

  const payload = await request.text();

  const valid = await verifyStripeSignature(payload, signature, webhookSecret);
  if (!valid) {
    console.error('Stripe webhook signature verification failed');
    return json({ error: 'Invalid signature' }, 400);
  }

  let event: any;
  try {
    event = JSON.parse(payload);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  console.log('Stripe webhook:', event.type, event.id);

  // Idempotency check
  const existing = await env.DB.prepare(
    'SELECT id FROM processed_webhook_events WHERE stripe_event_id = ? LIMIT 1'
  ).bind(event.id).first();

  if (existing) {
    return json({ received: true, already_processed: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object, env);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, env);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, env);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object, env);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object, env);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object, env);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    // Mark as processed
    await env.DB.prepare(
      'INSERT OR IGNORE INTO processed_webhook_events (stripe_event_id, event_type, created_at) VALUES (?, ?, ?)'
    ).bind(event.id, event.type, new Date().toISOString()).run();

    return json({ received: true });
  } catch (err: any) {
    console.error('Webhook processing error:', err.message);
    return json({ error: err.message }, 500);
  }
}

// ─── Event Handlers ───────────────────────────────────────────────────────────

async function handleCheckoutComplete(session: any, env: Env) {
  const meta = session.metadata || {};

  let cartItems: any[] = [];
  try { cartItems = JSON.parse(meta.cart_items || '[]'); } catch {}

  const shippingCost = parseFloat(meta.shipping_cost || '0');
  const subtotal = cartItems.reduce((sum: number, item: any) => {
    const price = item.isSubscription ? item.price * 0.85 : item.price;
    return sum + price * item.quantity;
  }, 0);
  const total = subtotal + shippingCost;

  // Guest order access token
  let accessToken: string | null = null;
  let tokenExpiresAt: string | null = null;
  if (!meta.user_id) {
    accessToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  // Create order
  const orderId = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO orders (
      id, user_id, email, first_name, last_name, phone,
      shipping_address, shipping_city, shipping_postal_code, shipping_country,
      billing_address, billing_city, billing_postal_code, billing_country,
      subtotal, shipping_cost, discount_amount, discount_code, total,
      shipping_method, status, stripe_session_id, access_token, token_expires_at, created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    orderId,
    meta.user_id || null,
    meta.customer_email,
    meta.customer_first_name,
    meta.customer_last_name,
    meta.customer_phone || null,
    meta.shipping_address,
    meta.shipping_city,
    meta.shipping_postal_code,
    meta.shipping_country,
    meta.billing_address || null,
    meta.billing_city || null,
    meta.billing_postal_code || null,
    meta.billing_country || null,
    subtotal,
    shippingCost,
    0,
    meta.discount_code || null,
    total,
    meta.shipping_method || null,
    'pending',
    session.id,
    accessToken,
    tokenExpiresAt,
    new Date().toISOString()
  ).run();

  console.log('Order created:', orderId);

  // Create order items
  for (const item of cartItems) {
    const unitPrice = item.isSubscription ? item.price * 0.85 : item.price;
    await env.DB.prepare(`
      INSERT INTO order_items (
        id, order_id, product_id, product_name, product_image, product_category,
        quantity, unit_price, line_total, is_subscription, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      crypto.randomUUID(),
      orderId,
      item.id,
      item.name || '',
      item.image || '',
      item.category || '',
      item.quantity,
      unitPrice,
      unitPrice * item.quantity,
      item.isSubscription ? 1 : 0,
      new Date().toISOString()
    ).run();
  }

  // Decrement stock
  for (const item of cartItems) {
    await env.DB.prepare(
      `UPDATE products
       SET stock_quantity = MAX(0, stock_quantity - ?)
       WHERE id = ? AND track_inventory = 1`
    ).bind(item.quantity, item.id).run();
  }

  // Increment discount usage
  if (meta.discount_code) {
    await env.DB.prepare(
      `UPDATE discount_codes SET current_uses = current_uses + 1 WHERE code = ?`
    ).bind(meta.discount_code).run();
  }

  // Subscriptions
  if (session.mode === 'subscription' && session.subscription && meta.user_id) {
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription : session.subscription.id;

    for (const item of cartItems.filter((i: any) => i.isSubscription)) {
      await env.DB.prepare(`
        INSERT INTO subscriptions (
          id, user_id, product_id, status, frequency, price,
          next_delivery_date, stripe_subscription_id, created_at
        ) VALUES (?,?,?,?,?,?,?,?,?)
      `).bind(
        crypto.randomUUID(),
        meta.user_id,
        item.id,
        'active',
        'monthly',
        item.price * 0.85,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subscriptionId,
        new Date().toISOString()
      ).run();
    }
  }

  // Send confirmation email via Resend if configured
  const resendKey = (env as any).RESEND_API_KEY;
  if (resendKey && meta.customer_email) {
    try {
      await sendOrderConfirmationEmail(resendKey, {
        orderId,
        email: meta.customer_email,
        firstName: meta.customer_first_name,
        lastName: meta.customer_last_name,
        items: cartItems,
        subtotal,
        shippingCost,
        total,
        shippingMethod: meta.shipping_method || 'standard',
      });
    } catch (e: any) {
      console.error('Confirmation email failed:', e.message);
    }
  }
}

async function handleSubscriptionUpdated(subscription: any, env: Env) {
  const statusMap: Record<string, string> = {
    active: 'active',
    paused: 'paused',
    canceled: 'cancelled',
    past_due: 'past_due',
  };
  const status = statusMap[subscription.status] || subscription.status;

  await env.DB.prepare(
    `UPDATE subscriptions SET status = ?, updated_at = ? WHERE stripe_subscription_id = ?`
  ).bind(status, new Date().toISOString(), subscription.id).run();
}

async function handleSubscriptionDeleted(subscription: any, env: Env) {
  await env.DB.prepare(
    `UPDATE subscriptions SET status = 'cancelled', cancelled_at = ?, updated_at = ?
     WHERE stripe_subscription_id = ?`
  ).bind(new Date().toISOString(), new Date().toISOString(), subscription.id).run();
}

async function handleInvoicePaymentSucceeded(invoice: any, env: Env) {
  if (invoice.billing_reason !== 'subscription_cycle') return;
  if (!invoice.subscription) return;

  const subId = typeof invoice.subscription === 'string'
    ? invoice.subscription : invoice.subscription.id;

  await env.DB.prepare(
    `UPDATE subscriptions SET next_delivery_date = ?, updated_at = ?
     WHERE stripe_subscription_id = ?`
  ).bind(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    new Date().toISOString(),
    subId
  ).run();
}

async function handleChargeRefunded(charge: any, env: Env) {
  const piId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent : charge.payment_intent?.id;
  if (!piId) return;

  // Best-effort: find order by stripe_session_id containing the charge/pi id
  await env.DB.prepare(
    `UPDATE orders SET status = 'refunded', updated_at = ?
     WHERE stripe_session_id LIKE ? OR stripe_session_id LIKE ?`
  ).bind(
    new Date().toISOString(),
    `%${charge.id}%`,
    `%${piId}%`
  ).run();
}

async function handlePaymentFailed(paymentIntent: any, env: Env) {
  // Log failure for analytics — order recovery email can be added later
  console.log('Payment failed:', paymentIntent.id,
    paymentIntent.last_payment_error?.message || 'unknown reason');
}

// ─── Email (Resend) ────────────────────────────────────────────────────────────

async function sendOrderConfirmationEmail(
  resendKey: string,
  opts: {
    orderId: string;
    email: string;
    firstName: string;
    lastName: string;
    items: any[];
    subtotal: number;
    shippingCost: number;
    total: number;
    shippingMethod: string;
  }
) {
  const itemsList = opts.items
    .map(i => `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;">${i.name} × ${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">£${(i.price * i.quantity).toFixed(2)}</td>
    </tr>`)
    .join('');

  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
    <h1 style="font-size:24px;font-weight:400;">Order confirmed</h1>
    <p>Hi ${opts.firstName}, thank you for your order!</p>
    <p style="color:#666;">Order reference: <strong>${opts.orderId.slice(0, 8).toUpperCase()}</strong></p>
    <table width="100%" style="border-collapse:collapse;margin:20px 0;">${itemsList}</table>
    <table width="100%" style="border-collapse:collapse;">
      <tr><td>Subtotal</td><td style="text-align:right;">£${opts.subtotal.toFixed(2)}</td></tr>
      <tr><td>Shipping (${opts.shippingMethod})</td><td style="text-align:right;">${opts.shippingCost === 0 ? 'Free' : '£' + opts.shippingCost.toFixed(2)}</td></tr>
      <tr><td><strong>Total</strong></td><td style="text-align:right;"><strong>£${opts.total.toFixed(2)}</strong></td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #eee;margin:30px 0;"/>
    <p style="color:#999;font-size:12px;text-align:center;">The Healios | hello@thehealios.com</p>
  </body></html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Healios <orders@thehealios.com>',
      to: opts.email,
      subject: `Order confirmed — Healios #${opts.orderId.slice(0, 8).toUpperCase()}`,
      html,
    }),
  });
}
