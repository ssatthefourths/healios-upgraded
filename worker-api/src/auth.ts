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

    const sessionToken = await createSession(user.id, env);

    return new Response(JSON.stringify({ 
      user: { id: user.id, email: user.email, ...profile }, 
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

    return new Response(JSON.stringify({ 
      user: { id: user.id, email: user.email, ...profile } 
    }), { headers: corsHeaders });
  }

  return new Response('Auth endpoint not found', { status: 404, headers: corsHeaders });
}

// Helper functions (simplified for Worker environment)
async function hashPassword(password: string): Promise<string> {
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
