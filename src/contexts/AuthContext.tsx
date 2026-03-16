import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js'; // Keep types for now to avoid breaking everywhere
import { cloudflare as supabase } from '@/integrations/cloudflare/client';
import { setAnalyticsUserId, clearAnalyticsUserId, trackLogin, trackSignUp } from '@/lib/analytics';
import { trackClarityEvent, tagClaritySession } from '@/lib/clarity';

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
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle GA4 user_id for cross-device tracking
        if (session?.user) {
          setAnalyticsUserId(session.user.id);
          tagClaritySession('user_id', session.user.id);
          
          // Track login/signup events
          if (event === 'SIGNED_IN') {
            trackLogin('email');
            trackClarityEvent('login_success');
          } else if (event === 'USER_UPDATED' && !user) {
            // New signup confirmed
            trackSignUp('email');
            trackClarityEvent('signup_completed');
          }
        } else if (event === 'SIGNED_OUT') {
          clearAnalyticsUserId();
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Set user_id if already logged in
      if (session?.user) {
        setAnalyticsUserId(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    // Use production domain for email redirect
    const baseUrl = window.location.origin.includes('localhost') 
      ? window.location.origin 
      : 'https://www.thehealios.com';
    const redirectUrl = `${baseUrl}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    // Use production domain for password reset redirects
    const baseUrl = window.location.origin.includes('localhost') 
      ? window.location.origin 
      : 'https://www.thehealios.com';
    const redirectUrl = `${baseUrl}/auth?reset=true`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    return { error: error as Error | null };
  };

  const updateEmail = async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });
    
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
