/**
 * Search Console — public log endpoints + admin analytics + configs CRUD.
 *
 * Public (unauthenticated, fire-and-forget):
 *   POST /search/log            { query, result_count, visitor_id? }
 *   POST /search/log-click      { query, clicked_id, visitor_id? }
 *
 * Admin:
 *   GET  /admin/search-analytics?range=30d       aggregates
 *   GET  /admin/search-configs                   list
 *   POST /admin/search-configs                   { name, description?, is_active? }
 *   PUT  /admin/search-configs/:id               { name?, description?, is_active? }
 *   DELETE /admin/search-configs/:id
 *
 * Mutations to configs rebuild FTS phrases for every affected product so
 * toggling a config on/off goes live immediately without deploy.
 */
import type { Env } from './index';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const MAX_QUERY_LEN = 80;
const MAX_VISITOR_LEN = 80;
const MAX_CONFIG_NAME_LEN = 80;

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

function sanitiseString(raw: unknown, maxLen: number): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > maxLen) return null;
  return trimmed;
}

async function rebuildAllActivePhrases(env: Env): Promise<void> {
  // One query rebuilds every product's phrases column from active configs.
  await env.DB.prepare(
    `UPDATE products_fts
        SET phrases = COALESCE(
          (SELECT GROUP_CONCAT(sp.phrase, ' ')
             FROM search_phrases sp
             JOIN search_phrase_products spp ON spp.phrase_id = sp.id
             JOIN search_configs sc          ON sc.id         = sp.config_id
            WHERE spp.product_id = products_fts.product_id
              AND sc.is_active = 1),
          ''
        )`
  ).run();
}

// ───────────────────────────────────────────────────────────────────────
// Public log endpoints
// ───────────────────────────────────────────────────────────────────────

async function handleLogSearch(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try { body = await request.json(); } catch { body = {}; }

  const query = sanitiseString((body as { query?: unknown }).query, MAX_QUERY_LEN);
  const rawCount = (body as { result_count?: unknown }).result_count;
  const resultCount = typeof rawCount === 'number' && Number.isFinite(rawCount)
    ? Math.max(0, Math.min(1000, Math.floor(rawCount)))
    : 0;
  const visitorId = sanitiseString((body as { visitor_id?: unknown }).visitor_id, MAX_VISITOR_LEN);

  if (!query) {
    // Silently accept — client is fire-and-forget and we don't want to
    // leak why any individual log was dropped.
    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  }

  await env.DB.prepare(
    'INSERT INTO search_events (query, query_lower, result_count, visitor_id) VALUES (?, ?, ?, ?)'
  ).bind(query, query.toLowerCase(), resultCount, visitorId).run();

  return new Response(JSON.stringify({ ok: true }), { headers: CORS });
}

async function handleLogClick(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try { body = await request.json(); } catch { body = {}; }

  const query = sanitiseString((body as { query?: unknown }).query, MAX_QUERY_LEN);
  const clickedId = sanitiseString((body as { clicked_id?: unknown }).clicked_id, 128);
  const visitorId = sanitiseString((body as { visitor_id?: unknown }).visitor_id, MAX_VISITOR_LEN);

  if (!query || !clickedId) {
    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  }

  // Attach the click to the most recent matching event from the same visitor
  // (if we have one) within the last 10 minutes. Falls back to newest row
  // matching the query if no visitor.
  await env.DB.prepare(
    `UPDATE search_events
        SET clicked_id = ?
      WHERE id = (
        SELECT id FROM search_events
         WHERE query_lower = ?
           AND (visitor_id IS ? OR ? IS NULL)
           AND datetime(created_at) >= datetime('now', '-10 minutes')
         ORDER BY id DESC LIMIT 1
      )`
  ).bind(clickedId, query.toLowerCase(), visitorId, visitorId).run();

  return new Response(JSON.stringify({ ok: true }), { headers: CORS });
}

// ───────────────────────────────────────────────────────────────────────
// Admin analytics aggregates
// ───────────────────────────────────────────────────────────────────────

function daysForRange(range: string | null): number {
  const n = parseInt((range ?? '').replace('d', ''), 10);
  if (Number.isFinite(n) && n > 0 && n <= 365) return n;
  return 30;
}

