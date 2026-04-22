import { Env } from './index';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// All product columns the frontend may write (whitelist prevents SQL injection)
const PRODUCT_COLS = [
  'name', 'slug', 'price', 'image', 'category', 'description', 'sort_order', 'is_published',
  'hero_paragraph', 'what_is_it', 'why_gummy', 'who_is_it_for', 'how_it_works',
  'how_to_take', 'routine_30_day', 'what_makes_different', 'subscription_info',
  'safety_info', 'product_cautions', 'seo_title', 'meta_description',
  'primary_keyword', 'is_adults_only', 'is_kids_product', 'is_coming_soon',
  'track_inventory', 'stock_quantity', 'low_stock_threshold',
  'benefits', 'ingredients', 'faqs', 'pairs_well_with', 'secondary_keywords',
  'is_vegan', 'is_gluten_free', 'is_sugar_free', 'is_keto_friendly', 'contains_allergens',
  'is_bundle', 'bundle_products', 'bundle_discount_percent',
];

// These are stored as JSON strings in D1 (SQLite has no array type)
const ARRAY_COLS = new Set([
  'benefits', 'ingredients', 'faqs', 'pairs_well_with', 'secondary_keywords',
  'bundle_products', 'contains_allergens',
]);

function serializeVal(col: string, val: any): any {
  if (ARRAY_COLS.has(col) && Array.isArray(val)) return JSON.stringify(val);
  return val;
}

/** Parse JSON string columns back to arrays for GET responses */
function deserializeProduct(row: any): any {
  if (!row) return row;
  const out = { ...row };
  for (const col of ARRAY_COLS) {
    if (typeof out[col] === 'string') {
      try { out[col] = JSON.parse(out[col]); } catch { out[col] = []; }
    }
  }
  return out;
}

/** Returns admin userId if the request has a valid admin session, null otherwise */
async function getAdminUserId(request: Request, env: Env): Promise<string | null> {
  try {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return null;
    const userId = await env.SESSIONS.get(token);
    if (!userId) return null;
    const row = await env.DB.prepare(
      'SELECT role FROM user_roles WHERE user_id = ?'
    ).bind(userId).first<{ role: string }>();
    return row?.role === 'admin' ? userId : null;
  } catch {
    return null;
  }
}

/** Extract product ID from path (/products/:id) or query param (?id=eq.xxx or ?id=xxx) */
function extractId(path: string, url: URL): string | null {
  if (path.startsWith('/products/') && path.length > '/products/'.length) {
    return path.split('/').pop() || null;
  }
  const raw = url.searchParams.get('id');
  if (raw) return raw.startsWith('eq.') ? raw.slice(3) : raw;
  return null;
}

