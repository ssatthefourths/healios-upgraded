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
      async select(columns = '*', options: any = {}) {
        // Simple mapping to Worker GET endpoints
        const queryParams = new URLSearchParams();
        if (options.limit) queryParams.append('limit', options.limit);
        
        const response = await fetch(`${API_URL}/${table}?${queryParams.toString()}`);
        const data = await response.json();
        return { data, error: response.ok ? null : { message: 'Fetch error' } };
      },
      
      async insert(data: any) {
        const response = await fetch(`${API_URL}/${table}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        return { data: result, error: response.ok ? null : result };
      },

      async update(data: any) {
        // This assumes data has an ID or we are in a 'match' context
        // Simplified for this wrapper
        return { data: null, error: null };
      },

      async upsert(data: any) {
        // Placeholder
        return { data: null, error: null };
      },

      async delete() {
        // Placeholder
        return { data: null, error: null };
      },

      eq(column: string, value: any) {
        return {
          async update(data: any) {
            const response = await fetch(`${API_URL}/${table}/${value}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });
            const result = await response.json();
            return { data: result, error: response.ok ? null : result };
          },
          async delete() {
            const response = await fetch(`${API_URL}/${table}/${value}`, {
              method: 'DELETE',
            });
            const result = await response.json();
            return { data: result, error: response.ok ? null : result };
          }
        }
      },
      
      async maybeSingle() {
        // This would be implemented by calling the specific GET /table/:id endpoint
        return { data: null, error: null };
      },

      // Other methods (insert, update, delete) would be added here
    };
  },

  auth: {
    async getSession() {
      const token = localStorage.getItem('cf_session');
      if (!token) return { data: { session: null }, error: null };
      // In a real app, verify the token via a Worker call
      return { data: { session: { access_token: token } }, error: null };
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
      return { data: null, error: data };
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
      return { data: null, error: data };
    },

    async signOut() {
      localStorage.removeItem('cf_session');
    },

    onAuthStateChange(callback: any) {
      // Basic event emitter for auth changes
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  }
} as any;
