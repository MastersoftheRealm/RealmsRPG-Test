/**
 * Official Library Hook
 * =====================
 * Fetches official library items (no auth). Uses /api/official (columnar tables).
 * Used for Library "Official" tab and add-to-library flows.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchOfficialLibrary, addOfficialItemToLibrary } from '@/services/library-service';

const OFFICIAL_LIBRARY_KEYS = {
  all: ['official-library'] as const,
  byType: (type: string) => ['official-library', type] as const,
};

export function useOfficialLibrary(type: 'powers' | 'techniques' | 'items' | 'creatures') {
  return useQuery({
    queryKey: OFFICIAL_LIBRARY_KEYS.byType(type),
    queryFn: () => fetchOfficialLibrary(type),
    staleTime: 5 * 60 * 1000, // 5 min — official library changes rarely; avoid refetch on every add-modal open
    refetchOnMount: true,
  });
}

/** @deprecated Use useOfficialLibrary. */
export const usePublicLibrary = useOfficialLibrary;

const USER_LIBRARY_KEY_MAP: Record<string, string> = {
  powers: 'user-powers',
  techniques: 'user-techniques',
  items: 'user-items',
  creatures: 'user-creatures',
};

export function useAddOfficialToLibrary(type: 'powers' | 'techniques' | 'items' | 'creatures') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: Record<string, unknown>) => addOfficialItemToLibrary(type, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OFFICIAL_LIBRARY_KEYS.byType(type) });
      queryClient.invalidateQueries({ queryKey: [USER_LIBRARY_KEY_MAP[type]] });
    },
  });
}

/** @deprecated Use useAddOfficialToLibrary. */
export const useAddPublicToLibrary = useAddOfficialToLibrary;
