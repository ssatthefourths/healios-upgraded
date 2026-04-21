/**
 * Cloudflare D1 / Worker Client Wrapper
 * Uses a thenable QueryBuilder so all chained calls (.eq, .order, .limit, etc.)
 * work correctly — single fetch fires on await, not on each chained call.
 */

const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';

class QueryBuilder {
  private table: string;
  private query: {
    select: string;
    filters: { column: string; operator: string; value: any }[];
    orFilters: string[];
    order: { column: string; ascending: boolean }[];
    limit?: number;
    range?: { from: number; to: number };
    single?: boolean;
    maybeSingle?: boolean;
  };

  constructor(table: string) {
    this.table = table;
    this.query = {
      select: '*',
      filters: [],
      orFilters: [],
      order: [],
    };
  }

  select(columns: string = '*') { this.query.select = columns; return this; }
  eq(column: string, value: any) { this.query.filters.push({ column, operator: 'eq', value }); return this; }
  neq(column: string, value: any) { this.query.filters.push({ column, operator: 'neq', value }); return this; }
  gt(column: string, value: any) { this.query.filters.push({ column, operator: 'gt', value }); return this; }
  gte(column: string, value: any) { this.query.filters.push({ column, operator: 'gte', value }); return this; }
  lt(column: string, value: any) { this.query.filters.push({ column, operator: 'lt', value }); return this; }
  lte(column: string, value: any) { this.query.filters.push({ column, operator: 'lte', value }); return this; }
  ilike(column: string, pattern: string) { this.query.filters.push({ column, operator: 'ilike', value: pattern }); return this; }
  in(column: string, values: any[]) { this.query.filters.push({ column, operator: 'in', value: values }); return this; }
  or(filters: string) { this.query.orFilters.push(filters); return this; }
  order(column: string, { ascending = true } = {}) { this.query.order.push({ column, ascending }); return this; }
  limit(count: number) { this.query.limit = count; return this; }
  range(from: number, to: number) { this.query.range = { from, to }; return this; }
  single() { this.query.single = true; return this; }
  maybeSingle() { this.query.maybeSingle = true; return this; }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const url = new URL(`${API_URL}/${this.table}`);

      this.query.filters.forEach(f => {
        const val = Array.isArray(f.value) ? f.value.join(',') : f.value;
        url.searchParams.append(f.column, `${f.operator}.${val}`);
      });

      if (this.query.orFilters.length > 0) {
        url.searchParams.append('or', this.query.orFilters.join(','));
      }

      if (this.query.limit) {
        url.searchParams.append('limit', this.query.limit.toString());
      }

      if (this.query.order.length > 0) {
        url.searchParams.append('order', this.query.order.map(o => `${o.column}.${o.ascending ? 'asc' : 'desc'}`).join(','));
      }

      if (this.query.range) {
        url.searchParams.append('offset', this.query.range.from.toString());
      }

      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('cf_session') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(url.toString(), { headers });
      let data = await response.json();

      if (this.query.single || this.query.maybeSingle) {
        data = Array.isArray(data) ? data[0] : data;
        if (this.query.single && !data) {
          throw new Error('No rows found for .single()');
        }
      }

      const result = { data, error: response.ok ? null : { message: 'Fetch error' }, count: null };
      return onfulfilled ? onfulfilled(result) : result;
    } catch (err) {
      const result = { data: null, error: err, count: 0 };
      return onrejected ? onrejected(result) : result;
    }
  }
}

class MutationBuilder {
  private table: string;
  private method: 'PUT' | 'DELETE';
  private data?: any;
  private filters: [string, string][] = [];

  constructor(table: string, method: 'PUT' | 'DELETE', data?: any) {
    this.table = table;
    this.method = method;
    this.data = data;
  }

  eq(col: string, val: any) { this.filters.push([col, String(val)]); return this; }

