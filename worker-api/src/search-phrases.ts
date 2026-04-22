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
  // Only aggregate phrases from configs where is_active = 1. Phrases bound
  // to disabled configs stop contributing to search the instant the config
  // is toggled off.
  const stmts = productIds.map((pid) =>
    env.DB.prepare(
      `UPDATE products_fts
          SET phrases = COALESCE(
            (SELECT GROUP_CONCAT(sp.phrase, ' ')
               FROM search_phrases sp
               JOIN search_phrase_products spp ON spp.phrase_id = sp.id
               JOIN search_configs sc          ON sc.id         = sp.config_id
              WHERE spp.product_id = ?
                AND sc.is_active = 1),
            ''
          )
        WHERE product_id = ?`
    ).bind(pid, pid)
  );
  await env.DB.batch(stmts);
}

interface PhraseRow { id: number; phrase: string; product_ids: string[]; config_id: number }

async function listAll(env: Env, configId: number | null): Promise<PhraseRow[]> {
  const where = configId != null ? 'WHERE sp.config_id = ?' : '';
  const bindings = configId != null ? [configId] : [];
  const { results } = await env.DB.prepare(
    `SELECT sp.id, sp.phrase, sp.config_id,
            COALESCE(GROUP_CONCAT(spp.product_id, ','), '') AS product_ids_csv
     FROM search_phrases sp
     LEFT JOIN search_phrase_products spp ON spp.phrase_id = sp.id
     ${where}
     GROUP BY sp.id, sp.phrase, sp.config_id
     ORDER BY sp.phrase COLLATE NOCASE`
  ).bind(...bindings).all<{ id: number; phrase: string; config_id: number; product_ids_csv: string }>();

  return (results ?? []).map((r) => ({
    id: r.id,
    phrase: r.phrase,
    config_id: r.config_id,
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
    const configParam = url.searchParams.get('config_id');
    const configId = configParam ? parseInt(configParam, 10) : null;
    const data = await listAll(env, Number.isFinite(configId ?? NaN) ? configId : null);
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

    // Accept optional config_id so the new phrase belongs to a specific config.
    const rawConfigId = (body as { config_id?: unknown }).config_id;
    const configId = typeof rawConfigId === 'number' && Number.isFinite(rawConfigId) ? rawConfigId : 1;

    // Insert phrase (or fetch existing row by unique phrase).
    await env.DB.prepare(
      'INSERT OR IGNORE INTO search_phrases (phrase, config_id) VALUES (?, ?)'
    ).bind(phrase, configId).run();
    // If it already existed with a different config, honour the caller's choice.
    await env.DB.prepare('UPDATE search_phrases SET config_id = ? WHERE phrase = ?')
      .bind(configId, phrase).run();
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

  // Bulk: admin picks N queries from the analytics page + M products in one drawer.
  // Create one phrase per query mapped to all selected products in target config.
  if (path === '/admin/search-phrases/bulk' && method === 'POST') {
    let body: unknown;
    try { body = await request.json(); } catch { body = {}; }
    const phrasesIn = (body as { phrases?: unknown }).phrases;
    const productIds = (body as { product_ids?: unknown }).product_ids;
    const rawConfigId = (body as { config_id?: unknown }).config_id;
    const configId = typeof rawConfigId === 'number' && Number.isFinite(rawConfigId) ? rawConfigId : 1;

    if (!Array.isArray(phrasesIn) || phrasesIn.length === 0) {
      return new Response(JSON.stringify({ error: 'phrases[] required' }), { status: 400, headers: CORS });
    }
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return new Response(JSON.stringify({ error: 'product_ids[] required' }), { status: 400, headers: CORS });
    }

    const cleanPhrases: string[] = [];
    for (const p of phrasesIn) {
      const norm = normalisePhrase(p);
      if (norm) cleanPhrases.push(norm);
    }
    if (cleanPhrases.length === 0) {
      return new Response(JSON.stringify({ error: 'no valid phrases' }), { status: 400, headers: CORS });
    }

    // Upsert each phrase, then map it to every selected product.
    const stmts: ReturnType<typeof env.DB.prepare>[] = [];
    for (const phrase of cleanPhrases) {
      stmts.push(
        env.DB.prepare(
          'INSERT OR IGNORE INTO search_phrases (phrase, config_id) VALUES (?, ?)'
        ).bind(phrase, configId)
      );
      stmts.push(
        env.DB.prepare('UPDATE search_phrases SET config_id = ? WHERE phrase = ?').bind(configId, phrase)
      );
    }
    await env.DB.batch(stmts);

    // Fetch the phrase ids we now own, then insert the mappings.
    const { results: phraseRows } = await env.DB.prepare(
      `SELECT id, phrase FROM search_phrases WHERE phrase IN (${cleanPhrases.map(() => '?').join(',')})`
    ).bind(...cleanPhrases).all<{ id: number; phrase: string }>();

    const mapStmts: ReturnType<typeof env.DB.prepare>[] = [];
    for (const row of phraseRows ?? []) {
      for (const pid of productIds as string[]) {
        mapStmts.push(
          env.DB.prepare(
            'INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) VALUES (?, ?)'
          ).bind(row.id, pid)
        );
      }
    }
    if (mapStmts.length > 0) await env.DB.batch(mapStmts);
    await rebuildFtsPhrasesForProducts(env, productIds as string[]);

    return new Response(
      JSON.stringify({ success: true, created: cleanPhrases.length, mapped_products: (productIds as string[]).length }),
      { status: 201, headers: CORS }
    );
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: CORS });
}
