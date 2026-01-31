/**
 * Auth Provider
 * ==============
 * Initializes Firebase auth listener on app load and syncs with server session.
 * 
 * This provider:
 * 1. Sets up the Firebase Auth state listener (via useAuth)
 * 2. Syncs auth state with server-side session cookies (via useSessionSync)
 * 
 * The session sync enables Server Components to access authentication state
 * without requiring client-side hydration first.
 */

'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSessionSync } from '@/hooks/use-session-sync';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // This hook sets up the Firebase auth listener and populates the auth store
  useAuth();

  // This hook syncs Firebase auth state with server-side session cookies
  // When user signs in: creates a session cookie for SSR
  // When user signs out: clears the session cookie
  useSessionSync({
    onError: (error) => {
      // Log session sync errors but don't block the UI
      console.warn('Session sync error:', error.message);
    },
  });

  // Render children immediately for better UX
  return <>{children}</>;
}
