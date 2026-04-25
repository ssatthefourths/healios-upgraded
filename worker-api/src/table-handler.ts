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
  'wishlist', 'loyalty_points', 'loyalty_transactions', 'subscriptions',
  'stock_notifications',
]);
const ADMIN_TABLES = new Set(['discount_codes', 'users']);

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

  // Identifier guard — SQLite identifiers are alphanumeric + underscore.
  // D1's prepare() parameterises values but NOT column/table names, so any
  // identifier interpolated into SQL must pass this check. Rejects injection
  // attempts like `user_id; DROP TABLE` or `name OR 1=1`.
  const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
  const isIdent = (s: string) => IDENT_RE.test(s);
  if (!isIdent(tableName)) {
    return new Response(JSON.stringify({ error: 'Invalid table name' }), { status: 400, headers: cors });
  }

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
      // Reject any filter that references an invalid column name
      for (const f of filters) {
        if (!isIdent(f.col)) {
          return new Response(JSON.stringify({ error: `Invalid column: ${f.col}` }), { status: 400, headers: cors });
        }
      }
      const conds = filters.map(({ col, op, val }) => {
        // Negated operators: "not" op with value "<innerOp>.<innerVal>"
        // e.g. .not(col, 'is', null) → key=col, value='not.is.null' → op='not', val='is.null'
        if (op === 'not') {
          const innerDot = val.indexOf('.');
          const innerOp = innerDot === -1 ? val : val.slice(0, innerDot);
          const innerVal = innerDot === -1 ? '' : val.slice(innerDot + 1);
          if (innerOp === 'is' && innerVal === 'null') {
            return `${col} IS NOT NULL`;
          }
          if (innerOp === 'in') {
            const vals = innerVal.split(',').map(v => v.trim()).filter(Boolean);
            if (vals.length === 0) return '1=1';
            vals.forEach(v => bindings.push(v));
            return `${col} NOT IN (${vals.map(() => '?').join(',')})`;
          }
          if (innerOp in OP_MAP) {
            bindings.push(innerVal);
            const negated: Record<string, string> = {
              eq: '!=', neq: '=', gt: '<=', gte: '<', lt: '>=', lte: '>',
            };
            return `${col} ${negated[innerOp] ?? '!='} ?`;
          }
          // Unknown negation — fall through to a safe no-op
          return '1=1';
        }
        if (op === 'ilike') {
          bindings.push(`%${val.replace(/^%|%$/g, '')}%`);
          return `${col} LIKE ?`;
        }
        if (op === 'in') {
          const vals = val.split(',').map(v => v.trim()).filter(Boolean);
          if (vals.length === 0) return '1=0';
          vals.forEach(v => bindings.push(v));
          return `${col} IN (${vals.map(() => '?').join(',')})`;
        }
        bindings.push(val);
        return `${col} ${OP_MAP[op] ?? '='} ?`;
      });
      sql += ` WHERE ${conds.join(' AND ')}`;
    }

    if (orderCol) {
      if (!isIdent(orderCol)) {
        return new Response(JSON.stringify({ error: 'Invalid order column' }), { status: 400, headers: cors });
      }
      sql += ` ORDER BY ${orderCol} ${orderDir}`;
    }
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
      for (const c of cols) {
        if (!isIdent(c)) {
          return new Response(JSON.stringify({ error: `Invalid column: ${c}` }), { status: 400, headers: cors });
        }
      }
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
      const bodyCols = Object.keys(body);
      for (const c of bodyCols) {
        if (!isIdent(c)) {
          return new Response(JSON.stringify({ error: `Invalid column: ${c}` }), { status: 400, headers: cors });
        }
      }
      for (const f of filters) {
        if (!isIdent(f.col)) {
          return new Response(JSON.stringify({ error: `Invalid filter column: ${f.col}` }), { status: 400, headers: cors });
        }
      }
      const setClause = bodyCols.map(k => `${k} = ?`).join(', ');
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
      for (const f of filters) {
        if (!isIdent(f.col)) {
          return new Response(JSON.stringify({ error: `Invalid filter column: ${f.col}` }), { status: 400, headers: cors });
        }
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