export async function handleProducts(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // ── GET /categories ──────────────────────────────────────────────────────
  if ((path === '/categories' || path === '/categories/') && method === 'GET') {
    const categories = await env.DB.prepare(
      'SELECT DISTINCT category FROM products WHERE is_published = 1'
    ).all();
    return new Response(
      JSON.stringify(categories.results.map((r: any) => r.category)),
      { headers: corsHeaders }
    );
  }

  // ── GET /products (list) ─────────────────────────────────────────────────
  if (path === '/products' && method === 'GET') {
    const isAdmin = !!(await getAdminUserId(request, env));

    // Parse a filter value that may be prefixed with a PostgREST-style operator.
    // Returns { op, val } where op is 'eq' for bare values, 'in' / 'not.in' for list membership, etc.
    type Filter = { op: string; val: string };
    const parseFilter = (raw: string | null): Filter | null => {
      if (!raw) return null;
      const notInMatch = raw.match(/^not\.in\.\((.*)\)$/i) || raw.match(/^not\.in\.(.*)$/i);
      if (notInMatch) return { op: 'not.in', val: notInMatch[1] };
      const inMatch = raw.match(/^in\.\((.*)\)$/i) || raw.match(/^in\.(.*)$/i);
      if (inMatch) return { op: 'in', val: inMatch[1] };
      const opMatch = raw.match(/^(eq|neq|gt|gte|lt|lte|like|ilike)\.(.*)$/i);
      if (opMatch) return { op: opMatch[1].toLowerCase(), val: opMatch[2] };
      return { op: 'eq', val: raw };
    };

    const idFilter    = parseFilter(url.searchParams.get('id'));
    const category    = parseFilter(url.searchParams.get('category'));
    const isPublished = parseFilter(url.searchParams.get('is_published'));
    const rawLimit    = url.searchParams.get('limit') || '200';
    const limit       = Math.min(parseInt(rawLimit, 10) || 200, 500);
    const orderParam  = url.searchParams.get('order');

    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    // published filter — admins see everything by default
    const publishedVal = isPublished?.val;
    if (publishedVal === '0' || publishedVal === 'false') {
      query += ' AND is_published = 0';
    } else if (publishedVal === '1' || publishedVal === 'true' || !isAdmin) {
      query += ' AND is_published = 1';
    }
    // (admin + no is_published param → no filter, see all)

    const applyFilter = (col: 'id' | 'category', f: Filter) => {
      if (f.op === 'in' || f.op === 'not.in') {
        const vals = f.val.split(',').map(v => v.trim()).filter(Boolean);
        if (vals.length === 0) {
          query += f.op === 'in' ? ' AND 1=0' : ' AND 1=1';
          return;
        }
        const placeholders = vals.map(() => '?').join(',');
        query += ` AND ${col} ${f.op === 'in' ? 'IN' : 'NOT IN'} (${placeholders})`;
        vals.forEach(v => params.push(v));
        return;
      }
      query += ` AND ${col} = ?`;
      params.push(f.val);
    };

    if (idFilter)    applyFilter('id', idFilter);
    if (category)    applyFilter('category', category);

    // ?or=col1.op1.val1,col2.op2.val2,...  →  AND (col1 OP1 ? OR col2 OP2 ? OR ...)
    const orParam = url.searchParams.get('or');
    if (orParam) {
      const OR_COLS = new Set(['id', 'slug', 'name', 'category', 'description']);
      const OP_SQL: Record<string, string> = {
        eq: '=', neq: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=',
        like: 'LIKE', ilike: 'LIKE',
      };
      const clauses: string[] = [];
      const parts = orParam.split(',').map(s => s.trim()).filter(Boolean);
      for (const raw of parts) {
        const m = raw.match(/^([a-z_]+)\.(eq|neq|gt|gte|lt|lte|like|ilike)\.(.*)$/i);
        if (!m) {
          return new Response(
            JSON.stringify({ error: `Invalid or= clause: ${raw}` }),
            { status: 400, headers: corsHeaders }
          );
        }
        const col = m[1].toLowerCase();
        const op = m[2].toLowerCase();
        const val = m[3];
        if (!OR_COLS.has(col)) {
          return new Response(
            JSON.stringify({ error: `Column not allowed in or=: ${col}` }),
            { status: 400, headers: corsHeaders }
          );
        }
        const sqlOp = OP_SQL[op];
        clauses.push(`${col} ${sqlOp} ?`);
        params.push(op === 'ilike' || op === 'like' ? val : val);
      }
      if (clauses.length > 0) {
        query += ` AND (${clauses.join(' OR ')})`;
      }
    }

    let orderClause = 'sort_order ASC';
    if (orderParam) {
      const parts = orderParam.split('.');
      const col = parts[0];
      const dir = parts[1]?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      const allowed = ['sort_order', 'price', 'name', 'created_at'];
      if (allowed.includes(col)) orderClause = `${col} ${dir}`;
    }

    query += ` ORDER BY ${orderClause} LIMIT ?`;
    params.push(limit);

    const products = await env.DB.prepare(query).bind(...params).all();
    return new Response(JSON.stringify(products.results.map(deserializeProduct)), { headers: corsHeaders });
  }

  // ── GET /products/:idOrSlug ──────────────────────────────────────────────
  if (path.startsWith('/products/') && method === 'GET') {
    const idOrSlug = path.split('/').pop();
    const isAdmin = !!(await getAdminUserId(request, env));

    const product = await env.DB.prepare(
      isAdmin
        ? 'SELECT * FROM products WHERE id = ? OR slug = ?'
        : 'SELECT * FROM products WHERE (id = ? OR slug = ?) AND is_published = 1'
    ).bind(idOrSlug, idOrSlug).first();

    if (!product) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: corsHeaders }
      );
    }
    return new Response(JSON.stringify(deserializeProduct(product)), { headers: corsHeaders });
  }

  // ── POST /products ───────────────────────────────────────────────────────
  if (path === '/products' && method === 'POST') {
    const adminId = await getAdminUserId(request, env);
    if (!adminId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    try {
      const data = await request.json() as Record<string, any>;
      if (!data.id) data.id = crypto.randomUUID();

      const colsToInsert = ['id', ...PRODUCT_COLS.filter(c => c in data && c !== 'id')];
      const vals = colsToInsert.map(c => serializeVal(c, c === 'id' ? data.id : data[c]));
      const sql = `INSERT INTO products (${colsToInsert.join(', ')}) VALUES (${colsToInsert.map(() => '?').join(', ')})`;
      await env.DB.prepare(sql).bind(...vals).run();

      return new Response(JSON.stringify({ success: true, id: data.id }), { status: 201, headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
    }
  }

  // ── PUT /products/:id  OR  PUT /products?id=eq.:id ───────────────────────
  if (method === 'PUT' && (path.startsWith('/products') )) {
    const adminId = await getAdminUserId(request, env);
    if (!adminId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    const productId = extractId(path, url);
    if (!productId) {
      return new Response(JSON.stringify({ error: 'Product ID required' }), { status: 400, headers: corsHeaders });
    }

    try {
      const data = await request.json() as Record<string, any>;

      const setClauses: string[] = [];
      const bindings: any[] = [];

      for (const col of PRODUCT_COLS) {
        if (col in data) {
          setClauses.push(`${col} = ?`);
          bindings.push(serializeVal(col, data[col]));
        }
      }

      if (setClauses.length === 0) {
        return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400, headers: corsHeaders });
      }

      bindings.push(productId);
      const sql = `UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`;
      await env.DB.prepare(sql).bind(...bindings).run();

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
    }
  }

  // ── DELETE /products/:id  OR  DELETE /products?id=eq.:id ────────────────
  if (method === 'DELETE' && path.startsWith('/products')) {
    const adminId = await getAdminUserId(request, env);
    if (!adminId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    const productId = extractId(path, url);
    if (!productId) {
      return new Response(JSON.stringify({ error: 'Product ID required' }), { status: 400, headers: corsHeaders });
    }

    await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(productId).run();
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  }

  return new Response('Products endpoint not found', { status: 404, headers: corsHeaders });
}
