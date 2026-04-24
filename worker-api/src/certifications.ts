import type { Env } from './index';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

// Cache 1 hour per-PoP. Certifications change rarely (new asset drops, new cert
// onboarded); the admin team can bust cache by deploying a worker version.
const PUBLIC_CACHE = 'public, s-maxage=3600';

type Certification = {
  key: string;
  name: string;
  tagline: string | null;
  asset_url: string | null;
  href: string | null;
};

/** GET /public/product/:id/certifications — returns array of certs attached to a product. */
export async function handleCertifications(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const url = new URL(request.url);
  const path = url.pathname;

  // Match /public/product/<id>/certifications
  const match = path.match(/^\/public\/product\/([^/]+)\/certifications\/?$/);
  if (!match || request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'not_found' }), {
      status: 404,
      headers: CORS,
    });
  }

  const productId = decodeURIComponent(match[1]);

  const { results } = await env.DB.prepare(
    `SELECT c.key, c.name, c.tagline, c.asset_url, c.href
     FROM product_certifications pc
     JOIN certifications c ON c.key = pc.cert_key
     WHERE pc.product_id = ?
     ORDER BY pc.sort_order ASC, c.name ASC`
  )
    .bind(productId)
    .all<Certification>();

  return new Response(JSON.stringify({ certifications: results ?? [] }), {
    headers: { ...CORS, 'Cache-Control': PUBLIC_CACHE },
  });
}