async function handleAnalytics(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const days = daysForRange(url.searchParams.get('range'));
  const sinceClause = `datetime(created_at) >= datetime('now', '-${days} days')`;

  const [topQ, zeroQ, dailyQ, totalQ] = await Promise.all([
    env.DB.prepare(
      `SELECT query_lower AS query,
              COUNT(*)             AS count,
              AVG(result_count)    AS avg_results,
              SUM(CASE WHEN clicked_id IS NOT NULL THEN 1 ELSE 0 END) AS clicks
         FROM search_events
        WHERE ${sinceClause}
        GROUP BY query_lower
        ORDER BY count DESC
        LIMIT 25`
    ).all<{ query: string; count: number; avg_results: number; clicks: number }>(),

    env.DB.prepare(
      `SELECT query_lower AS query, COUNT(*) AS count
         FROM search_events
        WHERE ${sinceClause} AND result_count = 0
        GROUP BY query_lower
        ORDER BY count DESC
        LIMIT 25`
    ).all<{ query: string; count: number }>(),

    env.DB.prepare(
      `SELECT date(created_at) AS day, COUNT(*) AS count
         FROM search_events
        WHERE ${sinceClause}
        GROUP BY day
        ORDER BY day ASC`
    ).all<{ day: string; count: number }>(),

    env.DB.prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN clicked_id IS NOT NULL THEN 1 ELSE 0 END) AS clicks,
              SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END)       AS zero
         FROM search_events
        WHERE ${sinceClause}`
    ).first<{ total: number; clicks: number; zero: number }>(),
  ]);

  return new Response(
    JSON.stringify({
      range_days: days,
      totals: {
        searches: totalQ?.total ?? 0,
        clicks: totalQ?.clicks ?? 0,
        zero_result: totalQ?.zero ?? 0,
      },
      top_queries: topQ.results ?? [],
      zero_result_queries: zeroQ.results ?? [],
      daily: dailyQ.results ?? [],
    }),
    { headers: CORS }
  );
}

// ───────────────────────────────────────────────────────────────────────
// Admin search_configs CRUD
// ───────────────────────────────────────────────────────────────────────

async function listConfigs(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT sc.id, sc.name, sc.description, sc.is_active,
            sc.created_at, sc.updated_at,
            (SELECT COUNT(*) FROM search_phrases sp WHERE sp.config_id = sc.id) AS phrase_count
       FROM search_configs sc
       ORDER BY sc.is_active DESC, sc.name COLLATE NOCASE`
  ).all();
  return new Response(JSON.stringify({ configs: results ?? [] }), { headers: CORS });
}

async function createConfig(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try { body = await request.json(); } catch { body = {}; }
  const name = sanitiseString((body as { name?: unknown }).name, MAX_CONFIG_NAME_LEN);
  const description = sanitiseString((body as { description?: unknown }).description, 300) ?? '';
  const isActiveRaw = (body as { is_active?: unknown }).is_active;
  const isActive = isActiveRaw === false || isActiveRaw === 0 ? 0 : 1;

  if (!name) {
    return new Response(JSON.stringify({ error: 'name required' }), { status: 400, headers: CORS });
  }

  try {
    const res = await env.DB.prepare(
      `INSERT INTO search_configs (name, description, is_active) VALUES (?, ?, ?) RETURNING id`
    ).bind(name, description, isActive).first<{ id: number }>();
    return new Response(JSON.stringify({ success: true, id: res?.id }), { status: 201, headers: CORS });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 400, headers: CORS });
  }
}

async function updateConfig(id: number, request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try { body = await request.json(); } catch { body = {}; }

  const updates: string[] = [];
  const bindings: unknown[] = [];

  if ('name' in (body as object)) {
    const name = sanitiseString((body as { name?: unknown }).name, MAX_CONFIG_NAME_LEN);
    if (!name) return new Response(JSON.stringify({ error: 'name invalid' }), { status: 400, headers: CORS });
    updates.push('name = ?'); bindings.push(name);
  }
  if ('description' in (body as object)) {
    const description = sanitiseString((body as { description?: unknown }).description, 300) ?? '';
    updates.push('description = ?'); bindings.push(description);
  }
  let activeChanged = false;
  if ('is_active' in (body as object)) {
    const raw = (body as { is_active?: unknown }).is_active;
    const v = raw === false || raw === 0 ? 0 : 1;
    updates.push('is_active = ?'); bindings.push(v);
    activeChanged = true;
  }

  if (updates.length === 0) {
    return new Response(JSON.stringify({ error: 'nothing to update' }), { status: 400, headers: CORS });
  }

  updates.push(`updated_at = datetime('now')`);
  bindings.push(id);

  await env.DB.prepare(`UPDATE search_configs SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();

  // If the active flag changed, rebuild FTS for every product that has a
  // phrase in any config — the active set just changed.
  if (activeChanged) await rebuildAllActivePhrases(env);

  return new Response(JSON.stringify({ success: true }), { headers: CORS });
}

async function deleteConfig(id: number, env: Env): Promise<Response> {
  if (id === 1) {
    return new Response(JSON.stringify({ error: 'Cannot delete the default "Always on" config' }), {
      status: 400, headers: CORS,
    });
  }
  // Re-home this config's phrases into the default, then delete the config.
  await env.DB.batch([
    env.DB.prepare('UPDATE search_phrases SET config_id = 1 WHERE config_id = ?').bind(id),
    env.DB.prepare('DELETE FROM search_configs WHERE id = ?').bind(id),
  ]);
  await rebuildAllActivePhrases(env);
  return new Response(JSON.stringify({ success: true }), { headers: CORS });
}

// ───────────────────────────────────────────────────────────────────────
// Router
// ───────────────────────────────────────────────────────────────────────

export async function handleSearchAnalytics(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Public log endpoints — no auth.
  if (path === '/search/log' && method === 'POST') return handleLogSearch(request, env);
  if (path === '/search/log-click' && method === 'POST') return handleLogClick(request, env);

  // Admin endpoints — auth gated.
  const adminId = await getAdminUserId(request, env);
  if (!adminId) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: CORS });
  }

  if (path === '/admin/search-analytics' && method === 'GET') return handleAnalytics(request, env);

  if (path === '/admin/search-configs') {
    if (method === 'GET') return listConfigs(env);
    if (method === 'POST') return createConfig(request, env);
  }
  const idMatch = path.match(/^\/admin\/search-configs\/(\d+)\/?$/);
  if (idMatch) {
    const id = parseInt(idMatch[1], 10);
    if (method === 'PUT') return updateConfig(id, request, env);
    if (method === 'DELETE') return deleteConfig(id, env);
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: CORS });
}
