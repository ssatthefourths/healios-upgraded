import { Env } from './index';

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
            shipping_address, shipping_city, shipping_postal_code, shipping_country,
            shipping_method, shipping_cost, subtotal, discount_amount, total,
            currency, status, created_at, token_expires_at
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

  return new Response(
    JSON.stringify({ error: 'Orders endpoint not found' }),
    { status: 404, headers: cors }
  );
}
