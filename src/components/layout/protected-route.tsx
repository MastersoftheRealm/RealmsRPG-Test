/**
 * Protected Route Wrapper
 * ========================
 * Wraps pages that require authentication
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { LoadingState } from '@/components/ui/spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, initialized } = useAuthStore();

  useEffect(() => {
    if (initialized && !loading && !user) {
      const returnTo = encodeURIComponent(pathname || '/');
      router.push(`/login?returnTo=${returnTo}`);
    }
  }, [user, loading, initialized, router, pathname]);

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
