import { Env } from './index';

export async function handleAdminStats(request: Request, env: Env): Promise<Response> {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
  }
  const userId = await env.SESSIONS.get(token);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: cors });
  }
  const roleRow = await env.DB.prepare(
    'SELECT role FROM user_roles WHERE user_id = ?'
  ).bind(userId).first<{ role: string }>();
  if (roleRow?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  try {
    const [
      totalOrders,
      pendingOrders,
      allRevenue,
      todayOrders,
      monthRevenue,
      totalProducts,
      lowStock,
      newsletter,
      pendingReviews,
      pendingWellness,
      activeDiscounts,
      recentOrders,
    ] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) as c FROM orders").first<any>(),
      env.DB.prepare("SELECT COUNT(*) as c FROM orders WHERE status='pending'").first<any>(),
      env.DB.prepare(
        "SELECT COALESCE(SUM(total),0) as s FROM orders WHERE status NOT IN ('cancelled','refunded')"
      ).first<any>(),
      env.DB.prepare(
        "SELECT COUNT(*) as c FROM orders WHERE created_at >= ?"
      ).bind(todayStart).first<any>(),
      env.DB.prepare(
        "SELECT COALESCE(SUM(total),0) as s FROM orders WHERE created_at >= ? AND status NOT IN ('cancelled','refunded')"
      ).bind(monthStart).first<any>(),
      env.DB.prepare("SELECT COUNT(*) as c FROM products WHERE is_published=1").first<any>(),
      env.DB.prepare(
        "SELECT COUNT(*) as c FROM products WHERE track_inventory=1 AND stock_quantity < 10"
      ).first<any>(),
      env.DB.prepare(
        "SELECT COUNT(*) as c FROM newsletter_subscriptions WHERE is_active=1"
      ).first<any>(),
      env.DB.prepare(
        "SELECT COUNT(*) as c FROM product_reviews WHERE status='pending'"
      ).first<any>(),
      env.DB.prepare(
        "SELECT COUNT(*) as c FROM wellness_posts WHERE status='pending'"
      ).first<any>(),
      env.DB.prepare(
        "SELECT COUNT(*) as c FROM discount_codes WHERE is_active=1"
      ).first<any>(),
      env.DB.prepare(
        "SELECT id, email, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 8"
      ).all(),
    ]);

    return new Response(JSON.stringify({
      totalOrders: totalOrders?.c ?? 0,
      pendingOrders: pendingOrders?.c ?? 0,
      totalRevenue: allRevenue?.s ?? 0,
      todayOrders: todayOrders?.c ?? 0,
      monthRevenue: monthRevenue?.s ?? 0,
      totalProducts: totalProducts?.c ?? 0,
      lowStockProducts: lowStock?.c ?? 0,
      newsletterSubscribers: newsletter?.c ?? 0,
      pendingReviews: pendingReviews?.c ?? 0,
      pendingWellnessPosts: pendingWellness?.c ?? 0,
      activeDiscounts: activeDiscounts?.c ?? 0,
      recentOrders: recentOrders.results ?? [],
    }), { headers: cors });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
  }
}
