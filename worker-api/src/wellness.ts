import { Env } from './index';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

const stripOp = (v: string | null): string | null =>
  v ? v.replace(/^(eq|neq|gt|gte|lt|lte|like|ilike)\./i, '') : null;

export async function handleWellness(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // ── GET /wellness_posts ───────────────────────────────────────────────────
  if (path === '/wellness_posts' && method === 'GET') {
    try {
      const status = stripOp(url.searchParams.get('status'));
      const orderParam = url.searchParams.get('order') || 'submitted_at.desc';
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
      const offset = parseInt(url.searchParams.get('offset') || '0');

      const orderParts = orderParam.split('.');
      const orderCol = ['submitted_at', 'created_at'].includes(orderParts[0])
        ? orderParts[0] : 'submitted_at';
      const orderDir = orderParts[1]?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      let query = 'SELECT id, social_link, thumbnail_url, display_name, submitted_at FROM wellness_posts WHERE 1=1';
      const params: any[] = [];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ` ORDER BY ${orderCol} ${orderDir} LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const result = await env.DB.prepare(query).bind(...params).all();
      return new Response(JSON.stringify(result.results), { headers: corsHeaders });
    } catch {
      return new Response(JSON.stringify([]), { headers: corsHeaders });
    }
  }

  // ── POST /wellness_posts ──────────────────────────────────────────────────
  if (path === '/wellness_posts' && method === 'POST') {
    try {
      const data = await request.json() as any;
      if (!data.user_id || !data.social_link || !data.display_name) {
        return new Response(
          JSON.stringify({ error: 'user_id, social_link, and display_name are required' }),
          { status: 400, headers: corsHeaders }
        );
      }
      const id = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      await env.DB.prepare(
        `INSERT INTO wellness_posts (id, user_id, social_link, display_name, status)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(id, data.user_id, data.social_link, data.display_name, 'pending').run();
      return new Response(JSON.stringify({ id, success: true }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
    }
  }

  return new Response(JSON.stringify({ error: 'Wellness endpoint not found' }), { status: 404, headers: corsHeaders });
}
