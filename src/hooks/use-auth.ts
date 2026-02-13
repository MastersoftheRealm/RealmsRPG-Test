/**
 * useAuth Hook
 * =============
 * React hook for authentication with Supabase
 */

'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { AuthUser } from '@/types/auth';

function toAuthUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: { provider?: string }; identities?: Array<{ provider?: string }> } | null): AuthUser | null {
  if (!user) return null;
  const provider = user.app_metadata?.provider ?? user.identities?.[0]?.provider ?? (user.email ? 'email' : undefined);
  return {
    id: user.id,
    uid: user.id,
    email: user.email ?? null,
    displayName: (user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.user_metadata?.display_name) as string | null ?? null,
    photoURL: (user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? user.user_metadata?.photo_url) as string | null ?? null,
    emailVerified: !!user.user_metadata?.email_verified,
    provider,
  };
}

export function useAuth() {
  const {
    user,
    loading,
    error,
    initialized,
    setUser,
    setLoading,
    setError,
    setInitialized,
    clearError,
  } = useAuthStore();

  const [supabaseReady, setSupabaseReady] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    setSupabaseReady(true);
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!supabaseReady) return;

    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mountedRef.current) {
        setUser(toAuthUser(session?.user ?? null));
        setInitialized(true);
      }
    });

    // Get initial session (only sets state if onAuthStateChange hasn't fired yet)
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (mountedRef.current) {
        setUser(toAuthUser(u));
        setInitialized(true);
      }
    }).catch((err) => {
      if (mountedRef.current) {
        console.error('Auth init error:', err);
        setError('Failed to initialize auth');
        setInitialized(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabaseReady, setUser, setError, setInitialized]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      clearError();
      try {
        const supabase = createClient();
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        setUser(toAuthUser(data.user));
        return data.user;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to sign in';
        setError(message);
        throw err;
      }
    },
    [setLoading, setError, setUser, clearError]
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      setLoading(true);
      clearError();
      try {
        const supabase = createClient();
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: displayName, display_name: displayName } },
        });
        if (err) throw err;
        setUser(toAuthUser(data.user));
        return data.user;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create account';
        setError(message);
        throw err;
      }
    },
    [setLoading, setError, setUser, clearError]
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out';
      setError(message);
      throw err;
    }
  }, [setLoading, setError, setUser, clearError]);

  const resetPassword = useCallback(
    async (email: string) => {
      setLoading(true);
      clearError();
      try {
        const supabase = createClient();
        await supabase.auth.resetPasswordForEmail(email);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send reset email';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, clearError]
  );

  const updateUserProfile = useCallback(
    async (updates: { displayName?: string; photoURL?: string }) => {
      if (!user) throw new Error('No user logged in');
      setLoading(true);
      clearError();
      try {
        const supabase = createClient();
        const { error: err } = await supabase.auth.updateUser({
          data: {
            full_name: updates.displayName ?? user.displayName,
            display_name: updates.displayName ?? user.displayName,
            avatar_url: updates.photoURL ?? user.photoURL,
          },
        });
        if (err) throw err;
        const { data: { user: u } } = await supabase.auth.getUser();
        setUser(toAuthUser(u));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update profile';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, setUser, setLoading, setError, clearError]
  );

  return {
    user,
    loading,
    error,
    initialized,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
    clearError,
  };
}

export { useAuthStore };
