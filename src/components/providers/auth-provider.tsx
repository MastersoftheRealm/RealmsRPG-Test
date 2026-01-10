/**
 * Auth Provider
 * ==============
 * Initializes Firebase auth listener on app load
 */

'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // This hook sets up the Firebase auth listener
  useAuth();

  // Render children immediately for better UX
  return <>{children}</>;
}
