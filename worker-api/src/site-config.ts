import type { Env } from './index';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const PUBLIC_CACHE = 'public, s-maxage=3600';

// Allowlist — only keys declared here can be written or read publicly.
// Defends against admin writing random keys and widening the public surface.
const ALLOWED_KEYS = new Set<string>([
  'social.facebook',
  'social.instagram',
  'social.tiktok',
  'trust.google_business',
  'trust.trustpilot',
]);

const MAX_VALUE_LEN = 300;

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

function isValidUrlOrEmpty(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (value.length > MAX_VALUE_LEN) return false;
  const trimmed = value.trim();
  if (trimmed === '') return true;
  try {
    const u = new URL(trimmed);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

async function readAll(env: Env): Promise<Record<string, string>> {
  const { results } = await env.DB.prepare(
    'SELECT key, value FROM site_config'
  ).all<{ key: string; value: string }>();
  const out: Record<string, string> = {};
  for (const row of results ?? []) {
    if (ALLOWED_KEYS.has(row.key)) out[row.key] = row.value ?? '';
  }
  // Ensure every allowlisted key is present in the response, even if the
  // row is missing, so the UI can always render inputs for the full set.
  for (const k of ALLOWED_KEYS) if (!(k in out)) out[k] = '';
  return out;
}

export async function handleSiteConfig(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (path === '/public/site-config' && method === 'GET') {
    const config = await readAll(env);
    return new Response(JSON.stringify({ config }), {
      headers: { ...CORS, 'Cache-Control': PUBLIC_CACHE },
    });
  }

  if (path === '/admin/site-config' && method === 'GET') {
    const adminId = await getAdminUserId(request, env);
    if (!adminId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: CORS,
      });
    }
    const config = await readAll(env);
    return new Response(JSON.stringify({ config }), { headers: CORS });
  }

  if (path === '/admin/site-config' && method === 'PUT') {
    const adminId = await getAdminUserId(request, env);
    if (!adminId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: CORS,
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: CORS,
      });
    }

    const updates = (body as { updates?: Record<string, string> })?.updates;
    if (!updates || typeof updates !== 'object') {
      return new Response(JSON.stringify({ error: 'Missing `updates` map' }), {
        status: 400,
        headers: CORS,
      });
    }

    const invalid: string[] = [];
    for (const [k, v] of Object.entries(updates)) {
      if (!ALLOWED_KEYS.has(k)) {
        invalid.push(`${k}: unknown key`);
        continue;
      }
      if (!isValidUrlOrEmpty(v)) {
        invalid.push(`${k}: must be empty or a valid http(s) URL`);
      }
    }
    if (invalid.length > 0) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: invalid }), {
        status: 400,
        headers: CORS,
      });
    }

    const stmts = Object.entries(updates).map(([k, v]) =>
      env.DB.prepare(
        `INSERT INTO site_config (key, value, updated_at, updated_by)
         VALUES (?, ?, datetime('now'), ?)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = excluded.updated_at,
           updated_by = excluded.updated_by`
      ).bind(k, String(v).trim(), adminId)
    );
    await env.DB.batch(stmts);

    const config = await readAll(env);
    return new Response(JSON.stringify({ success: true, config }), { headers: CORS });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: CORS,
  });
}
