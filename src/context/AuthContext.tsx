import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase, syncAuthenticatedUser } from '../lib/supabase';

interface AuthContextValue {
  authEnabled: boolean;
  isAdmin: boolean;
  loading: boolean;
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{
    error: string | null;
    needsEmailConfirmation: boolean;
  }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const SERVER_NOT_CONFIGURED = '\u05d4\u05d7\u05d9\u05d1\u05d5\u05e8 \u05dc\u05e9\u05e8\u05ea \u05e2\u05d3\u05d9\u05d9\u05df \u05dc\u05d0 \u05d4\u05d5\u05d2\u05d3\u05e8 \u05d1\u05e1\u05d1\u05d9\u05d1\u05d4.';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const adminEmails = useMemo(
    () =>
      (import.meta.env.VITE_ADMIN_EMAILS ?? '')
        .split(',')
        .map((value: string) => value.trim().toLowerCase())
        .filter(Boolean),
    []
  );

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;

      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);

      if (data.session?.user) {
        void syncAuthenticatedUser(data.session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      if (nextSession?.user) {
        void syncAuthenticatedUser(nextSession.user);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: SERVER_NOT_CONFIGURED };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      return { error: SERVER_NOT_CONFIGURED };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (!supabase) {
      return {
        error: SERVER_NOT_CONFIGURED,
        needsEmailConfirmation: false,
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: name.trim(),
        },
      },
    });

    return {
      error: error?.message ?? null,
      needsEmailConfirmation: !data.session,
    };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      authEnabled: isSupabaseConfigured,
      isAdmin: Boolean(user?.email && adminEmails.includes(user.email.toLowerCase())),
      loading,
      user,
      session,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
    }),
    [adminEmails, loading, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }

  return context;
}
