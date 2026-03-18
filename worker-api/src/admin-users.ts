import { Env } from './index';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

async function getAdminUserId(request: Request, env: Env): Promise<string | null> {
  try {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return null;
    const userId = await env.SESSIONS.get(token);
    if (!userId) return null;
    const row = await env.DB.prepare('SELECT role FROM user_roles WHERE user_id = ?').bind(userId).first<{ role: string }>();
    return row?.role === 'admin' ? userId : null;
  } catch {
    return null;
  }
}

async function logAudit(env: Env, adminId: string, action: string, targetUserId?: string, targetEmail?: string, metadata?: any) {
  try {
    await env.DB.prepare(
      'INSERT INTO admin_audit_log (admin_user_id, action, target_user_id, target_email, metadata) VALUES (?, ?, ?, ?, ?)'
    ).bind(adminId, action, targetUserId ?? null, targetEmail ?? null, metadata ? JSON.stringify(metadata) : null).run();
  } catch { /* non-critical */ }
}

export async function handleAdminUsers(request: Request, env: Env): Promise<Response> {
  const adminId = await getAdminUserId(request, env);
  if (!adminId) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: cors });
  }

  const { action, target_user_id, target_email, make_admin } = body;

  if (action === 'list_users' || action === 'list_admins') {
    const roleFilter = action === 'list_admins' ? "WHERE ur.role = 'admin'" : '';
    const rows = await env.DB.prepare(`
      SELECT u.id, u.email, p.first_name, p.last_name, u.created_at,
             COALESCE(ur.role, 'user') as role
      FROM users u
      LEFT JOIN profiles p ON p.id = u.id
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      ${roleFilter}
      ORDER BY u.created_at DESC
    `).all<any>();

    const mapped = (rows.results || []).map((r: any) => ({
      id: r.id,
      email: r.email,
      first_name: r.first_name,
      last_name: r.last_name,
      roles: r.role && r.role !== 'user' ? [r.role] : [],
      created_at: r.created_at,
      last_sign_in_at: null,
      email_confirmed_at: r.created_at,
    }));

    const key = action === 'list_admins' ? 'admins' : 'users';
    return new Response(JSON.stringify({ [key]: mapped }), { headers: cors });
  }

  if (action === 'add_admin') {
    if (!target_user_id) return new Response(JSON.stringify({ error: 'target_user_id required' }), { status: 400, headers: cors });
    await env.DB.prepare('INSERT OR REPLACE INTO user_roles (user_id, role) VALUES (?, ?)').bind(target_user_id, 'admin').run();
    await logAudit(env, adminId, 'add_admin', target_user_id);
    return new Response(JSON.stringify({ success: true }), { headers: cors });
  }

  if (action === 'remove_admin') {
    if (!target_user_id) return new Response(JSON.stringify({ error: 'target_user_id required' }), { status: 400, headers: cors });
    await env.DB.prepare("DELETE FROM user_roles WHERE user_id = ? AND role = 'admin'").bind(target_user_id).run();
    await logAudit(env, adminId, 'remove_admin', target_user_id);
    return new Response(JSON.stringify({ success: true }), { headers: cors });
  }

  if (action === 'send_password_reset') {
    if (!target_email) return new Response(JSON.stringify({ error: 'target_email required' }), { status: 400, headers: cors });
    await logAudit(env, adminId, 'send_password_reset', undefined, target_email);
    return new Response(JSON.stringify({ success: true }), { headers: cors });
  }

  if (action === 'delete_user') {
    if (!target_user_id) return new Response(JSON.stringify({ error: 'target_user_id required' }), { status: 400, headers: cors });
    const user = await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(target_user_id).first<any>();
    await env.DB.prepare('DELETE FROM user_roles WHERE user_id = ?').bind(target_user_id).run();
    await env.DB.prepare('DELETE FROM profiles WHERE id = ?').bind(target_user_id).run();
    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(target_user_id).run();
    await logAudit(env, adminId, 'delete_user', target_user_id, user?.email);
    return new Response(JSON.stringify({ success: true }), { headers: cors });
  }

  if (action === 'invite_user') {
    if (!target_email) return new Response(JSON.stringify({ error: 'target_email required' }), { status: 400, headers: cors });
    const id = crypto.randomUUID();
    const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(crypto.randomUUID()));
    const tempPassword = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    try {
      await env.DB.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').bind(id, target_email, tempPassword).run();
      await env.DB.prepare('INSERT INTO profiles (id, first_name, last_name) VALUES (?, ?, ?)').bind(id, null, null).run();
      if (make_admin) {
        await env.DB.prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?)').bind(id, 'admin').run();
      }
    } catch {
      return new Response(JSON.stringify({ error: 'User already exists' }), { status: 400, headers: cors });
    }
    await logAudit(env, adminId, 'invite_user', id, target_email, { make_admin: !!make_admin });
    return new Response(JSON.stringify({ success: true }), { headers: cors });
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: cors });
}
