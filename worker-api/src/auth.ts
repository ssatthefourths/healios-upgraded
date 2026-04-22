import { Env } from './index';
import { hashPassword, verifyPassword, needsRehash, checkPasswordStrength } from './lib/password';

// Re-export so other modules (admin-users.ts) keep their existing import site
// working while using the new PBKDF2 hasher.
export { hashPassword, verifyPassword, checkPasswordStrength } from './lib/password';

// A harmless PBKDF2-formatted placeholder used to flatten the timing of
// `/auth/signin` across the three outcomes (no-user / legacy-hash-wrong /
// pbkdf2-wrong) so an attacker cannot enumerate accounts by response time.
// Its plaintext is a random 256-bit value no one will ever type.
const DUMMY_STORED_HASH = 'pbkdf2$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

export async function handleAuth(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  // POST /auth/signup
  if (path === '/auth/signup' && method === 'POST') {
    const { email, password, firstName, lastName } = await request.json() as any;

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Signup failed' }), { status: 400, headers: corsHeaders });
    }
    const strength = checkPasswordStrength(password);
    if (!strength.ok) {
      return new Response(JSON.stringify({ error: strength.reason }), { status: 400, headers: corsHeaders });
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    try {
      await env.DB.prepare(
        'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)'
      ).bind(id, email, passwordHash).run();

      await env.DB.prepare(
        'INSERT INTO profiles (id, first_name, last_name) VALUES (?, ?, ?)'
      ).bind(id, firstName, lastName).run();

      const sessionToken = await createSession(id, env);

      return new Response(JSON.stringify({ user: { id, email, first_name: firstName, last_name: lastName }, session: sessionToken }), {
        headers: corsHeaders,
      });
    } catch (err: any) {
      // Generic message so an attacker cannot enumerate which emails are already registered.
      return new Response(JSON.stringify({ error: 'Signup failed' }), { status: 400, headers: corsHeaders });
    }
  }

  // POST /auth/signin
  if (path === '/auth/signin' && method === 'POST') {
    const { email, password } = await request.json() as any;

    const user = await env.DB.prepare(
      'SELECT id, email, password_hash FROM users WHERE email = ?'
    ).bind(email).first<any>();

    // Always do a verify so latency is uniform whether or not the email exists.
    // When no user, verify against a dummy hash the attacker can never match.
    const storedHash = user?.password_hash ?? DUMMY_STORED_HASH;
    const verified = await verifyPassword(password, storedHash);
    if (!user || !verified) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: corsHeaders });
    }

    // Upgrade-on-next-login: if the stored hash is the legacy unsalted
    // SHA-256 format, replace it with PBKDF2. Defer via ctx.waitUntil so the
    // extra hashing + D1 UPDATE don't inflate the user-facing request and
    // don't push the signin handler past the free-tier 10ms CPU ceiling.
    if (needsRehash(user.password_hash)) {
      ctx.waitUntil((async () => {
        try {
          const upgraded = await hashPassword(password);
          await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
            .bind(upgraded, user.id).run();
        } catch { /* non-critical — next successful login will retry */ }
      })());
    }

    const profile = await env.DB.prepare(
      'SELECT first_name, last_name FROM profiles WHERE id = ?'
    ).bind(user.id).first<any>();

    const roleData = await env.DB.prepare(
      'SELECT role FROM user_roles WHERE user_id = ?'
    ).bind(user.id).first<any>();

    const sessionToken = await createSession(user.id, env);

    return new Response(JSON.stringify({
      user: { id: user.id, email: user.email, ...profile, role: roleData?.role || 'user' },
      session: sessionToken
    }), { headers: corsHeaders });
  }

