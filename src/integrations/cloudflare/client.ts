/**
 * Cloudflare D1 / Worker Client Wrapper
 * This file mimics the Supabase client interface to minimize frontend refactoring.
 */

const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'http://localhost:8787';

interface CloudflareClient {
  from: (table: string) => {
    select: (columns: string, options?: any) => any;
    insert: (data: any) => any;
    update: (data: any) => any;
    delete: () => any;
  };
  auth: {
    getSession: () => Promise<{ data: { session: any }; error: any }>;
    signInWithPassword: (credentials: any) => Promise<{ data: any; error: any }>;
    signUp: (credentials: any) => Promise<{ data: any; error: any }>;
    signOut: () => Promise<void>;
    onAuthStateChange: (callback: any) => { data: { subscription: any } };
  };
}

export const cloudflare = {
  from(table: string) {
    return {
      select(columns = '*', options: any = {}) {
        const queryParams = new URLSearchParams();
        if (options.limit) queryParams.append('limit', options.limit);
        
        const fetchData = async (extraParams: URLSearchParams = new URLSearchParams()) => {
          try {
            const finalParams = new URLSearchParams(queryParams);
            extraParams.forEach((v, k) => finalParams.append(k, v));
            const response = await fetch(`${API_URL}/${table}?${finalParams.toString()}`);
            const data = await response.json();
            return { data, error: response.ok ? null : { message: data.error || 'Fetch error' } };
          } catch (err: any) {
            return { data: null, error: { message: err.message } };
          }
        };

        const createPromise = (params = new URLSearchParams()) => {
          const promise = fetchData(params) as any;
          promise.order = (col: string, opt: any) => { 
            params.append('order', col); 
            if (opt?.ascending === false) params.append('dir', 'desc');
            return createPromise(params); 
          };
          promise.limit = (l: number) => { 
            params.append('limit', l.toString()); 
            return createPromise(params); 
          };
          promise.eq = (col: string, val: any) => { 
            params.append(col, val); 
            return createPromise(params); 
          };
          promise.or = (filter: string) => { 
            params.append('or', filter); 
            return createPromise(params); 
          };
          promise.ilike = (col: string, val: string) => { 
            params.append('search', val.replace(/%/g, '')); 
            return createPromise(params); 
          };
          promise.in = (col: string, vals: any[]) => { 
            params.append('in', vals.join(',')); 
            return createPromise(params); 
          };
          promise.single = async () => {
            const res = await fetchData(params);
            return { ...res, data: Array.isArray(res.data) ? res.data[0] : res.data };
          };
          promise.maybeSingle = async () => {
            const res = await fetchData(params);
            return { ...res, data: Array.isArray(res.data) ? (res.data.length > 0 ? res.data[0] : null) : res.data };
          };
          promise.range = (from: number, to: number) => {
            params.append('offset', from.toString());
            params.append('limit', (to - from + 1).toString());
            return createPromise(params);
          };
          return promise;
        };

        return createPromise();
      },
      
      async insert(data: any) {
        try {
          const response = await fetch(`${API_URL}/${table}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const result = await response.json();
          const finalResult = { data: result, error: response.ok ? null : result };
          
          return {
            ...finalResult,
            select: () => ({
              ...finalResult,
              single: () => ({ ...finalResult, data: Array.isArray(result) ? result[0] : result })
            })
          };
        } catch (err: any) {
          return { data: null, error: { message: err.message } };
        }
      },

      async update(data: any) {
        const queryMethods = {
          eq: (col: string, val: any) => ({
            async select() {
              const response = await fetch(`${API_URL}/${table}/${val}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              });
              const result = await response.json();
              return { data: result, error: response.ok ? null : result, single: () => ({ data: result, error: null }) };
            }
          })
        };
        return queryMethods;
      },

      async upsert(data: any) {
        return { data: null, error: null };
      },

      async delete() {
        return { data: null, error: null };
      },

      eq(column: string, value: any) {
        const queryMethods = {
          order: (col: string, opt: any) => queryMethods,
          limit: (l: number) => queryMethods,
          async select(columns = '*') {
            const response = await fetch(`${API_URL}/${table}/${value}`);
            const data = await response.json();
            const result = { data, error: response.ok ? null : { message: 'Fetch error' } };
            return {
              ...result,
              single: () => result,
              maybeSingle: () => result
            };
          },
          async update(data: any) {
            const response = await fetch(`${API_URL}/${table}/${value}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });
            const result = await response.json();
            return { data: result, error: response.ok ? null : result, select: () => ({ single: () => ({ data: result }) }) };
          },
          async delete() {
            const response = await fetch(`${API_URL}/${table}/${value}`, {
              method: 'DELETE',
            });
            const result = await response.json();
            return { data: result, error: response.ok ? null : result };
          }
        };
        return queryMethods;
      },
      
      async maybeSingle() {
        return { data: null, error: null };
      },
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

    async resetPasswordForEmail(email: string, options?: any) {
      // Placeholder for worker endpoint
      console.log('Reset password for:', email, options);
      return { data: {}, error: null };
    },

    async updateUser(data: any) {
      // Placeholder for worker endpoint
      console.log('Update user:', data);
      return { data: { user: {} }, error: null };
    },

    onAuthStateChange(callback: any) {
      // Basic event emitter for auth changes
      // Immediately call with current session if available
      this.getSession().then(({ data: { session } }) => {
        callback('INITIAL_SESSION', session);
      });

      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  }
} as any;
