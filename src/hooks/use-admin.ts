/**
 * useAdmin Hook
 * =============
 * Client-side check for admin status via /api/admin/check.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from './use-auth';

export function useAdmin() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', user?.uid],
    queryFn: async () => {
      const json = await apiFetch<{ isAdmin?: boolean }>('/api/admin/check');
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
