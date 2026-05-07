/**
 * GDPR Art. 17 account deletion — replaces functions.invoke('delete-account').
 *
 * Soft-delete pattern: PII columns on profiles + addresses + users are
 * redacted, the SESSIONS token is invalidated, an audit row is written
 * to account_deletion_log. Order history is RETAINED (POPIA + SARS tax
 * retention requires invoices for ~7 years) but customer columns on
 * those orders are scrubbed.
 *
 * Stripe customer deletion is best-effort — failure does not abort the
 * D1 redaction. Admin can reconcile any orphans manually.
 */
import { Env } from './index';
import { requireAuth, jsonHeaders, ok } from './lib/auth-helpers';

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function handleAccountDelete(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: jsonHeaders });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });

  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  const userId = auth;

  const user = await env.DB.prepare(
    'SELECT id, email FROM users WHERE id = ?',
  ).bind(userId).first<{ id: string; email: string }>();
  if (!user) return ok({ deleted: false, reason: 'already_gone' });

  const emailHash = await sha256Hex(user.email.toLowerCase());
  const placeholderEmail = `deleted-${userId.slice(0, 8)}@deleted.thehealios.invalid`;

  // ── Redact in batch ────────────────────────────────────────────────────
  const redactStatements = [
    env.DB.prepare(`UPDATE users     SET email = ?, password_hash = '' WHERE id = ?`).bind(placeholderEmail, userId),
    env.DB.prepare(`UPDATE profiles  SET first_name = NULL, last_name = NULL, phone = NULL WHERE id = ?`).bind(userId),
    env.DB.prepare(`DELETE FROM addresses WHERE user_id = ?`).bind(userId),
    env.DB.prepare(`DELETE FROM wishlist  WHERE user_id = ?`).bind(userId),
    // Orders are retained for tax compliance, but PII columns are scrubbed.
    env.DB.prepare(
      `UPDATE orders SET customer_email = ?, customer_first_name = '[deleted]',
              customer_last_name = '', customer_phone = NULL,
              shipping_address = '[deleted]', shipping_address_2 = NULL,
              shipping_city = '[deleted]', shipping_postal_code = '[deleted]'
       WHERE user_id = ?`,
    ).bind(placeholderEmail, userId),
    env.DB.prepare(
      `INSERT OR REPLACE INTO account_deletion_log (user_id, email_hash, reason)
       VALUES (?, ?, ?)`,
    ).bind(userId, emailHash, 'user_request'),
  ];
  await env.DB.batch(redactStatements);

  // ── Best-effort Stripe customer deletion ───────────────────────────────
  try {
    const stripeCustomer = await env.DB.prepare(
      `SELECT stripe_customer_id FROM subscriptions WHERE user_id = ? LIMIT 1`,
    ).bind(userId).first<{ stripe_customer_id: string | null }>();
    const stripeKey = (env as any).STRIPE_KEY as string;
    if (stripeCustomer?.stripe_customer_id && stripeKey) {
      await fetch(`https://api.stripe.com/v1/customers/${stripeCustomer.stripe_customer_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${stripeKey}` },
      });
    }
  } catch (err) {
    console.error('[account-delete] stripe cleanup failed (non-fatal):', err);
  }

  // ── Invalidate the requester's session ─────────────────────────────────
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (token) await env.SESSIONS.delete(token);

  return ok({ deleted: true });
}
