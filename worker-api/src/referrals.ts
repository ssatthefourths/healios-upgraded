/**
 * Referrals worker — replaces three Supabase calls:
 *   - rpc('get_or_create_referral_code')   →  POST /referrals/code
 *   - .from('referrals').select(...)       →  GET  /referrals
 *   - rpc('apply_referral_code')           →  POST /referrals/apply
 *
 * Tables (added in migration 022): referral_codes, referrals.
 */
import { Env } from './index';
import { requireAuth, jsonHeaders, badRequest, ok, notFound } from './lib/auth-helpers';

function generateReferralCode(): string {
  // 8 char A-Z + 2-9 (drop O/0/I/1 to avoid look-alikes). Collision risk
  // is ~1 in 32^8 = 1.1T, which we still defend against by retrying on
  // unique-constraint failure.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function handleReferrals(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: jsonHeaders });

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // POST /referrals/code  — get-or-create the caller's referral code
  if (path === '/referrals/code' && method === 'POST') {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const userId = auth;

    const existing = await env.DB.prepare(
      'SELECT code FROM referral_codes WHERE user_id = ?',
    ).bind(userId).first<{ code: string }>();
    if (existing?.code) return ok({ code: existing.code });

    // Generate + insert with up to 5 retries on UNIQUE collision.
    for (let i = 0; i < 5; i++) {
      const code = generateReferralCode();
      try {
        await env.DB.prepare(
          'INSERT INTO referral_codes (user_id, code) VALUES (?, ?)',
        ).bind(userId, code).run();
        return ok({ code });
      } catch (err) {
        // UNIQUE constraint failed — try a fresh code.
        if (i === 4) throw err;
      }
    }
    return badRequest('Failed to generate referral code');
  }

  // GET /referrals  — list referrals where the caller is the referrer
  if (path === '/referrals' && method === 'GET') {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const userId = auth;

    const { results } = await env.DB.prepare(
      `SELECT id, referrer_id, referred_email, referred_user_id, status,
              reward_points, order_id, created_at, converted_at
       FROM referrals
       WHERE referrer_id = ?
       ORDER BY created_at DESC
       LIMIT 200`,
    ).bind(userId).all();

    return ok({ data: results ?? [] });
  }

  // POST /referrals/apply  — { code, referredEmail? }
  if (path === '/referrals/apply' && method === 'POST') {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const userId = auth;

    let body: { code?: string; referredEmail?: string };
    try {
      body = (await request.json()) as { code?: string; referredEmail?: string };
    } catch {
      return badRequest('Invalid JSON');
    }
    const code = (body.code ?? '').trim().toUpperCase();
    if (!code) return badRequest('Code is required');

    const owner = await env.DB.prepare(
      'SELECT user_id FROM referral_codes WHERE code = ?',
    ).bind(code).first<{ user_id: string }>();
    if (!owner) return badRequest('Invalid code');
    if (owner.user_id === userId) return badRequest('Cannot use your own code');

    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO referrals (id, referrer_id, referred_email, referred_user_id, status)
       VALUES (?, ?, ?, ?, 'pending')`,
    ).bind(id, owner.user_id, body.referredEmail ?? null, userId).run();

    return ok({ id, referrerId: owner.user_id, status: 'pending' });
  }

  return notFound();
}
