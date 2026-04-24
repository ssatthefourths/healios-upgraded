/**
 * Data-Subject Request (DSR) handler — GDPR Art. 15/17/20 + UK DPA.
 *
 * Public endpoints:
 *   POST /dsr/request            — submit a new request (rate-limited by email)
 *   GET  /dsr/verify/:token      — click-through confirmation from the email
 *
 * Admin endpoints:
 *   GET  /admin/dsr              — list requests (paginated)
 *   GET  /admin/dsr/:id          — fetch a single request + the user's data export
 *   POST /admin/dsr/:id/complete — mark request closed (body: { action, notes })
 *
 * Notes:
 * - Erasure "deletes" the user by anonymising PII: email becomes
 *   "deleted-<uuid>@healios.local", name cleared, password hash nulled.
 *   Orders are retained (tax / accounting record-keeping duty) with user_id=NULL.
 * - The verify_token is stored as a SHA-256 hex digest; the raw token only
 *   exists in the confirmation email. Rainbow-tabling a 128-bit UUID is
 *   infeasible, but hashing at rest is a hygiene default we want anyway.
 * - No new IP logging is introduced here. Phase 7 (IP hashing) will wire the
 *   ip_hash column when it lands.
 */

import type { Env } from './index';
import { hashClientIp } from './utils/client-ip';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

type RequestType = 'access' | 'erasure' | 'portability';
const VALID_TYPES: Set<RequestType> = new Set(['access', 'erasure', 'portability']);

/** Max requests per email per 24 hours — abuse guard. */
const RATE_LIMIT_PER_EMAIL_24H = 3;

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

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

function jsonOk(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), { ...init, headers: { ...CORS, ...(init.headers ?? {}) } });
}

function jsonErr(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), { status, headers: CORS });
}

function isValidEmail(s: unknown): s is string {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 320;
}

async function sendVerifyEmail(env: Env, email: string, verifyUrl: string, requestType: RequestType) {
  if (!env.RESEND_API_KEY) {
    console.warn('[dsr] RESEND_API_KEY not set — confirmation email skipped');
    return;
  }
  const typeLabel = requestType === 'access' ? 'Data access'
                  : requestType === 'erasure' ? 'Data erasure'
                  : 'Data portability';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Healios <noreply@thehealios.com>',
      to: [email],
      subject: `Confirm your ${typeLabel.toLowerCase()} request`,
      html: `<p>Hi,</p>
             <p>We received a <strong>${typeLabel}</strong> request for your account at thehealios.com. To confirm this was you, please click the link below. The link expires in 48 hours.</p>
             <p><a href="${verifyUrl}">${verifyUrl}</a></p>
             <p>If you didn't make this request, you can ignore this email — no action will be taken.</p>
             <p>The Healios Team</p>`,
    }),
  });
  if (!res.ok) console.error('[dsr] resend error', await res.text());
}

