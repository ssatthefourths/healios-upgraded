import { Env } from './index';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function loadBundleWithItems(env: Env, bundleId: string): Promise<any | null> {
  const bundle = await env.DB.prepare('SELECT * FROM bundles WHERE id = ?').bind(bundleId).first();
  if (!bundle) return null;
  const { results: items } = await env.DB.prepare(`
    SELECT bi.id, bi.product_id, bi.quantity, bi.sort_order,
           p.name, p.slug, p.price, p.image, p.category, p.description
    FROM bundle_items bi
    JOIN products p ON p.id = bi.product_id
    WHERE bi.bundle_id = ?
    ORDER BY bi.sort_order, p.name
  `).bind(bundleId).all();
  return { ...bundle, items: items ?? [] };
}

export async function handleBundles(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const isAdmin = parts[0] === 'admin';
  const idOrSlug = isAdmin ? parts[2] : parts[1];
  const subResource = isAdmin ? parts[3] : null;
  const subId = isAdmin ? parts[4] : null;

  // Public GET routes
  if (!isAdmin && request.method === 'GET') {
    if (!idOrSlug) {
      const { results } = await env.DB.prepare(
        'SELECT * FROM bundles WHERE is_published = 1 ORDER BY sort_order, name'
      ).all();
      return new Response(JSON.stringify(results ?? []), { headers: cors });
    }
    // lookup by id or slug
    let bundle = await env.DB.prepare('SELECT id FROM bundles WHERE slug = ? OR id = ?').bind(idOrSlug, idOrSlug).first<{ id: string }>();
    if (!bundle) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: cors });
    const full = await loadBundleWithItems(env, bundle.id);
    return new Response(JSON.stringify(full), { headers: cors });
  }

  // All remaining routes require admin
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: cors });
  }

  const authResult = await requireAdmin(request, env);
  if (authResult instanceof Response) return authResult;

  // Admin list
  if (request.method === 'GET' && !idOrSlug) {
    const { results } = await env.DB.prepare(`
      SELECT b.*, COUNT(bi.id) as item_count
      FROM bundles b
      LEFT JOIN bundle_items bi ON bi.bundle_id = b.id
      GROUP BY b.id
      ORDER BY b.sort_order, b.name
    `).all();
    return new Response(JSON.stringify(results ?? []), { headers: cors });
  }

  // Admin single
  if (request.method === 'GET' && idOrSlug) {
    const full = await loadBundleWithItems(env, idOrSlug);
    if (!full) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: cors });
    return new Response(JSON.stringify(full), { headers: cors });
  }

  // Admin create
  if (request.method === 'POST' && !idOrSlug) {
    try {
      const body = await request.json() as any;
      if (!body.name || !body.image || body.price === undefined) {
        return new Response(JSON.stringify({ error: 'name, image, price required' }), { status: 400, headers: cors });
      }
      const id = body.id || `bundle-${crypto.randomUUID().slice(0, 12)}`;
      const slug = body.slug || slugify(body.name);
      await env.DB.prepare(`
        INSERT INTO bundles (id, name, slug, description, image, price, compare_at_price, is_published, sort_order, seo_title, meta_description, stock_quantity, track_inventory)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, body.name, slug, body.description || null, body.image, body.price,
        body.compare_at_price ?? null, body.is_published === false ? 0 : 1,
        body.sort_order ?? 0, body.seo_title ?? null, body.meta_description ?? null,
        body.stock_quantity ?? 100, body.track_inventory ? 1 : 0
      ).run();

      if (Array.isArray(body.items)) {
        for (let i = 0; i < body.items.length; i++) {
          const it = body.items[i];
          await env.DB.prepare(
            'INSERT INTO bundle_items (id, bundle_id, product_id, quantity, sort_order) VALUES (?, ?, ?, ?, ?)'
          ).bind(crypto.randomUUID(), id, it.product_id, it.quantity || 1, i).run();
        }
      }
      const full = await loadBundleWithItems(env, id);
      return new Response(JSON.stringify(full), { status: 201, headers: cors });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
    }
  }

  // Admin update (PUT /admin/bundles/:id) — replaces items entirely when provided
  if (request.method === 'PUT' && idOrSlug && !subResource) {
    try {
      const body = await request.json() as any;
      const sets: string[] = [];
      const binds: any[] = [];
      for (const col of ['name','slug','description','image','price','compare_at_price','is_published','sort_order','seo_title','meta_description','stock_quantity','track_inventory']) {
        if (col in body) {
          sets.push(`${col} = ?`);
          let v = body[col];
          if (col === 'is_published' || col === 'track_inventory') v = v ? 1 : 0;
          binds.push(v);
        }
      }
      if (sets.length) {
        binds.push(idOrSlug);
        await env.DB.prepare(`UPDATE bundles SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(...binds).run();
      }
      if (Array.isArray(body.items)) {
        await env.DB.prepare('DELETE FROM bundle_items WHERE bundle_id = ?').bind(idOrSlug).run();
        for (let i = 0; i < body.items.length; i++) {
          const it = body.items[i];
          await env.DB.prepare(
            'INSERT INTO bundle_items (id, bundle_id, product_id, quantity, sort_order) VALUES (?, ?, ?, ?, ?)'
          ).bind(crypto.randomUUID(), idOrSlug, it.product_id, it.quantity || 1, i).run();
        }
      }
      const full = await loadBundleWithItems(env, idOrSlug);
      return new Response(JSON.stringify(full), { headers: cors });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
    }
  }

  // Admin delete
  if (request.method === 'DELETE' && idOrSlug && !subResource) {
    await env.DB.prepare('DELETE FROM bundles WHERE id = ?').bind(idOrSlug).run();
    return new Response(JSON.stringify({ success: true }), { headers: cors });
  }

  // Admin item add: POST /admin/bundles/:id/items
  if (request.method === 'POST' && subResource === 'items') {
    try {
      const body = await request.json() as any;
      await env.DB.prepare(
        'INSERT OR REPLACE INTO bundle_items (id, bundle_id, product_id, quantity, sort_order) VALUES (?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), idOrSlug, body.product_id, body.quantity || 1, body.sort_order ?? 0).run();
      return new Response(JSON.stringify({ success: true }), { headers: cors });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
    }
  }

  // Admin item remove: DELETE /admin/bundles/:id/items/:productId
  if (request.method === 'DELETE' && subResource === 'items' && subId) {
    await env.DB.prepare('DELETE FROM bundle_items WHERE bundle_id = ? AND product_id = ?').bind(idOrSlug, subId).run();
    return new Response(JSON.stringify({ success: true }), { headers: cors });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: cors });
}
