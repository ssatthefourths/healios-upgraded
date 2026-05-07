/**
 * Shared auth helpers for worker handlers. Mirrors the pattern in
 * admin-orders.ts so handlers don't duplicate the requireAdmin /
 * requireAuth dance — and so we have ONE place to evolve the JWT/session
 * model when we move off SESSIONS KV.
 */
import { Env } from '../index';

export const jsonHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: jsonHeaders });
}

export function forbidden(): Response {
  return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: jsonHeaders });
}

export function badRequest(message: string): Response {
  return new Response(JSON.stringify({ error: message }), { status: 400, headers: jsonHeaders });
}

export function notFound(): Response {
  return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: jsonHeaders });
}

export function ok<T>(body: T): Response {
  return new Response(JSON.stringify(body), { headers: jsonHeaders });
}

/**
 * Resolve the authenticated user from `Authorization: Bearer <session>`.
 * Returns the user_id string, or a 401 Response.
 */
export async function requireAuth(request: Request, env: Env): Promise<string | Response> {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return unauthorized();
  const userId = await env.SESSIONS.get(token);
  if (!userId) return unauthorized();
  return userId;
}

/**
 * Same as requireAuth, but additionally checks user_roles.role === 'admin'.
 */
export async function requireAdmin(request: Request, env: Env): Promise<string | Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  const role = await env.DB.prepare('SELECT role FROM user_roles WHERE user_id = ?')
    .bind(auth)
    .first<{ role: string }>();
  if (role?.role !== 'admin') return forbidden();
  return auth;
}
