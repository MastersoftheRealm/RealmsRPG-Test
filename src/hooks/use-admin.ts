/**
 * useAdmin Hook
 * =============
 * Client-side check for admin status via /api/admin/check.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './use-auth';

export function useAdmin() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', user?.uid],
    queryFn: async () => {
      const res = await fetch('/api/admin/check');
      const json = await res.json();
      return json.isAdmin === true;
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  return {
    isAdmin: data ?? false,
    isLoading: isLoading || !user,
  };
}
