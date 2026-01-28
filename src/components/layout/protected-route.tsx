/**
 * Protected Route Wrapper
 * ========================
 * Wraps pages that require authentication
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { LoadingState } from '@/components/ui/spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading, initialized } = useAuthStore();

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.push('/login');
    }
  }, [user, loading, initialized, router]);

  // Still initializing
  if (!initialized || loading) {
    return fallback ?? <LoadingState size="lg" padding="lg" />;
  }

  // Not authenticated
  if (!user) {
    return fallback ?? <LoadingState size="lg" padding="lg" />;
  }

  return <>{children}</>;
}