  async then(resolve?: (v: any) => any, reject?: (e: any) => any) {
    const url = new URL(`${API_URL}/${this.table}`);
    this.filters.forEach(([k, v]) => url.searchParams.append(k, `eq.${v}`));
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('cf_session') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (this.data) headers['Content-Type'] = 'application/json';
    try {
      const res = await fetch(url.toString(), {
        method: this.method,
        headers,
        body: this.data ? JSON.stringify(this.data) : undefined,
      });
      const result = await res.json();
      const out = { data: result, error: res.ok ? null : result };
      return resolve ? resolve(out) : out;
    } catch (err) {
      const out = { data: null, error: err };
      return reject ? reject(out) : out;
    }
  }
}

export const cloudflare = {
  from(table: string) {
    const builder = new QueryBuilder(table);
    return {
      select: (columns?: string, _options?: any) => builder.select(columns),
      insert: async (data: any) => {
        const token = localStorage.getItem('cf_session');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(`${API_URL}/${table}`, {
          method: 'POST', headers, body: JSON.stringify(data),
        });
        const result = await response.json();
        return { data: result, error: response.ok ? null : result };
      },
      update: (data: any) => new MutationBuilder(table, 'PUT', data),
      delete: () => new MutationBuilder(table, 'DELETE'),
      eq: (column: string, value: any) => builder.eq(column, value),
      in: (column: string, values: any[]) => builder.in(column, values),
    };
  },

  // rpc() stub — returns an error so callers fall back to regular queries
  rpc(fn: string, _params?: any) {
    const errResult = { data: null, error: { message: `rpc '${fn}' not implemented` }, count: null };
    const stub: any = Promise.resolve(errResult);
    stub.limit = () => stub;
    stub.order = () => stub;
    stub.eq = () => stub;
    return stub;
  },

  auth: {
    async getSession() {
      const token = localStorage.getItem('cf_session');
      if (!token) return { data: { session: null }, error: null };

      try {
        const response = await fetch(`${API_URL}/auth/verify`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          return { data: { session: { user: data.user, access_token: token } }, error: null };
        }
        localStorage.removeItem('cf_session');
        return { data: { session: null }, error: null };
      } catch (err) {
        return { data: { session: null }, error: err };
      }
    },

    async signInWithPassword({ email, password }: any) {
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('cf_session', data.session);
        return { data, error: null };
      }
      return { data: null, error: { message: data.error || 'Invalid email or password' } };
    },

    async signUp({ email, password, options }: any) {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName: options?.data?.first_name,
          lastName: options?.data?.last_name
        }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('cf_session', data.session);
        return { data, error: null };
      }
      return { data: null, error: { message: data.error || 'Signup failed' } };
    },

    async signOut() {
      localStorage.removeItem('cf_session');
    },

    async resetPasswordForEmail(email: string, _options?: any) {
      try {
        const response = await fetch(`${API_URL}/auth/request-reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        return response.ok ? { data: {}, error: null } : { data: null, error: { message: 'Failed to send reset email' } };
      } catch {
        return { data: null, error: { message: 'Network error' } };
      }
    },

    async updateUser(data: any) {
      const token = localStorage.getItem('cf_session');
      if (!token) return { data: null, error: { message: 'Not authenticated' } };
      try {
        const response = await fetch(`${API_URL}/auth/update-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        return response.ok
          ? { data: { user: result.user || {} }, error: null }
          : { data: null, error: { message: result.error || 'Update failed' } };
      } catch {
        return { data: null, error: { message: 'Network error' } };
      }
    },

    onAuthStateChange(callback: any) {
      this.getSession().then(({ data: { session } }: any) => {
        callback('INITIAL_SESSION', session);
      });
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },

  // Route Supabase edge function calls to Cloudflare Worker endpoints
  functions: {
    async invoke(name: string, options?: { body?: any }) {
      // Map function names to worker routes
      const routeMap: Record<string, string> = {
        'create-checkout-session': '/checkout-session',
        'validate-discount': '/validate-discount',
        'admin-user-management': '/admin/user-management',
      };

      const route = routeMap[name];
      if (!route) {
        console.warn(`functions.invoke: '${name}' not implemented in worker`);
        return { data: null, error: { message: `Function '${name}' not available` } };
      }

      try {
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('cf_session') : null;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}${route}`, {
          method: 'POST',
          headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
        });

        const data = await response.json();
        return response.ok ? { data, error: null } : { data: null, error: data };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    }
  }
} as any;
