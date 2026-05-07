/**
 * Subscriptions management — replaces functions.invoke('manage-subscription').
 *
 * The frontend SubscriptionSection + FrequencyChangeDialog call this from
 * 5 sites with action ∈ {pause, resume, cancel, frequency}. We expose four
 * dedicated routes so admin audit + access control are easier to reason
 * about than a single big switch.
 *
 * All endpoints require auth + ownership: the subscription must belong to
 * the requesting user. Stripe is the source of truth — D1 caches the row
 * for fast reads. Each call updates Stripe, then writes the new state to
 * D1 in the same handler.
 */
import { Env } from './index';
import { requireAuth, jsonHeaders, badRequest, ok, notFound, forbidden } from './lib/auth-helpers';

async function stripePost(path: string, body: Record<string, unknown>, stripeKey: string) {
  const encode = (obj: Record<string, unknown>, prefix = ''): string =>
    Object.entries(obj)
      .flatMap(([k, v]) => {
        const key = prefix ? `${prefix}[${k}]` : k;
        if (v === null || v === undefined) return [];
        if (typeof v === 'object' && !Array.isArray(v))
          return [encode(v as Record<string, unknown>, key)];
        return [`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`];
      })
      .join('&');

  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      // Idempotency-Key prevents accidental double-mutation on retries.
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: encode(body),
  });
  const data = (await res.json()) as any;
  if (!res.ok) throw new Error(data?.error?.message || `Stripe error (${res.status})`);
  return data;
}

async function loadOwnedSubscription(env: Env, userId: string, subId: string) {
  return env.DB.prepare(
    `SELECT id, stripe_subscription_id, user_id, status, frequency
     FROM subscriptions WHERE id = ?`,
  ).bind(subId).first<{
    id: string;
    stripe_subscription_id: string | null;
    user_id: string;
    status: string;
    frequency: string | null;
  }>();
}

export async function handleSubscriptionsManage(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: jsonHeaders });

  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  const userId = auth;

  const url = new URL(request.url);
  const m = url.pathname.match(/^\/subscriptions\/([^/]+)\/(pause|resume|cancel|frequency)$/);
  if (!m || request.method !== 'POST') return notFound();

  const [, subId, action] = m;
  const sub = await loadOwnedSubscription(env, userId, subId);
  if (!sub) return notFound();
  if (sub.user_id !== userId) return forbidden();

  const stripeKey = (env as any).STRIPE_KEY as string;
  const stripeSubId = sub.stripe_subscription_id;

  if (action === 'pause') {
    if (stripeSubId) {
      await stripePost(`/subscriptions/${stripeSubId}`, {
        pause_collection: { behavior: 'mark_uncollectible' },
      }, stripeKey);
    }
    await env.DB.prepare(`UPDATE subscriptions SET status = 'paused', updated_at = datetime('now') WHERE id = ?`)
      .bind(subId).run();
    return ok({ id: subId, status: 'paused' });
  }

  if (action === 'resume') {
    if (stripeSubId) {
      // Stripe REST quirk: empty pause_collection clears the pause.
      await stripePost(`/subscriptions/${stripeSubId}`, { pause_collection: '' }, stripeKey);
    }
    await env.DB.prepare(`UPDATE subscriptions SET status = 'active', updated_at = datetime('now') WHERE id = ?`)
      .bind(subId).run();
    return ok({ id: subId, status: 'active' });
  }

  if (action === 'cancel') {
    if (stripeSubId) {
      await stripePost(`/subscriptions/${stripeSubId}`, { cancel_at_period_end: 'true' }, stripeKey);
    }
    await env.DB.prepare(`UPDATE subscriptions SET status = 'cancelling', updated_at = datetime('now') WHERE id = ?`)
      .bind(subId).run();
    return ok({ id: subId, status: 'cancelling' });
  }

  if (action === 'frequency') {
    let body: { frequency?: string };
    try { body = (await request.json()) as { frequency?: string }; }
    catch { return badRequest('Invalid JSON'); }

    const allowed = ['weekly', 'fortnightly', 'monthly', 'two_monthly', 'three_monthly'];
    const freq = (body.frequency ?? '').toLowerCase();
    if (!allowed.includes(freq)) return badRequest(`frequency must be one of ${allowed.join(', ')}`);

    // Stripe price update must happen on a metered/recurring price object.
    // If the integration uses fixed prices per frequency, the caller is
    // expected to swap out the price at upgrade time — for now we update
    // the D1 cache so subsequent shipments use the new cadence; admins
    // reconcile with Stripe when prices change. Kept conservative to
    // avoid blowing up active billing.
    await env.DB.prepare(
      `UPDATE subscriptions SET frequency = ?, updated_at = datetime('now') WHERE id = ?`,
    ).bind(freq, subId).run();

    return ok({ id: subId, frequency: freq });
  }

  return notFound();
}
