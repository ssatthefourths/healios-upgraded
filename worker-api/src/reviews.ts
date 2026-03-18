import { Env } from './index';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

const stripOp = (v: string | null): string | null =>
  v ? v.replace(/^(eq|neq|gt|gte|lt|lte|like|ilike)\./i, '') : null;

export async function handleReviews(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // ── GET /product_reviews ──────────────────────────────────────────────────
  if (path === '/product_reviews' && method === 'GET') {
    try {
      const status = stripOp(url.searchParams.get('status'));
      const productId = url.searchParams.get('product_id');
      const userId = stripOp(url.searchParams.get('user_id'));
      const orderParam = url.searchParams.get('order') || 'created_at.desc';
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
      const offset = parseInt(url.searchParams.get('offset') || '0');

      // Parse order
      const orderParts = orderParam.split('.');
      const orderCol = ['created_at', 'rating', 'updated_at'].includes(orderParts[0])
        ? orderParts[0] : 'created_at';
      const orderDir = orderParts[1]?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      let query = 'SELECT * FROM product_reviews WHERE 1=1';
      const params: any[] = [];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      // Handle `product_id=in.id1,id2,id3` (IN clause)
      if (productId) {
        const inPrefix = 'in.';
        if (productId.startsWith(inPrefix)) {
          const ids = productId.slice(inPrefix.length).split(',').filter(Boolean);
          if (ids.length > 0) {
            const placeholders = ids.map(() => '?').join(', ');
            query += ` AND product_id IN (${placeholders})`;
            params.push(...ids);
          }
        } else {
          query += ' AND product_id = ?';
          params.push(stripOp(productId));
        }
      }

      if (userId) {
        query += ' AND user_id = ?';
        params.push(userId);
      }

      query += ` ORDER BY ${orderCol} ${orderDir} LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const result = await env.DB.prepare(query).bind(...params).all();
      return new Response(JSON.stringify(result.results), { headers: corsHeaders });
    } catch {
      return new Response(JSON.stringify([]), { headers: corsHeaders });
    }
  }

  // ── POST /product_reviews ─────────────────────────────────────────────────
  if (path === '/product_reviews' && method === 'POST') {
    try {
      const data = await request.json() as any;
      const id = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      await env.DB.prepare(
        `INSERT INTO product_reviews (id, product_id, user_id, rating, review_text, status)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        data.product_id,
        data.user_id,
        data.rating,
        data.review_text ?? null,
        'pending'
      ).run();
      return new Response(JSON.stringify({ id, success: true }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
    }
  }

  // ── DELETE /product_reviews/:id ───────────────────────────────────────────
  if (path.startsWith('/product_reviews/') && method === 'DELETE') {
    const id = path.split('/').pop();
    try {
      await env.DB.prepare('DELETE FROM product_reviews WHERE id = ?').bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
    }
  }

  return new Response(JSON.stringify({ error: 'Reviews endpoint not found' }), { status: 404, headers: corsHeaders });
}
