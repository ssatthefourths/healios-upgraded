/**
 * Tiny REST helper for the Cloudflare Worker API. Centralises:
 *   - Base URL resolution (`VITE_CF_WORKER_URL`)
 *   - Bearer token attach (reads from localStorage, same key the auth bridge uses)
 *   - JSON parsing with structured error
 *
 * Use instead of `supabase.rpc(...)` / `supabase.functions.invoke(...)` /
 * `supabase.from('table_we_have_no_route_for')`.
 */

const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';

function authHeader(): Record<string, string> {
  // The cloudflare auth bridge stores the session token under 'cf_session' —
  // matches src/integrations/cloudflare/client.ts.
  const token = (typeof localStorage !== 'undefined' && localStorage.getItem('cf_session')) || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ApiError extends Error {
  status: number;
  body?: unknown;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeader(),
    ...((init.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const text = await res.text();
  let body: unknown;
  try { body = text ? JSON.parse(text) : undefined; }
  catch { body = text; }

  if (!res.ok) {
    const err = new Error(
      (body as any)?.error || `Request failed (${res.status})`,
    ) as ApiError;
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body as T;
}

export const apiGet  = <T>(path: string)             => request<T>(path);
export const apiPost = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined });
export const apiPut  = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined });
export const apiDelete = <T>(path: string) =>
  request<T>(path, { method: 'DELETE' });

export const apiBaseUrl = () => API_URL;
