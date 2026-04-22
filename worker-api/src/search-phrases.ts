/**
 * Admin CRUD for search phrases (intent-to-product mapping).
 *
 *   GET    /admin/search-phrases              — list all phrases with their product ids
 *   POST   /admin/search-phrases              — create a phrase { phrase, product_ids[] }
 *   PUT    /admin/search-phrases/:id          — update { phrase, product_ids[] }
 *   DELETE /admin/search-phrases/:id
 *
 * After any mutation, rebuild the `phrases` column in products_fts for
 * every affected product so the search endpoint picks up the change.
 */
import type { Env } from './index';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const MAX_PHRASE_LEN = 80;
const MAX_PHRASES_PER_PRODUCT = 200;

async function getAdminUserId(request: Request, env: Env): Promise<string | null> {
  try {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return null;
    const userId = await env.SESSIONS.get(token);
    if (!userId) return null;
    const row = await env.DB.prepare('SELECT role FROM user_roles WHERE user_id = ?')
      .bind(userId)
      .first<{ role: string }>();
    return row?.role === 'admin' ? userId : null;
  } catch {
    return null;
  }
}

function normalisePhrase(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed.length > MAX_PHRASE_LEN) return null;
  return trimmed;
}

async function rebuildFtsPhrasesForProducts(env: Env, productIds: string[]): Promise<void> {
  if (productIds.length === 0) return;
  const stmts = productIds.map((pid) =>
    env.DB.prepare(
      `UPDATE products_fts
          SET phrases = COALESCE(
            (SELECT GROUP_CONCAT(sp.phrase, ' ')
               FROM search_phrases sp
               JOIN search_phrase_products spp ON spp.phrase_id = sp.id
              WHERE spp.product_id = ?),
            ''
          )
        WHERE product_id = ?`
    ).bind(pid, pid)
  );
  await env.DB.batch(stmts);
}

interface PhraseRow { id: number; phrase: string; product_ids: string[] }

async function listAll(env: Env): Promise<PhraseRow[]> {
  const { results } = await env.DB.prepare(
    `SELECT sp.id, sp.phrase,
            COALESCE(GROUP_CONCAT(spp.product_id, ','), '') AS product_ids_csv
     FROM search_phrases sp
     LEFT JOIN search_phrase_products spp ON spp.phrase_id = sp.id
     GROUP BY sp.id, sp.phrase
     ORDER BY sp.phrase COLLATE NOCASE`
  ).all<{ id: number; phrase: string; product_ids_csv: string }>();

  return (results ?? []).map((r) => ({
    id: r.id,
    phrase: r.phrase,
    product_ids: r.product_ids_csv ? r.product_ids_csv.split(',').filter(Boolean) : [],
  }));
}

export async function handleSearchPhrases(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const adminId = await getAdminUserId(request, env);
  if (!adminId) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: CORS,
    });
  }

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const idMatch = path.match(/^\/admin\/search-phrases\/(\d+)\/?$/);
  const id = idMatch ? parseInt(idMatch[1], 10) : null;

  if (path === '/admin/search-phrases' && method === 'GET') {
    const data = await listAll(env);
    return new Response(JSON.stringify({ phrases: data }), { headers: CORS });
  }

  if (path === '/admin/search-phrases' && method === 'POST') {
    let body: unknown;
    try { body = await request.json(); } catch { body = {}; }
    const phrase = normalisePhrase((body as { phrase?: unknown }).phrase);
    const productIds = (body as { product_ids?: unknown }).product_ids;
    if (!phrase) {
      return new Response(JSON.stringify({ error: 'phrase required (≤80 chars)' }), { status: 400, headers: CORS });
    }
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return new Response(JSON.stringify({ error: 'product_ids[] required' }), { status: 400, headers: CORS });
    }
    if (productIds.length > MAX_PHRASES_PER_PRODUCT) {
      return new Response(JSON.stringify({ error: 'too many product_ids' }), { status: 400, headers: CORS });
    }

    // Insert phrase (or fetch existing row by unique phrase).
    await env.DB.prepare('INSERT OR IGNORE INTO search_phrases (phrase) VALUES (?)').bind(phrase).run();
    const row = await env.DB.prepare('SELECT id FROM search_phrases WHERE phrase = ?').bind(phrase).first<{ id: number }>();
    if (!row) {
      return new Response(JSON.stringify({ error: 'Failed to persist phrase' }), { status: 500, headers: CORS });
    }

    const mapStmts = productIds.map((pid) =>
      env.DB.prepare('INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) VALUES (?, ?)').bind(row.id, pid)
    );
    await env.DB.batch(mapStmts);
    await rebuildFtsPhrasesForProducts(env, productIds as string[]);

    return new Response(JSON.stringify({ success: true, id: row.id }), { status: 201, headers: CORS });
  }

  if (id !== null && method === 'PUT') {
    let body: unknown;
    try { body = await request.json(); } catch { body = {}; }
    const newPhrase = normalisePhrase((body as { phrase?: unknown }).phrase);
    const productIds = (body as { product_ids?: unknown }).product_ids;
    if (!newPhrase) {
      return new Response(JSON.stringify({ error: 'phrase required (≤80 chars)' }), { status: 400, headers: CORS });
    }
    if (!Array.isArray(productIds)) {
      return new Response(JSON.stringify({ error: 'product_ids[] required' }), { status: 400, headers: CORS });
    }

    // Capture the products currently mapped so we can refresh their FTS row
    // whether they stay or get removed.
    const oldMap = await env.DB.prepare('SELECT product_id FROM search_phrase_products WHERE phrase_id = ?')
      .bind(id)
      .all<{ product_id: string }>();
    const oldProductIds = (oldMap.results ?? []).map((r) => r.product_id);

    await env.DB.prepare('UPDATE search_phrases SET phrase = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .bind(newPhrase, id).run();
    await env.DB.prepare('DELETE FROM search_phrase_products WHERE phrase_id = ?').bind(id).run();

    const mapStmts = (productIds as string[]).map((pid) =>
      env.DB.prepare('INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) VALUES (?, ?)').bind(id, pid)
    );
    if (mapStmts.length > 0) await env.DB.batch(mapStmts);

    const affected = Array.from(new Set([...oldProductIds, ...(productIds as string[])]));
    await rebuildFtsPhrasesForProducts(env, affected);

    return new Response(JSON.stringify({ success: true }), { headers: CORS });
  }

  if (id !== null && method === 'DELETE') {
    const oldMap = await env.DB.prepare('SELECT product_id FROM search_phrase_products WHERE phrase_id = ?')
      .bind(id)
      .all<{ product_id: string }>();
    const affected = (oldMap.results ?? []).map((r) => r.product_id);

    await env.DB.prepare('DELETE FROM search_phrases WHERE id = ?').bind(id).run();
    // search_phrase_products cascades via the FK.
    await rebuildFtsPhrasesForProducts(env, affected);

    return new Response(JSON.stringify({ success: true }), { headers: CORS });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: CORS });
}
