import { Env } from './index';

export async function handleProducts(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  // GET /categories
  if ((path === '/categories' || path === '/categories/') && method === 'GET') {
    const categories = await env.DB.prepare(
      'SELECT DISTINCT category FROM products WHERE is_published = 1'
    ).all();
    return new Response(JSON.stringify(categories.results.map((r: any) => r.category)), { headers: corsHeaders });
  }

  // GET /products
  if (path === '/products' && method === 'GET') {
    // Strip Supabase-style operator prefix (e.g. "eq.Beauty" -> "Beauty")
    const stripOp = (v: string | null) => v ? v.replace(/^(eq|neq|gt|gte|lt|lte|like|ilike)\./i, '') : null;

    const category = stripOp(url.searchParams.get('category'));
    const isPublished = stripOp(url.searchParams.get('is_published'));
    const rawLimit = url.searchParams.get('limit') || '50';
    const limit = Math.min(parseInt(rawLimit), 200);
    const orderParam = url.searchParams.get('order'); // e.g. "sort_order.asc"

    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    // Only show published products unless explicitly requested otherwise
    if (isPublished === '0' || isPublished === 'false') {
      query += ' AND is_published = 0';
    } else {
      query += ' AND is_published = 1';
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    // Parse sort order from param
    let orderClause = 'sort_order ASC';
    if (orderParam) {
      const parts = orderParam.split('.');
      const col = parts[0];
      const dir = parts[1]?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      const allowedCols = ['sort_order', 'price', 'name', 'created_at'];
      if (allowedCols.includes(col)) {
        orderClause = `${col} ${dir}`;
      }
    }

    query += ` ORDER BY ${orderClause} LIMIT ?`;
    params.push(limit);

    const products = await env.DB.prepare(query).bind(...params).all();
    return new Response(JSON.stringify(products.results), { headers: corsHeaders });
  }

  // GET /products/:idOrSlug
  if (path.startsWith('/products/') && method === 'GET') {
    const idOrSlug = path.split('/').pop();

    const product = await env.DB.prepare(
      'SELECT * FROM products WHERE (id = ? OR slug = ?) AND is_published = 1'
    ).bind(idOrSlug, idOrSlug).first();

    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404, headers: corsHeaders });
    }

    return new Response(JSON.stringify(product), { headers: corsHeaders });
  }

  // POST /products (Admin only)
  if (path === '/products' && method === 'POST') {
    const data = await request.json() as any;
    try {
      await env.DB.prepare(
        'INSERT INTO products (id, name, slug, price, image, category, description, sort_order, is_published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(data.id, data.name, data.slug, data.price, data.image, data.category, data.description, data.sort_order || 0, data.is_published ? 1 : 0).run();

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
    }
  }

  // PUT /products/:id (Admin only)
  if (path.startsWith('/products/') && method === 'PUT') {
    const id = path.split('/').pop();
    const data = await request.json() as any;

    try {
      await env.DB.prepare(
        'UPDATE products SET name = ?, slug = ?, price = ?, image = ?, category = ?, description = ?, sort_order = ?, is_published = ? WHERE id = ?'
      ).bind(data.name, data.slug, data.price, data.image, data.category, data.description, data.sort_order, data.is_published ? 1 : 0, id).run();

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
    }
  }

  // DELETE /products/:id (Admin only)
  if (path.startsWith('/products/') && method === 'DELETE') {
    const id = path.split('/').pop();
    await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  }

  return new Response('Products endpoint not found', { status: 404, headers: corsHeaders });
}
