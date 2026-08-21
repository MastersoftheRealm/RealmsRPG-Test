/**
 * useAuth Hook
 * =============
 * React hook for authentication with Supabase
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { AuthUser } from '@/types/auth';
import {
  migrateGuestEncountersOnSignIn,
  hasGuestEncountersToMigrate,
} from '@/lib/guest-encounter-migration';
import { logClientError } from '@/lib/api-client';
import { useIsClient } from './use-is-client';

function toAuthUser(
  user: {
    id: string;
    email?: string | undefined;
    user_metadata?: Record<string, unknown> | undefined;
    app_metadata?: { provider?: string | undefined } | undefined;
    identities?: Array<{ provider?: string | undefined }> | undefined;
  } | null,
): AuthUser | null {
  if (!user) return null;
  const provider =
    user.app_metadata?.provider ??
    user.identities?.[0]?.provider ??
    (user.email ? 'email' : undefined);
  return {
    id: user.id,
    uid: user.id,
    email: user.email ?? null,
    displayName:
      ((user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.user_metadata?.display_name) as string | null) ?? null,
    photoURL:
      ((user.user_metadata?.avatar_url ??
        user.user_metadata?.picture ??
        user.user_metadata?.photo_url) as string | null) ?? null,
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

  const isClient = useIsClient();
  const mountedRef = useRef(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isClient) return;
    mountedRef.current = true;

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    ) {
      if (mountedRef.current) {
        setUser(null);
        setInitialized(true);
        setLoading(false);
      }
      return;
    }

    const supabase = createClient();
    let listenerFired = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      listenerFired = true;
      if (mountedRef.current) {
        setUser(toAuthUser(session?.user ?? null));
        setInitialized(true);
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          queryClient.clear();
        }
        if (event === 'SIGNED_IN' && session?.user && hasGuestEncountersToMigrate()) {
          migrateGuestEncountersOnSignIn().catch((err) => {
            logClientError('use-auth: guest encounter migration failed', err);
          });
        }
      }
    });

    // Ignore getUser if onAuthStateChange already delivered the live session.
    supabase.auth
      .getUser()
      .then(({ data: { user: u } }) => {
        if (mountedRef.current && !listenerFired) {
          setUser(toAuthUser(u));
          setInitialized(true);
        }
      })
      .catch(() => {
        if (mountedRef.current && !listenerFired) {
          setError('Failed to initialize auth');
          setInitialized(true);
        }
      });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [isClient, setUser, setError, setInitialized, setLoading, queryClient]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      clearError();
      try {
        const supabase = createClient();
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        setUser(toAuthUser(data.user));
        if (hasGuestEncountersToMigrate()) {
          await migrateGuestEncountersOnSignIn();
        }
        return data.user;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to sign in';
        setError(message);
        throw err;
      }
    },
    [setLoading, setError, setUser, clearError],
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
    [setLoading, setError, setUser, clearError],
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
    [setLoading, setError, clearError],
  );

  const updateUserProfile = useCallback(
    async (updates: { displayName?: string | undefined; photoURL?: string | undefined }) => {
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
        const {
          data: { user: u },
        } = await supabase.auth.getUser();
        setUser(toAuthUser(u));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update profile';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, setUser, setLoading, setError, clearError],
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
