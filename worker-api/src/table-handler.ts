import { Env } from './index';

function serializeForD1(val: any): any {
  if (val !== null && typeof val === 'object') return JSON.stringify(val);
  return val;
}

function tryParseJson(val: any): any {
  if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
    try { return JSON.parse(val); } catch { /* not JSON */ }
  }
  return val;
}

const USER_TABLES = new Set([
  'profiles', 'addresses', 'orders', 'order_items',
  'wishlist', 'loyalty_points', 'loyalty_transactions', 'subscriptions'
]);
const ADMIN_TABLES = new Set(['newsletter_subscriptions', 'discount_codes', 'users']);

export async function handleTable(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const tableName = url.pathname.split('/').filter(Boolean)[0];
  const method = request.method;
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  // Auth check
  let userId: string | null = null;
  if (USER_TABLES.has(tableName) || ADMIN_TABLES.has(tableName)) {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
    }
    userId = await env.SESSIONS.get(token);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: cors });
    }
    if (ADMIN_TABLES.has(tableName)) {
      const roleRow = await env.DB.prepare(
        'SELECT role FROM user_roles WHERE user_id = ?'
      ).bind(userId).first<{ role: string }>();
      if (roleRow?.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      }
    }
  }

  const OP_MAP: Record<string, string> = {
    eq: '=', neq: '!=', gt: '>', gte: '>=', lt: '<', lte: '<='
  };

  if (method === 'GET') {
    const filters: { col: string; op: string; val: string }[] = [];
    let orderCol = '';
    let orderDir = 'ASC';
    let limitN = 200;
    let offsetN = 0;

    for (const [key, value] of url.searchParams.entries()) {
      if (key === 'order') {
        const parts = value.split('.');
        orderCol = parts[0];
        orderDir = parts[1] === 'desc' ? 'DESC' : 'ASC';
      } else if (key === 'limit') {
        limitN = parseInt(value, 10);
      } else if (key === 'offset') {
        offsetN = parseInt(value, 10);
      } else if (key !== 'select') {
        const dot = value.indexOf('.');
        if (dot !== -1) {
          filters.push({ col: key, op: value.slice(0, dot), val: value.slice(dot + 1) });
        }
      }
    }

    const bindings: string[] = [];
    let sql = `SELECT * FROM ${tableName}`;

    if (filters.length) {
      const conds = filters.map(({ col, op, val }) => {
        if (op === 'ilike') {
          bindings.push(`%${val.replace(/^%|%$/g, '')}%`);
          return `${col} LIKE ?`;
        }
        bindings.push(val);
        return `${col} ${OP_MAP[op] ?? '='} ?`;
      });
      sql += ` WHERE ${conds.join(' AND ')}`;
    }

    if (orderCol) sql += ` ORDER BY ${orderCol} ${orderDir}`;
    sql += ` LIMIT ${limitN} OFFSET ${offsetN}`;

    try {
      const { results } = await env.DB.prepare(sql).bind(...bindings).all();
      const parsed = (results ?? []).map((row: any) => {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(row)) out[k] = tryParseJson(v);
        return out;
      });
      return new Response(JSON.stringify(parsed), { headers: cors });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
    }
  }

  if (method === 'POST') {
    try {
      const body = await request.json() as Record<string, any>;
      if (!body.id) body.id = crypto.randomUUID();
      if (USER_TABLES.has(tableName) && userId && !body.user_id) body.user_id = userId;
      const cols = Object.keys(body);
      const sql = `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
      await env.DB.prepare(sql).bind(...Object.values(body).map(serializeForD1)).run();
      return new Response(JSON.stringify(body), { status: 201, headers: cors });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
    }
  }

  if (method === 'PUT') {
    try {
      const body = await request.json() as Record<string, any>;
      const filters: { col: string; val: string }[] = [];
      for (const [k, v] of url.searchParams.entries()) {
        if (v.startsWith('eq.')) filters.push({ col: k, val: v.slice(3) });
      }
      if (!filters.length) {
        return new Response(JSON.stringify({ error: 'No filter for update' }), { status: 400, headers: cors });
      }
      const setClause = Object.keys(body).map(k => `${k} = ?`).join(', ');
      const whereClause = filters.map(f => `${f.col} = ?`).join(' AND ');
      const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
      await env.DB.prepare(sql).bind(...Object.values(body).map(serializeForD1), ...filters.map(f => f.val)).run();
      return new Response(JSON.stringify({ success: true }), { headers: cors });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
    }
  }

  if (method === 'DELETE') {
    try {
      const filters: { col: string; val: string }[] = [];
      for (const [k, v] of url.searchParams.entries()) {
        if (v.startsWith('eq.')) filters.push({ col: k, val: v.slice(3) });
      }
      if (!filters.length) {
        return new Response(JSON.stringify({ error: 'No filter for delete' }), { status: 400, headers: cors });
      }
      const whereClause = filters.map(f => `${f.col} = ?`).join(' AND ');
      const sql = `DELETE FROM ${tableName} WHERE ${whereClause}`;
      await env.DB.prepare(sql).bind(...filters.map(f => f.val)).run();
      return new Response(JSON.stringify({ success: true }), { headers: cors });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: cors });
}
