/**
 * Session Sync Hook
 * ==================
 * Syncs Firebase Auth state with server-side session cookies.
 * 
 * This hook should be used in the root layout to ensure:
 * 1. When a user signs in on the client, a session cookie is created
 * 2. When a user signs out on the client, the session cookie is cleared
 * 3. Server Components can access auth state via cookies
 * 
 * Flow:
 * 1. Firebase Auth state changes (sign in/out)
 * 2. If signed in, get ID token and POST to /api/session
 * 3. If signed out, DELETE to /api/session
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, waitForFirebase } from '@/lib/firebase/client';

interface UseSessionSyncOptions {
  /**
   * Callback when session is successfully created
   */
  onSessionCreated?: (user: User) => void;
  /**
   * Callback when session is cleared
   */
  onSessionCleared?: () => void;
  /**
   * Callback on error
   */
  onError?: (error: Error) => void;
}

/**
 * Hook to sync Firebase Auth state with server-side session cookies.
 * 
 * Add this to your root layout's AuthProvider to enable SSR auth.
 */
export function useSessionSync(options: UseSessionSyncOptions = {}) {
  const { onSessionCreated, onSessionCleared, onError } = options;
  const lastUidRef = useRef<string | null>(null);
  const syncingRef = useRef(false);

  const createSession = useCallback(async (user: User) => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      // Get a fresh ID token
      const idToken = await user.getIdToken(true);
      
      // Create session cookie on the server
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        // Try to parse as JSON, fallback to text for non-JSON error responses
        let errorMessage = 'Failed to create session';
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } else {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      lastUidRef.current = user.uid;
      onSessionCreated?.(user);
    } catch (error) {
      console.error('Error creating session:', error);
      onError?.(error as Error);
    } finally {
      syncingRef.current = false;
    }
  }, [onSessionCreated, onError]);

  const clearSession = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      await fetch('/api/session', { method: 'DELETE' });
      lastUidRef.current = null;
      onSessionCleared?.();
    } catch (error) {
      console.error('Error clearing session:', error);
      onError?.(error as Error);
    } finally {
      syncingRef.current = false;
    }
  }, [onSessionCleared, onError]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupAuthListener = async () => {
      await waitForFirebase();

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          // User signed in
          if (lastUidRef.current !== user.uid) {
            await createSession(user);
          }
        } else {
          // User signed out
          if (lastUidRef.current !== null) {
            await clearSession();
          }
        }
      });
    };

    setupAuthListener();

    return () => {
      unsubscribe?.();
    };
  }, [createSession, clearSession]);

  return {
    /**
     * Force refresh the session (e.g., after token refresh)
     */
    refreshSession: async () => {
      await waitForFirebase();
      const user = auth.currentUser;
      if (user) {
        await createSession(user);
      }
    },
    /**
     * Force clear the session
     */
    clearSession,
  };
}

export default useSessionSync;
