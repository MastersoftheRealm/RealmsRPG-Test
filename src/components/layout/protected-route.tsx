/**
 * Protected Route Wrapper
 * ========================
 * Wraps pages that require authentication
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { LoadingState } from '@/components/ui/spinner';
import { buildProtectedRouteLoginUrl } from '@/lib/auth/sign-in-guard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | undefined;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading, initialized } = useAuthStore();

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.push(buildProtectedRouteLoginUrl(pathname || '/', searchParams.toString()));
    }
  }, [user, loading, initialized, router, pathname, searchParams]);

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
