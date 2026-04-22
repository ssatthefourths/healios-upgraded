import type { Env } from './index';
import { createSearchService } from './services/search';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

/**
 * Public product search endpoint.
 *
 *   GET /search/products?q=<raw>&limit=<n>
 *
 * - Unauthenticated. Cached at the edge for 5 minutes; majority of repeat
 *   queries never touch this handler.
 * - Input goes through the SearchService abstraction only — no raw SQL,
 *   no column names, no operator injection surface.
 * - On any invalid / empty query, returns an empty result set (200), so
 *   the client can distinguish "no matches" from a transport error.
 */
export async function handleSearch(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: CORS,
    });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get('q') ?? '';
  const rawLimit = url.searchParams.get('limit');
  const limit = rawLimit ? parseInt(rawLimit, 10) : undefined;

  const service = createSearchService(env.DB);
  const results = await service.search(q, { limit });

  return new Response(JSON.stringify({ results }), {
    headers: {
      ...CORS,
      'Cache-Control': 'public, s-maxage=300',
    },
  });
}
