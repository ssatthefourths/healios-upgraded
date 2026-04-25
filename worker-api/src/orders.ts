import { Env } from './index';
import { sendDeliveryEmail } from './order-emails';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

/**
 * Public, read-only order lookup by access_token.
 * Used by the /order/:accessToken guest order page linked from the
 * Order Confirmed email. No auth required — the token is a 64-char random
 * UUID generated per-order by stripe-webhook.ts and expires after 30 days
 * (token_expires_at column). Returns the order summary + line items so the
 * guest can see what they bought without creating an account.
 */
async function handleGetOrderByToken(token: string, env: Env): Promise<Response> {
  if (!token || token.length < 20 || token.length > 128) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 400, headers: cors });
  }

  const order = await env.DB.prepare(
    `SELECT id, email, first_name, last_name,
            shipping_address, shipping_address_2, shipping_city,
            shipping_postal_code, shipping_country,
            shipping_method, shipping_cost, subtotal, discount_amount, total, currency,
            status, tracking_carrier, tracking_number, tracking_url,
            shipped_at, delivered_at, delivered_by,
            created_at, token_expires_at
     FROM orders
     WHERE access_token = ?`
  ).bind(token).first<any>();

  if (!order) {
    return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: cors });
  }

  if (order.token_expires_at) {
    const expiresAt = new Date(order.token_expires_at).getTime();
    if (!isNaN(expiresAt) && expiresAt < Date.now()) {
      return new Response(JSON.stringify({ error: 'Link has expired' }), { status: 410, headers: cors });
    }
  }

  const { results: items } = await env.DB.prepare(
    `SELECT product_id, product_name, product_image, product_category, quantity, unit_price, line_total, is_subscription
     FROM order_items
     WHERE order_id = ?
     ORDER BY id`
  ).bind(order.id).all();

  const { token_expires_at, ...safeOrder } = order;
  return new Response(
    JSON.stringify({ order: safeOrder, items: items ?? [] }),
    { headers: cors }
  );
}

/**
 * Customer-side "I have it" confirmation. The delivered transition can also
 * be done by admin (see admin-orders.ts PUT) — this route is for customers
 * who want to confirm receipt themselves from the guest order page.
 *
 * Auth model: the access_token in the URL is the same opaque 64-char UUID
 * already used by /orders/by-token/:token GETs. It's emailed to the
 * customer in the order-confirmation email and not stored anywhere
 * client-accessible — anyone who can present the token has demonstrated
 * (via inbox access) ownership of the order. Closes ticket #2 in
 * HealiosIssuesFeedback_v3.csv (the customer-confirm half of the
 * shipped→delivered transition).
 *
 * Idempotent: re-confirming an already-delivered order succeeds without
 * re-firing the email.
 */
async function handleCustomerConfirmDelivered(token: string, env: Env): Promise<Response> {
  if (!token || token.length < 20 || token.length > 128) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 400, headers: cors });
  }

  const order = await env.DB.prepare(
    `SELECT id, status, token_expires_at FROM orders WHERE access_token = ?`,
  ).bind(token).first<{ id: string; status: string; token_expires_at: string | null }>();

  if (!order) {
    return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: cors });
  }
  if (order.token_expires_at) {
    const expiresAt = new Date(order.token_expires_at).getTime();
    if (!isNaN(expiresAt) && expiresAt < Date.now()) {
      return new Response(JSON.stringify({ error: 'Link has expired' }), { status: 410, headers: cors });
    }
  }
  if (order.status === 'delivered') {
    return new Response(JSON.stringify({ ok: true, alreadyDelivered: true }), { headers: cors });
  }
  if (order.status !== 'shipped') {
    return new Response(
      JSON.stringify({ error: `Cannot confirm delivery from status '${order.status}'` }),
      { status: 409, headers: cors },
    );
  }

  const now = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE orders
     SET status = 'delivered', delivered_at = ?, delivered_by = 'customer', updated_at = ?
     WHERE id = ?`,
  ).bind(now, now, order.id).run();

  try {
    await sendDeliveryEmail(env, order.id);
  } catch (err: any) {
    console.error('[orders] delivery email failed:', err?.message);
  }

  return new Response(JSON.stringify({ ok: true }), { headers: cors });
}

export async function handleOrders(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'GET') {
    const byTokenMatch = path.match(/^\/orders\/by-token\/([^/]+)\/?$/);
    if (byTokenMatch) {
      return handleGetOrderByToken(decodeURIComponent(byTokenMatch[1]), env);
    }
  }

  if (request.method === 'POST') {
    const confirmDeliveredMatch = path.match(/^\/orders\/by-token\/([^/]+)\/confirm-delivered\/?$/);
    if (confirmDeliveredMatch) {
      return handleCustomerConfirmDelivered(decodeURIComponent(confirmDeliveredMatch[1]), env);
    }
  }

  return new Response(
    JSON.stringify({ error: 'Orders endpoint not found' }),
    { status: 404, headers: cors }
  );
}
