import { Env } from './index';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Public R2 URL. If ASSETS_PUBLIC_URL env var is set, use that; otherwise the
// R2 bucket's default pub-<hash>.r2.dev subdomain.
function publicUrlFor(env: Env, key: string): string {
  const base = (env as any).ASSETS_PUBLIC_URL || 'https://healios-assets.thehealios.com';
  return `${base.replace(/\/$/, '')}/${key}`;
}

export async function handleUpload(request: Request, env: Env): Promise<Response> {
  const jsonCors = { ...cors, 'Content-Type': 'application/json' };

  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonCors });
  }

  // Admin auth
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: jsonCors });
  const userId = await env.SESSIONS.get(token);
  if (!userId) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: jsonCors });
  const role = await env.DB.prepare('SELECT role FROM user_roles WHERE user_id = ?').bind(userId).first<{ role: string }>();
  if (role?.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: jsonCors });

  if (!env.BUCKET) {
    return new Response(JSON.stringify({ error: 'R2 bucket not configured' }), { status: 500, headers: jsonCors });
  }

  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    const prefix = (form.get('prefix') as string | null) || 'uploads';
    if (!file || typeof file === 'string') {
      return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400, headers: jsonCors });
    }
    if (!file.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Only image files are allowed' }), { status: 400, headers: jsonCors });
    }
    if (file.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Image must be less than 5MB' }), { status: 400, headers: jsonCors });
    }

    const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = `${prefix}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    await env.BUCKET.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });

    return new Response(JSON.stringify({ url: publicUrlFor(env, key), key }), { headers: jsonCors });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: jsonCors });
  }
}
