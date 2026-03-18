import { Env } from './index';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

/** Strip Supabase-style operator prefix, e.g. "eq.published" → "published" */
const stripOp = (v: string | null): string | null =>
  v ? v.replace(/^(eq|neq|gt|gte|lt|lte|like|ilike)\./i, '') : null;

/** Parse "column.asc" / "column.desc" into SQL ORDER BY clause */
const parseOrder = (param: string | null, allowed: string[], defaultOrder: string): string => {
  if (!param) return defaultOrder;
  const parts = param.split('.');
  const col = parts[0];
  const dir = parts[1]?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  return allowed.includes(col) ? `${col} ${dir}` : defaultOrder;
};

export async function handleBlog(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // ── GET /blog_categories ──────────────────────────────────────────────────
  if (path === '/blog_categories' && method === 'GET') {
    try {
      const order = parseOrder(
        url.searchParams.get('order'),
        ['sort_order', 'name', 'created_at'],
        'sort_order ASC'
      );
      const result = await env.DB.prepare(
        `SELECT * FROM blog_categories ORDER BY ${order}`
      ).all();
      return new Response(JSON.stringify(result.results), { headers: corsHeaders });
    } catch {
      return new Response(JSON.stringify([]), { headers: corsHeaders });
    }
  }

  // ── GET /blog_posts ───────────────────────────────────────────────────────
  if (path === '/blog_posts' && method === 'GET') {
    try {
      const status = stripOp(url.searchParams.get('status'));
      const categoryId = stripOp(url.searchParams.get('category_id'));
      const slug = stripOp(url.searchParams.get('slug'));
      const order = parseOrder(
        url.searchParams.get('order'),
        ['published_at', 'created_at', 'title', 'updated_at'],
        'published_at DESC'
      );
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let query = 'SELECT * FROM blog_posts WHERE 1=1';
      const params: any[] = [];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      if (categoryId) {
        query += ' AND category_id = ?';
        params.push(categoryId);
      }
      if (slug) {
        query += ' AND slug = ?';
        params.push(slug);
      }

      query += ` ORDER BY ${order} LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const result = await env.DB.prepare(query).bind(...params).all();
      return new Response(JSON.stringify(result.results), { headers: corsHeaders });
    } catch {
      return new Response(JSON.stringify([]), { headers: corsHeaders });
    }
  }

  // ── GET /blog_posts/:slug ─────────────────────────────────────────────────
  if (path.startsWith('/blog_posts/') && method === 'GET') {
    const slug = path.split('/').pop();
    try {
      const post = await env.DB.prepare(
        'SELECT * FROM blog_posts WHERE slug = ? AND status = ?'
      ).bind(slug, 'published').first();
      if (!post) {
        return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404, headers: corsHeaders });
      }
      return new Response(JSON.stringify(post), { headers: corsHeaders });
    } catch {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders });
    }
  }

  // ── POST /blog_posts (Admin) ──────────────────────────────────────────────
  if (path === '/blog_posts' && method === 'POST') {
    try {
      const data = await request.json() as any;
      const id = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      await env.DB.prepare(
        `INSERT INTO blog_posts (id, slug, title, excerpt, content, featured_image, status,
         category_id, seo_title, meta_description, reading_time_minutes, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id, data.slug, data.title, data.excerpt ?? null, data.content ?? null,
        data.featured_image ?? null, data.status ?? 'draft', data.category_id ?? null,
        data.seo_title ?? null, data.meta_description ?? null,
        data.reading_time_minutes ?? 5, data.published_at ?? null
      ).run();
      return new Response(JSON.stringify({ id, success: true }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
    }
  }

  // ── PUT /blog_posts (Admin) ───────────────────────────────────────────────
  if (path === '/blog_posts' && method === 'PUT') {
    const rawId = url.searchParams.get('id');
    const postId = rawId?.startsWith('eq.') ? rawId.slice(3) : rawId;
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), { status: 400, headers: corsHeaders });
    }
    try {
      const data = await request.json() as any;
      const BLOG_COLS = ['slug', 'title', 'excerpt', 'content', 'featured_image', 'status',
        'category_id', 'seo_title', 'meta_description', 'reading_time_minutes', 'published_at', 'author_id'];
      const setClauses: string[] = [];
      const bindings: any[] = [];
      for (const col of BLOG_COLS) {
        if (col in data) {
          setClauses.push(`${col} = ?`);
          bindings.push(data[col] ?? null);
        }
      }
      if (setClauses.length === 0) {
        return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400, headers: corsHeaders });
      }
      setClauses.push('updated_at = ?');
      bindings.push(new Date().toISOString());
      bindings.push(postId);
      await env.DB.prepare(`UPDATE blog_posts SET ${setClauses.join(', ')} WHERE id = ?`)
        .bind(...bindings).run();
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
    }
  }

  return new Response(JSON.stringify({ error: 'Blog endpoint not found' }), { status: 404, headers: corsHeaders });
}
