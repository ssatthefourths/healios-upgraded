import { Env } from './index';

export async function handleAuth(request: Request, env: Env): Promise<Response> {
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
    
    // Simple password hashing (in production, use something better or a library)
    // For D1 Free tier, we'll use a simple implementation for now
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
      return new Response(JSON.stringify({ error: 'User already exists or database error' }), { status: 400, headers: corsHeaders });
    }
  }

  // POST /auth/signin
  if (path === '/auth/signin' && method === 'POST') {
    const { email, password } = await request.json() as any;
    
    const user = await env.DB.prepare(
      'SELECT id, email, password_hash FROM users WHERE email = ?'
    ).bind(email).first<any>();

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: corsHeaders });
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
      'SELECT id, email FROM users WHERE id = ?'
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
      if ((env as any).RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${(env as any).RESEND_API_KEY}` },
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
      }
    }
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  }

  // POST /auth/reset-password
  if (path === '/auth/reset-password' && method === 'POST') {
    const { token, password } = await request.json() as any;
    if (!token || !password || password.length < 8) {
      return new Response(JSON.stringify({ error: 'Token and password (min 8 chars) required' }), { status: 400, headers: corsHeaders });
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

  return new Response('Auth endpoint not found', { status: 404, headers: corsHeaders });
}

// Helper functions (simplified for Worker environment)
export async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return (await hashPassword(password)) === hash;
}

async function createSession(userId: string, env: Env): Promise<string> {
  const token = crypto.randomUUID();
  // Expire in 7 days
  await env.SESSIONS.put(token, userId, { expirationTtl: 60 * 60 * 24 * 7 });
  return token;
}
