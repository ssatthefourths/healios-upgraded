/**
 * Admin analytics + security widget endpoints — replaces five Supabase calls:
 *   - .from('product_analytics').select(...)   →  GET /admin/product-analytics?from&to
 *   - rpc('get_checkout_security_stats')       →  GET /admin/checkout-security-stats
 *   - rpc('get_referral_security_stats')       →  GET /admin/referral-security-stats
 *   - functions.invoke('product-performance-alerts')  →  GET /admin/product-performance-alerts
 *
 * All gated by requireAdmin. Free-tier-friendly: each request is a small
 * handful of D1 reads, and the dashboard frontend uses TanStack Query's
 * 5-min staleTime so polling can't blow the daily quota.
 */
import { Env } from './index';
import { requireAdmin, jsonHeaders, ok, notFound } from './lib/auth-helpers';

export async function handleAdminAnalytics(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: jsonHeaders });

  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // GET /admin/product-analytics?from=YYYY-MM-DD&to=YYYY-MM-DD
  if (path === '/admin/product-analytics' && method === 'GET') {
    const from = url.searchParams.get('from') ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const to   = url.searchParams.get('to')   ?? new Date().toISOString().slice(0, 10);

    const { results } = await env.DB.prepare(
      `SELECT product_id, day, views, add_to_cart, purchases
       FROM product_analytics
       WHERE day BETWEEN ? AND ?
       ORDER BY day DESC, product_id ASC
       LIMIT 5000`,
    ).bind(from, to).all();

    return ok({ data: results ?? [], from, to });
  }

  // GET /admin/product-performance-alerts
  // Surface low-stock products + slow-movers from data we already have.
  if (path === '/admin/product-performance-alerts' && method === 'GET') {
    const lowStock = await env.DB.prepare(
      `SELECT id, slug, name, stock_quantity
       FROM products
       WHERE stock_quantity IS NOT NULL AND stock_quantity > 0 AND stock_quantity <= 5
       ORDER BY stock_quantity ASC
       LIMIT 50`,
    ).all<{ id: string; slug: string; name: string; stock_quantity: number }>();

    const outOfStock = await env.DB.prepare(
      `SELECT id, slug, name
       FROM products
       WHERE stock_quantity IS NOT NULL AND stock_quantity = 0
       LIMIT 50`,
    ).all<{ id: string; slug: string; name: string }>();

    return ok({
      lowStock: lowStock.results ?? [],
      outOfStock: outOfStock.results ?? [],
      generatedAt: new Date().toISOString(),
    });
  }

  // GET /admin/checkout-security-stats
  // Aggregate from orders over a 30-day window.
  if (path === '/admin/checkout-security-stats' && method === 'GET') {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const totals = await env.DB.prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'payment_confirmed' OR status = 'processing' OR status = 'shipped' OR status = 'delivered' THEN 1 ELSE 0 END) AS confirmed,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN discount_code IS NOT NULL AND discount_code != '' THEN 1 ELSE 0 END) AS with_discount
       FROM orders
       WHERE created_at >= ?`,
    ).bind(since).first<{ total: number; confirmed: number; cancelled: number; pending: number; with_discount: number }>();

    return ok({
      window: '30d',
      since,
      totals: totals ?? { total: 0, confirmed: 0, cancelled: 0, pending: 0, with_discount: 0 },
    });
  }

  // GET /admin/referral-security-stats
  // Aggregate from referrals over a 30-day window.
  if (path === '/admin/referral-security-stats' && method === 'GET') {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const totals = await env.DB.prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'pending'   THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) AS converted,
         SUM(CASE WHEN status = 'rewarded'  THEN 1 ELSE 0 END) AS rewarded
       FROM referrals
       WHERE created_at >= ?`,
    ).bind(since).first<{ total: number; pending: number; converted: number; rewarded: number }>();

    // Self-referral attempts (referrer === referred_user) are blocked at the
    // /referrals/apply endpoint, but log any historical artefacts.
    const selfAttempts = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM referrals WHERE referrer_id = referred_user_id`,
    ).first<{ n: number }>();

    return ok({
      window: '30d',
      since,
      totals: totals ?? { total: 0, pending: 0, converted: 0, rewarded: 0 },
      selfReferralAttempts: selfAttempts?.n ?? 0,
    });
  }

  return notFound();
}
