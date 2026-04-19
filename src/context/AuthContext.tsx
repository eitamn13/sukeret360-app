import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import {
  clearAppLocalState,
  getAuthRedirectUrl,
  isSupabaseConfigured,
  supabase,
  syncAuthenticatedUser,
} from '../lib/supabase';

interface AuthContextValue {
  authEnabled: boolean;
  isAdmin: boolean;
  loading: boolean;
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithFacebook: () => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{
    error: string | null;
    needsEmailConfirmation: boolean;
  }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const SERVER_NOT_CONFIGURED = 'שירות ההתחברות עדיין לא זמין בסביבה הזו.';

async function signInWithOAuthProvider(provider: 'google' | 'facebook') {
  if (!supabase) {
    return { error: SERVER_NOT_CONFIGURED };
  }

  const redirectTo = getAuthRedirectUrl();
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      scopes: provider === 'facebook' ? 'email,public_profile' : 'email profile',
      queryParams:
        provider === 'google'
          ? {
              access_type: 'offline',
              prompt: 'consent',
            }
          : undefined,
    },
  });

  return { error: error?.message ?? null };
}

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

  const signInWithGoogle = async () => signInWithOAuthProvider('google');
  const signInWithFacebook = async () => signInWithOAuthProvider('facebook');

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
        emailRedirectTo: getAuthRedirectUrl(),
        data: {
          full_name: name.trim(),
        },
      },
    });

    if (data.user && data.session) {
      void syncAuthenticatedUser(data.user);
    }

    return {
      error: error?.message ?? null,
      needsEmailConfirmation: !data.session,
    };
  };

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    clearAppLocalState();
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!supabase || !session?.access_token) {
      return { error: 'מחיקת חשבון זמינה רק אחרי התחברות מלאה.' };
    }

    const response = await fetch('/api/delete-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      return {
        error: payload?.error || 'לא הצלחנו למחוק את החשבון כרגע. אפשר לנסות שוב בעוד רגע.',
      };
    }

    clearAppLocalState();
    await supabase.auth.signOut();
    return { error: null };
  }, [session?.access_token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      authEnabled: isSupabaseConfigured,
      isAdmin: Boolean(user?.email && adminEmails.includes(user.email.toLowerCase())),
      loading,
      user,
      session,
      signIn,
      signInWithGoogle,
      signInWithFacebook,
      signUp,
      signOut,
      deleteAccount,
    }),
    [adminEmails, deleteAccount, loading, session, signOut, user]
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
