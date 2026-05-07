/**
 * Notify-product-change — replaces functions.invoke('notify-product-change').
 *
 * Frontend (admin ProductList) calls this when a product's price/stock/
 * availability changes. Real fan-out email (Resend) lives in stock-emails.ts;
 * this endpoint stamps the trigger row in stock_notifications so the next
 * cron pass dispatches.
 *
 * Free-tier-friendly: no synchronous Resend send here. The stock-notifs
 * table is queue-shaped; a separate cron worker drains it.
 */
import { Env } from './index';
import { requireAdmin, jsonHeaders, badRequest, ok, notFound } from './lib/auth-helpers';

export async function handleNotifyProductChange(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: jsonHeaders });
  if (request.method !== 'POST') return notFound();

  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  let body: { productId?: string; changeType?: string };
  try { body = (await request.json()) as { productId?: string; changeType?: string }; }
  catch { return badRequest('Invalid JSON'); }

  const productId = (body.productId ?? '').trim();
  const changeType = (body.changeType ?? 'updated').trim();
  if (!productId) return badRequest('productId is required');

  const product = await env.DB.prepare(
    'SELECT id, name FROM products WHERE id = ? OR slug = ?',
  ).bind(productId, productId).first<{ id: string; name: string }>();
  if (!product) return notFound();

  // Mark all pending stock_notifications for this product as ready-to-send.
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `UPDATE stock_notifications
     SET status = 'queued', queued_at = ?
     WHERE product_id = ? AND status = 'pending'`,
  ).bind(now, product.id).run();

  return ok({
    productId: product.id,
    changeType,
    queuedCount: result.meta?.changes ?? 0,
  });
}
