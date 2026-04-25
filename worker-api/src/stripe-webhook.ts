/**
 * Stripe Webhook Handler
 * Verifies Stripe signatures using Web Crypto (no npm package needed).
 * Creates orders in D1 after successful payment.
 */

import { Env } from './index';
import { renderOrderConfirmation } from './emails/generated';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `HLS-${date}-${rand}`;
}

// ─── Stripe Signature Verification ────────────────────────────────────────────

type VerifyResult =
  | { ok: true }
  | { ok: false; reason: 'malformed-signature-header' | 'timestamp-too-old' | 'signature-secret-mismatch'; details?: string };

/**
 * Sign {timestamp}.{bodyBytes} with the given secret using HMAC-SHA256.
 * bodyBytes is a raw Uint8Array to avoid any UTF-8 round-trip.
 * Secret is used as raw bytes — Stripe doesn't strip the `whsec_` prefix.
 */
async function hmacHex(timestamp: string, bodyBytes: Uint8Array, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  // signedPayload = timestamp_bytes + "." + body_bytes
  const tsBytes = encoder.encode(timestamp + '.');
  const buf = new Uint8Array(tsBytes.length + bodyBytes.length);
  buf.set(tsBytes, 0);
  buf.set(bodyBytes, tsBytes.length);
  const sig = await crypto.subtle.sign('HMAC', key, buf);
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyStripeSignature(
  bodyBytes: Uint8Array,
  signature: string,
  secret: string,
): Promise<VerifyResult> {
  const parts = signature.split(',');
  const tPart = parts.find(p => p.startsWith('t='));
  const v1Parts = parts.filter(p => p.startsWith('v1='));
  if (!tPart || v1Parts.length === 0) {
    return { ok: false, reason: 'malformed-signature-header' };
  }

  const timestamp = tPart.substring(2);

  const skewSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  const tolerance = 300;
  if (skewSeconds > tolerance) {
    return { ok: false, reason: 'timestamp-too-old', details: `skew=${Math.round(skewSeconds)}s` };
  }

  const computed = await hmacHex(timestamp, bodyBytes, secret);

  // There can be multiple v1= values (Stripe supports rolling secrets).
  // Accept the signature if ANY of them matches.
  for (const v1Part of v1Parts) {
    const v1 = v1Part.substring(3);
    if (computed.length !== v1.length) continue;
    let diff = 0;
    for (let i = 0; i < computed.length; i++) {
      diff |= computed.charCodeAt(i) ^ v1.charCodeAt(i);
    }
    if (diff === 0) return { ok: true };
  }

  const received = v1Parts[0].substring(3);
  return {
    ok: false,
    reason: 'signature-secret-mismatch',
    details: `computed=${computed.slice(0, 8)} received=${received.slice(0, 8)} secretLen=${secret.length} bodyLen=${bodyBytes.length}`,
  };
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

  // Read raw body bytes for signature verification, then decode for JSON.
  // Going bytes-first avoids any UTF-8 round-trip issue that could alter
  // what we HMAC vs what Stripe signed.
  const bodyBytes = new Uint8Array(await request.arrayBuffer());

  const result = await verifyStripeSignature(bodyBytes, signature, webhookSecret);
  if (!result.ok) {
    console.error(`Stripe webhook signature rejected: ${result.reason}`, result.details || '');
    return json({ error: result.reason, details: result.details }, 400);
  }

  const payload = new TextDecoder().decode(bodyBytes);
  let event: any;
  try {
    event = JSON.parse(payload);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  console.log('Stripe webhook:', event.type, event.id);

  // Idempotency check
  const existing = await env.DB.prepare(
    'SELECT stripe_event_id FROM processed_webhook_events WHERE stripe_event_id = ? LIMIT 1'
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

  // Stripe is the source of truth for money. session.amount_* are in the
  // checkout's display currency (e.g. ZAR) in minor units (cents). Divide
  // by 100 to store as REAL currency values — these are what the admin
  // dashboard and the customer's Account → Orders page display.
  const amountSubtotal = Number(session.amount_subtotal ?? 0) / 100;
  const amountTotal = Number(session.amount_total ?? 0) / 100;
  const amountDiscount = Number(session.total_details?.amount_discount ?? 0) / 100;
  const amountShipping = Number(session.total_details?.amount_shipping ?? 0) / 100;

  // Metadata shipping_cost was captured in display currency too — prefer
  // Stripe's reported shipping total. Fallback to metadata if absent.
  const shippingCost = amountShipping || parseFloat(meta.shipping_cost || '0');
  const subtotal = amountSubtotal || cartItems.reduce((sum: number, item: any) => {
    const price = item.isSubscription ? item.price * 0.85 : item.price;
    return sum + price * item.quantity;
  }, 0);
  const total = session.amount_total !== undefined ? amountTotal : (subtotal + shippingCost);
  const discountAmount = amountDiscount;

  // Guest order access token
  let accessToken: string | null = null;
  let tokenExpiresAt: string | null = null;
  if (!meta.user_id) {
    accessToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  // Create order
  const orderId = generateOrderNumber();
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
    discountAmount,
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

  // Create order items.
  // item.price comes from Stripe metadata which was written by checkout.ts after
  // the subscription discount was already applied (see worker-api/src/checkout.ts:165).
  // Re-applying * 0.85 here would double-discount and surface a wrong price on
  // the order-confirmation page (ticket #8 in HealiosIssuesFeedback_v3.csv).
  // Stripe still charges the customer the correct already-discounted amount;
  // this only affects the unit_price stored against the order record.
  for (const item of cartItems) {
    const unitPrice = item.price;
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

  // Decrement stock. For bundles, decrement each constituent product.
  for (const item of cartItems) {
    if (item.isBundle) {
      // Load bundle items (preferring DB over metadata in case the cart was stale)
      const { results: bundleItems } = await env.DB.prepare(
        'SELECT product_id, quantity FROM bundle_items WHERE bundle_id = ?'
      ).bind(item.id).all();
      const items = (bundleItems && bundleItems.length > 0)
        ? bundleItems
        : (item.bundleItems || []);
      for (const bi of items as any[]) {
        const decrementBy = (bi.quantity || 1) * item.quantity;
        await env.DB.prepare(
          `UPDATE products
           SET stock_quantity = MAX(0, stock_quantity - ?)
           WHERE id = ? AND track_inventory = 1`
        ).bind(decrementBy, bi.product_id).run();
      }
      continue;
    }
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
        // item.price is already the discounted subscription rate from checkout.ts.
        // Same bug class as line 253 — do not multiply by 0.85 again.
        item.price,
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
      const siteUrl = 'https://www.thehealios.com';
      const orderUrl = meta.user_id
        ? `${siteUrl}/account?tab=orders`
        : accessToken
          ? `${siteUrl}/order/${accessToken}`
          : `${siteUrl}/`;
      // Build the shipping-address block from the metadata Stripe collected at
      // checkout. Each line is included only if non-empty so we don't render
      // blank rows in the email.
      const customerName = `${meta.customer_first_name || ''} ${meta.customer_last_name || ''}`.trim();
      const addressLines = [
        meta.shipping_address,
        meta.shipping_city,
        meta.shipping_postal_code,
        meta.shipping_country,
      ].filter((s: any) => s && String(s).trim().length > 0) as string[];

      await sendOrderConfirmationEmail(resendKey, {
        orderId,
        email: meta.customer_email,
        firstName: meta.customer_first_name,
        lastName: meta.customer_last_name,
        items: cartItems,
        subtotal,
        shippingCost,
        discount: discountAmount > 0 ? discountAmount : undefined,
        total,
        shippingMethod: meta.shipping_method || 'standard',
        shippingAddress: addressLines.length > 0
          ? { name: customerName || 'Customer', lines: addressLines }
          : undefined,
        orderUrl,
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
    discount?: number;
    total: number;
    shippingMethod: string;
    shippingAddress?: { name: string; lines: string[] };
    orderUrl?: string;
  }
) {
  // Render Monique's React Email template with real order data. Pre-rendered
  // via @react-email/render — no React runtime in the Worker, just a string.
  // Template source: src/lib/emails/emails/transactional/01-order-confirmation.tsx
  const shippingStr =
    opts.shippingCost === 0 ? 'Free' : `£${opts.shippingCost.toFixed(2)}`;

  // Phase 8b will introduce per-recipient signed unsubscribe / preferences
  // tokens. For V1 we ship simple email-keyed query-string URLs so the
  // template doesn't render literal `{{unsubscribe_url}}` strings to customers.
  const emailParam = encodeURIComponent(opts.email);
  const unsubscribeUrl = `https://www.thehealios.com/unsubscribe?email=${emailParam}`;
  const preferencesUrl = `https://www.thehealios.com/account?tab=preferences`;

  const html = await renderOrderConfirmation({
    customerName: opts.firstName || 'there',
    orderNumber: opts.orderId,
    orderDate: new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    items: opts.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      price: `£${(Number(i.price) * Number(i.quantity)).toFixed(2)}`,
    })),
    subtotal: `£${opts.subtotal.toFixed(2)}`,
    shipping: shippingStr,
    discount: opts.discount && opts.discount > 0
      ? `−£${Number(opts.discount).toFixed(2)}`
      : undefined,
    total: `£${opts.total.toFixed(2)}`,
    shippingAddress: opts.shippingAddress,
    trackingUrl: opts.orderUrl,
    unsubscribeUrl,
    preferencesUrl,
  });

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Healios <orders@thehealios.com>',
      to: opts.email,
      subject: `Order confirmed — ${opts.orderId}`,
      html,
    }),
  });
}