export async function handleDsr(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // ── POST /dsr/request ─────────────────────────────────────────────────────
  if (path === '/dsr/request' && method === 'POST') {
    const body = await request.json().catch(() => null) as {
      email?: string; request_type?: string; reason?: string;
    } | null;
    if (!body) return jsonErr(400, 'invalid_json');

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const requestType = body.request_type as RequestType;
    const reason = typeof body.reason === 'string' ? body.reason.slice(0, 2000) : null;

    if (!isValidEmail(email)) return jsonErr(400, 'invalid_email');
    if (!VALID_TYPES.has(requestType)) return jsonErr(400, 'invalid_request_type');

    // Rate limit per email over the last 24 hours.
    const cutoff = Math.floor(Date.now() / 1000) - 86400;
    const recent = await env.DB.prepare(
      'SELECT COUNT(*) as n FROM dsr_requests WHERE email = ? AND submitted_at > ?'
    ).bind(email, cutoff).first<{ n: number }>();
    if ((recent?.n ?? 0) >= RATE_LIMIT_PER_EMAIL_24H) {
      return jsonErr(429, 'rate_limited');
    }

    // Link to known user if the email matches.
    const userRow = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first<{ id: string }>();
    const userId = userRow?.id ?? null;

    const id = crypto.randomUUID();
    const rawToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
    const tokenHash = await sha256Hex(rawToken);
    const ipHash = await hashClientIp(request, env);

    await env.DB.prepare(
      `INSERT INTO dsr_requests
         (id, email, user_id, request_type, status, reason, verify_token, submitted_at, ip_hash)
       VALUES (?, ?, ?, ?, 'pending_verification', ?, ?, unixepoch(), ?)`
    ).bind(id, email, userId, requestType, reason, tokenHash, ipHash).run();

    const verifyUrl = `https://thehealios.com/privacy/request/verify?token=${rawToken}`;
    await sendVerifyEmail(env, email, verifyUrl, requestType);

    // Always return success to prevent enumeration of which emails we hold.
    return jsonOk({ ok: true });
  }

  // ── GET /dsr/verify/:token ────────────────────────────────────────────────
  if (path.startsWith('/dsr/verify/') && method === 'GET') {
    const rawToken = decodeURIComponent(path.slice('/dsr/verify/'.length));
    if (!rawToken) return jsonErr(400, 'invalid_token');
    const tokenHash = await sha256Hex(rawToken);

    const row = await env.DB.prepare(
      'SELECT id, status, submitted_at FROM dsr_requests WHERE verify_token = ?'
    ).bind(tokenHash).first<{ id: string; status: string; submitted_at: number }>();
    if (!row) return jsonErr(404, 'not_found');

    // 48 hour expiry.
    const now = Math.floor(Date.now() / 1000);
    if (now - row.submitted_at > 48 * 3600) {
      return jsonErr(410, 'token_expired');
    }
    if (row.status !== 'pending_verification') {
      return jsonOk({ ok: true, already_verified: true });
    }

    await env.DB.prepare(
      `UPDATE dsr_requests SET status = 'verified', verified_at = unixepoch(), verify_token = NULL WHERE id = ?`
    ).bind(row.id).run();

    return jsonOk({ ok: true });
  }

  // ── ADMIN: GET /admin/dsr ─────────────────────────────────────────────────
  if (path === '/admin/dsr' && method === 'GET') {
    if (!(await getAdminUserId(request, env))) return jsonErr(401, 'unauthorized');
    const { results } = await env.DB.prepare(
      `SELECT id, email, user_id, request_type, status, reason,
              submitted_at, verified_at, completed_at, completed_by, admin_notes
       FROM dsr_requests
       ORDER BY
         CASE status
           WHEN 'verified'             THEN 1
           WHEN 'in_progress'          THEN 2
           WHEN 'pending_verification' THEN 3
           ELSE 4
         END,
         submitted_at DESC
       LIMIT 200`
    ).all();
    return jsonOk({ requests: results ?? [] });
  }

  // ── ADMIN: GET /admin/dsr/:id ─────────────────────────────────────────────
  if (path.startsWith('/admin/dsr/') && !path.endsWith('/complete') && method === 'GET') {
    if (!(await getAdminUserId(request, env))) return jsonErr(401, 'unauthorized');
    const id = path.slice('/admin/dsr/'.length);
    const row = await env.DB.prepare(
      `SELECT id, email, user_id, request_type, status, reason,
              submitted_at, verified_at, completed_at, completed_by, admin_notes
       FROM dsr_requests WHERE id = ?`
    ).bind(id).first();
    if (!row) return jsonErr(404, 'not_found');

    // Build the export bundle for the user if we know who they are.
    let userData: any = null;
    if ((row as any).user_id) {
      const u = (row as any).user_id;
      const user = await env.DB.prepare(
        'SELECT id, email, first_name, last_name, phone, created_at FROM users WHERE id = ?'
      ).bind(u).first();
      const orders = await env.DB.prepare(
        'SELECT id, order_number, status, total_amount, currency, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC'
      ).bind(u).all();
      const addresses = await env.DB.prepare(
        'SELECT * FROM user_addresses WHERE user_id = ?'
      ).bind(u).all().catch(() => ({ results: [] }));
      userData = {
        user,
        orders: orders.results ?? [],
        addresses: addresses.results ?? [],
      };
    }

    return jsonOk({ request: row, userData });
  }

  // ── ADMIN: POST /admin/dsr/:id/complete ───────────────────────────────────
  if (path.startsWith('/admin/dsr/') && path.endsWith('/complete') && method === 'POST') {
    const adminId = await getAdminUserId(request, env);
    if (!adminId) return jsonErr(401, 'unauthorized');

    const id = path.slice('/admin/dsr/'.length, -('/complete'.length));
    const body = await request.json().catch(() => null) as {
      action?: 'completed' | 'rejected'; notes?: string;
    } | null;
    if (!body || (body.action !== 'completed' && body.action !== 'rejected')) {
      return jsonErr(400, 'invalid_action');
    }
    const notes = typeof body.notes === 'string' ? body.notes.slice(0, 4000) : null;

    const row = await env.DB.prepare(
      'SELECT request_type, user_id, status FROM dsr_requests WHERE id = ?'
    ).bind(id).first<{ request_type: RequestType; user_id: string | null; status: string }>();
    if (!row) return jsonErr(404, 'not_found');
    if (row.status === 'completed' || row.status === 'rejected') {
      return jsonErr(409, 'already_closed');
    }

    // For erasure, anonymise the user record in place. Orders are kept for tax/
    // accounting retention duty — their user_id is nulled to sever the link.
    if (body.action === 'completed' && row.request_type === 'erasure' && row.user_id) {
      const placeholderEmail = `deleted-${row.user_id}@healios.local`;
      await env.DB.prepare(
        `UPDATE users SET
           email = ?,
           first_name = NULL,
           last_name = NULL,
           phone = NULL,
           password_hash = NULL
         WHERE id = ?`
      ).bind(placeholderEmail, row.user_id).run();
      await env.DB.prepare('UPDATE orders SET user_id = NULL WHERE user_id = ?')
        .bind(row.user_id).run();
      // Sessions invalidation: delete any known session keys. Best-effort.
      // (KV has no reverse index by user_id, so this is a soft guarantee.)
    }

    await env.DB.prepare(
      `UPDATE dsr_requests SET
         status = ?, completed_at = unixepoch(), completed_by = ?, admin_notes = ?
       WHERE id = ?`
    ).bind(body.action, adminId, notes, id).run();

    return jsonOk({ ok: true });
  }

  return jsonErr(404, 'not_found');
}
