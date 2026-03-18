import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { cloudflare as supabase } from '@/integrations/cloudflare/client';
import { setAnalyticsUserId, clearAnalyticsUserId, trackLogin, trackSignUp } from '@/lib/analytics';
import { trackClarityEvent, tagClaritySession } from '@/lib/clarity';

// Local auth types (no Supabase dependency)
interface User { id: string; email?: string; first_name?: string; last_name?: string; role?: string; [key: string]: any; }
interface Session { user: User; access_token: string; }

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  updateEmail: (newEmail: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          setAnalyticsUserId(session.user.id);
          tagClaritySession('user_id', session.user.id);

          if (event === 'SIGNED_IN') {
            trackLogin('email');
            trackClarityEvent('login_success');
          } else if (event === 'USER_UPDATED' && !user) {
            trackSignUp('email');
            trackClarityEvent('signup_completed');
          }
        } else if (event === 'SIGNED_OUT') {
          clearAnalyticsUserId();
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        setAnalyticsUserId(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const baseUrl = window.location.origin.includes('localhost')
      ? window.location.origin
      : 'https://www.thehealios.com';
    const redirectUrl = `${baseUrl}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { first_name: firstName, last_name: lastName }
      }
    });

    if (!error && data?.user) {
      setUser(data.user);
      setSession({ user: data.user, access_token: data.session });
    }

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.user) {
      setUser(data.user);
      setSession({ user: data.user, access_token: data.session });
    }
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    const baseUrl = window.location.origin.includes('localhost')
      ? window.location.origin
      : 'https://www.thehealios.com';
    const redirectUrl = `${baseUrl}/auth?reset=true`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error as Error | null };
  };

  const updateEmail = async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword, updatePassword, updateEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