// POST /auth/me (Check session)
  if (path === '/auth/me' && method === 'GET') {
    const token = request.headers.get('Authorization')?.split(' ').pop();
    if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const userId = await env.SESSIONS.get(token);
    if (!userId) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: corsHeaders });

    const user = await env.DB.prepare(
      'SELECT id, email, created_at FROM users WHERE id = ?'
    ).bind(userId).first<any>();

    const profile = await env.DB.prepare(
      'SELECT first_name, last_name FROM profiles WHERE id = ?'
    ).bind(userId).first<any>();

    const roleData = await env.DB.prepare(
      'SELECT role FROM user_roles WHERE user_id = ?'
    ).bind(userId).first<any>();

    return new Response(JSON.stringify({
      user: { ...user, ...profile, role: roleData?.role || 'user' }
    }), { headers: corsHeaders });
  }

  // GET /auth/verify
  if (path === '/auth/verify' && method === 'GET') {
    const token = request.headers.get('Authorization')?.split(' ').pop();
    if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const userId = await env.SESSIONS.get(token);
    if (!userId) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: corsHeaders });

    const user = await env.DB.prepare(
      'SELECT id, email FROM users WHERE id = ?'
    ).bind(userId).first<any>();

    const profile = await env.DB.prepare(
      'SELECT first_name, last_name FROM profiles WHERE id = ?'
    ).bind(userId).first<any>();

    const roleData = await env.DB.prepare(
      'SELECT role FROM user_roles WHERE user_id = ?'
    ).bind(userId).first<any>();

    return new Response(JSON.stringify({
      user: { id: user.id, email: user.email, ...profile, role: roleData?.role || 'user' }
    }), { headers: corsHeaders });
  }

  // POST /auth/request-reset
  if (path === '/auth/request-reset' && method === 'POST') {
    const { email } = await request.json() as any;
    // Always return success to prevent email enumeration
    const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<any>();
    if (user) {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await env.DB.prepare(
        'INSERT INTO password_reset_tokens (token, user_id, expires_at, used) VALUES (?, ?, ?, 0)'
      ).bind(token, user.id, expiresAt).run();

      const resetUrl = `https://thehealios.com/reset-password?token=${token}`;
      if (env.RESEND_API_KEY) {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'Healios <noreply@thehealios.com>',
            to: [email],
            subject: 'Reset your Healios password',
            html: `<p>Hi,</p>
                   <p>Click the link below to reset your password. This link expires in 1 hour.</p>
                   <p><a href="${resetUrl}">${resetUrl}</a></p>
                   <p>If you didn't request this, you can ignore this email.</p>
                   <p>The Healios Team</p>`,
          }),
        });
        if (!emailRes.ok) {
          console.error('Resend error:', await emailRes.text());
        }
      }
    }
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  }

  // POST /auth/reset-password
  if (path === '/auth/reset-password' && method === 'POST') {
    const { token, password } = await request.json() as any;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Invalid or expired reset link' }), { status: 400, headers: corsHeaders });
    }
    const strength = checkPasswordStrength(password);
    if (!strength.ok) {
      return new Response(JSON.stringify({ error: strength.reason }), { status: 400, headers: corsHeaders });
    }

    const row = await env.DB.prepare(
      'SELECT user_id, expires_at, used FROM password_reset_tokens WHERE token = ?'
    ).bind(token).first<any>();

    if (!row || row.used || new Date(row.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Invalid or expired reset link' }), { status: 400, headers: corsHeaders });
    }

    const hash = await hashPassword(password);
    await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(hash, row.user_id).run();
    await env.DB.prepare('UPDATE password_reset_tokens SET used = 1 WHERE token = ?').bind(token).run();

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  }

  // POST /auth/update-user — change password or email for authenticated user
  if (path === '/auth/update-user' && method === 'POST') {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    const userId = await env.SESSIONS.get(token);
    if (!userId) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: corsHeaders });

    const body = await request.json() as any;

    if (body.password) {
      const strength = checkPasswordStrength(body.password);
      if (!strength.ok) {
        return new Response(JSON.stringify({ error: strength.reason }), { status: 400, headers: corsHeaders });
      }
      const hash = await hashPassword(body.password);
      await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(hash, userId).run();
    }

    if (body.email) {
      const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ? AND id != ?').bind(body.email, userId).first();
      if (existing) {
        return new Response(JSON.stringify({ error: 'Email already in use' }), { status: 409, headers: corsHeaders });
      }
      await env.DB.prepare('UPDATE users SET email = ? WHERE id = ?').bind(body.email.toLowerCase().trim(), userId).run();
    }

    const user = await env.DB.prepare('SELECT id, email FROM users WHERE id = ?').bind(userId).first<any>();
    return new Response(JSON.stringify({ user }), { headers: corsHeaders });
  }

  return new Response('Auth endpoint not found', { status: 404, headers: corsHeaders });
}

async function createSession(userId: string, env: Env): Promise<string> {
  const token = crypto.randomUUID();
  // Expire in 7 days
  await env.SESSIONS.put(token, userId, { expirationTtl: 60 * 60 * 24 * 7 });
  return token;
}
