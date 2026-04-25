import { Env } from './index';
import { sendShippingEmail, sendDeliveryEmail } from './order-emails';

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

  // PUT /admin/orders/:id — update order status (+ optional tracking).
  //
  // Rich body shape (closes v3 #2 / #3 / #4 / #5):
  //   { status: 'shipped',
  //     tracking_carrier?: 'Royal Mail',
  //     tracking_number?: 'AB123456789GB',
  //     tracking_url?: 'https://...' }
  //
  // The legacy minimal body { status: 'shipped' } still works — tracking
  // fields are optional so the existing dropdown actions in OrdersAdmin
  // keep working.
  //
  // Side-effects per transition:
  //   * → 'processing': stamps processing_at. (No email yet — Monique
  //                     hasn't designed a processing template.)
  //   * → 'shipped'   : stamps shipped_at, persists tracking columns,
  //                     fires the shipping-confirmation email
  //                     (renderShippingConfirmation).
  //   * → 'delivered' : stamps delivered_at + delivered_by='admin',
  //                     fires the delivery-confirmation email.
  //   * → 'cancelled' : restores stock for previously-active orders.
  if (request.method === 'PUT' && orderId) {
    try {
      const body = await request.json() as {
        status: string;
        tracking_carrier?: string | null;
        tracking_number?: string | null;
        tracking_url?: string | null;
      };
      const newStatus = body.status;

      const validStatuses = ['pending', 'payment_confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
      if (!validStatuses.includes(newStatus)) {
        return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400, headers: cors });
      }

      const currentOrder = await env.DB.prepare(
        'SELECT status FROM orders WHERE id = ?'
      ).bind(orderId).first<{ status: string }>();

      if (!currentOrder) {
        return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: cors });
      }

      const now = new Date().toISOString();
      const setClauses: string[] = ['status = ?', 'updated_at = ?'];
      const bindings: any[] = [newStatus, now];

      if (newStatus === 'processing' && currentOrder.status !== 'processing') {
        setClauses.push('processing_at = ?');
        bindings.push(now);
      }

      if (newStatus === 'shipped' && currentOrder.status !== 'shipped') {
        setClauses.push('shipped_at = ?');
        bindings.push(now);
        // Persist tracking when supplied. Empty strings → NULL so the
        // email helper treats them as "not provided" rather than rendering
        // an empty pill.
        if (body.tracking_carrier !== undefined) {
          setClauses.push('tracking_carrier = ?');
          bindings.push(body.tracking_carrier?.trim() || null);
        }
        if (body.tracking_number !== undefined) {
          setClauses.push('tracking_number = ?');
          bindings.push(body.tracking_number?.trim() || null);
        }
        if (body.tracking_url !== undefined) {
          setClauses.push('tracking_url = ?');
          bindings.push(body.tracking_url?.trim() || null);
        }
      }

      if (newStatus === 'delivered' && currentOrder.status !== 'delivered') {
        setClauses.push('delivered_at = ?');
        bindings.push(now);
        setClauses.push('delivered_by = ?');
        bindings.push('admin');
      }

      bindings.push(orderId);
      await env.DB.prepare(
        `UPDATE orders SET ${setClauses.join(', ')} WHERE id = ?`
      ).bind(...bindings).run();

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

      // Fire emails for the transitions that have a template wired.
      // Errors here are logged but do not roll back the status change —
      // the customer-facing data is correct even if the email fails.
      try {
        if (newStatus === 'shipped' && currentOrder.status !== 'shipped') {
          await sendShippingEmail(env, orderId);
        }
        if (newStatus === 'delivered' && currentOrder.status !== 'delivered') {
          await sendDeliveryEmail(env, orderId);
        }
      } catch (emailErr: any) {
        console.error('[admin-orders] email trigger failed:', emailErr?.message);
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
