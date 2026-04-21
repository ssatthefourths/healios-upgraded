import { Env } from './index';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

async function requireAdmin(request: Request, env: Env): Promise<string | Response> {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
  const userId = await env.SESSIONS.get(token);
  if (!userId) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: cors });
  const role = await env.DB.prepare('SELECT role FROM user_roles WHERE user_id = ?').bind(userId).first<{ role: string }>();
  if (role?.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
  return userId;
}

export async function handleAdminOrders(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

  const authResult = await requireAdmin(request, env);
  if (authResult instanceof Response) return authResult;

  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean); // ['admin', 'orders', '<id>?']
  const orderId = pathParts[2] ?? null;

  // PUT /admin/orders/:id — update order status
  if (request.method === 'PUT' && orderId) {
    try {
      const body = await request.json() as { status: string };
      const newStatus = body.status;

      const validStatuses = ['pending', 'payment_confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
      if (!validStatuses.includes(newStatus)) {
        return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400, headers: cors });
      }

      // Fetch current order to check previous status
      const currentOrder = await env.DB.prepare(
        'SELECT status FROM orders WHERE id = ?'
      ).bind(orderId).first<{ status: string }>();

      if (!currentOrder) {
        return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: cors });
      }

      await env.DB.prepare(
        'UPDATE orders SET status = ?, updated_at = ? WHERE id = ?'
      ).bind(newStatus, new Date().toISOString(), orderId).run();

      // Restore stock when cancelling a previously active order
      if (newStatus === 'cancelled' && !['cancelled', 'refunded'].includes(currentOrder.status)) {
        const items = await env.DB.prepare(
          'SELECT product_id, quantity FROM order_items WHERE order_id = ?'
        ).bind(orderId).all();

        for (const item of (items.results as any[])) {
          await env.DB.prepare(
            'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ? AND track_inventory = 1'
          ).bind(item.quantity, item.product_id).run();
        }
      }

      return new Response(JSON.stringify({ success: true }), { headers: cors });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
    }
  }

  // GET /admin/orders — list all orders with items
  if (request.method === 'GET' && !orderId) {
    try {
      const status = url.searchParams.get('status');
      const search = url.searchParams.get('search');
      const limit = parseInt(url.searchParams.get('limit') || '500', 10);

      let sql = `SELECT o.*,
        json_group_array(json_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'product_name', oi.product_name,
          'product_image', oi.product_image,
          'product_category', oi.product_category,
          'unit_price', oi.unit_price,
          'quantity', oi.quantity,
          'line_total', oi.line_total,
          'is_subscription', oi.is_subscription
        )) as order_items_json
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id`;

      const bindings: any[] = [];
      const conditions: string[] = [];

      if (status && status !== 'all') {
        conditions.push('o.status = ?');
        bindings.push(status);
      }

      if (search) {
        conditions.push('(o.email LIKE ? OR o.first_name LIKE ? OR o.last_name LIKE ? OR o.id LIKE ?)');
        const q = `%${search}%`;
        bindings.push(q, q, q, q);
      }

      if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
      sql += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT ${limit}`;

      const { results } = await env.DB.prepare(sql).bind(...bindings).all();

      const orders = (results as any[]).map(row => {
        let items = [];
        try {
          const parsed = JSON.parse(row.order_items_json);
          // Filter out null rows from LEFT JOIN when order has no items
          items = parsed.filter((i: any) => i.id !== null);
        } catch { /* empty */ }
        return { ...row, order_items: items, order_items_json: undefined };
      });

      return new Response(JSON.stringify(orders), { headers: cors });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
    }
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: cors });
}
