/**
 * Auth Provider
 * ==============
 * Initializes Supabase auth listener on app load.
 * Session refresh is handled by Supabase middleware.
 */

'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  useAuth();
  return <>{children}</>;
}
