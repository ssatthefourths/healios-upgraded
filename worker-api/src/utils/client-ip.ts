/**
 * Client-IP hashing utilities.
 *
 * Policy:
 * - We never persist a raw client IP. Any code path that logs or rate-limits
 *   on the caller's IP must go through hashClientIp() first.
 * - Hash = SHA-256 of `<IP_HASH_SECRET>:<yyyy-mm-dd>:<ip>` truncated to 16 hex
 *   chars. 64 bits of entropy is sufficient for rate-limit bucket uniqueness
 *   and resistant to offline rainbow-table attack given the per-day salt.
 * - The daily salt means yesterday's hashes cannot be correlated with today's,
 *   limiting cross-day profiling.
 * - Retention: 30 days for any row that stores the hash. Enforced by the
 *   scheduled() handler in src/index.ts (cron: 0 3 * * *).
 *
 * Required env:
 *   IP_HASH_SECRET — set via `wrangler secret put IP_HASH_SECRET`.
 *   Rotate yearly. Rotation invalidates historical hash correlations, which
 *   is a feature, not a bug.
 */

import type { Env } from '../index';

const RETENTION_DAYS = 30;

/**
 * Returns a stable-for-24h, unrecoverable hash of the caller's IP.
 * Falls back to 'unknown' when the Worker runtime didn't expose one.
 */
export async function hashClientIp(request: Request, env: Env): Promise<string> {
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';

  if (!env.IP_HASH_SECRET) {
    // No secret configured — refuse to silently reduce privacy. Caller can
    // handle null to decide whether to proceed without IP-based logic.
    console.warn('[client-ip] IP_HASH_SECRET not set; returning "unconfigured"');
    return 'unconfigured';
  }

  const day = new Date().toISOString().slice(0, 10); // yyyy-mm-dd (UTC)
  const input = `${env.IP_HASH_SECRET}:${day}:${ip}`;
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

/**
 * Daily cron: prune hashes older than RETENTION_DAYS from every table that
 * stores them. Called from scheduled() in src/index.ts.
 */
export async function pruneExpiredIpHashes(env: Env): Promise<{ deleted: number }> {
  const cutoff = Math.floor(Date.now() / 1000) - RETENTION_DAYS * 86400;
  // DSR requests: only the ip_hash column is pruned; the case itself is retained
  // (we need the audit trail of who submitted what, but the IP linkage expires).
  const res = await env.DB.prepare(
    `UPDATE dsr_requests SET ip_hash = NULL WHERE ip_hash IS NOT NULL AND submitted_at < ?`,
  )
    .bind(cutoff)
    .run();
  return { deleted: res.meta?.changes ?? 0 };
}
