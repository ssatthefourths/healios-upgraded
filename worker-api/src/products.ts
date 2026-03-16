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
    const category = url.searchParams.get('category');
    const limit = url.searchParams.get('limit') || '50';
    
    let query = 'SELECT * FROM products WHERE is_published = 1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY sort_order LIMIT ?';
    params.push(parseInt(limit));

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
