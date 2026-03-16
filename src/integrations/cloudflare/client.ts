/**
 * Cloudflare D1 / Worker Client Wrapper
 * This file mimics the Supabase client interface to minimize frontend refactoring.
 */

const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'http://localhost:8787';

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

  select(columns: string = '*') {
    this.query.select = columns;
    return this;
  }

  eq(column: string, value: any) {
    this.query.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: any) {
    this.query.filters.push({ column, operator: 'neq', value });
    return this;
  }

  gt(column: string, value: any) {
    this.query.filters.push({ column, operator: 'gt', value });
    return this;
  }

  gte(column: string, value: any) {
    this.query.filters.push({ column, operator: 'gte', value });
    return this;
  }

  lt(column: string, value: any) {
    this.query.filters.push({ column, operator: 'lt', value });
    return this;
  }

  lte(column: string, value: any) {
    this.query.filters.push({ column, operator: 'lte', value });
    return this;
  }

  ilike(column: string, pattern: string) {
    this.query.filters.push({ column, operator: 'ilike', value: pattern });
    return this;
  }

  in(column: string, values: any[]) {
    this.query.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  or(filters: string) {
    this.query.orFilters.push(filters);
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.query.order.push({ column, ascending });
    return this;
  }

  limit(count: number) {
    this.query.limit = count;
    return this;
  }

  range(from: number, to: number) {
    this.query.range = { from, to };
    return this;
  }

  single() {
    this.query.single = true;
    return this;
  }

  maybeSingle() {
    this.query.maybeSingle = true;
    return this;
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const url = new URL(`${API_URL}/${this.table}`);
      
      // Add filters as query params
      this.query.filters.forEach(f => {
        url.searchParams.append(f.column, `${f.operator}.${f.value}`);
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

      const response = await fetch(url.toString());
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

export const cloudflare = {
  from(table: string) {
    const builder = new QueryBuilder(table);
    return {
      select: (columns?: string) => builder.select(columns),
      insert: async (data: any) => {
        const response = await fetch(`${API_URL}/${table}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        return { data: result, error: response.ok ? null : result };
      },
      update: async (data: any) => {
        // Simple update implementation
        const response = await fetch(`${API_URL}/${table}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        return { data: result, error: response.ok ? null : result };
      },
      delete: async () => {
        const response = await fetch(`${API_URL}/${table}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        return { data: result, error: response.ok ? null : result };
      },
      eq: (column: string, value: any) => builder.eq(column, value),
      in: (column: string, values: any[]) => builder.in(column, values),
      // Delegate other methods to builder if needed
    };
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

    onAuthStateChange(callback: any) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  }
} as any;
