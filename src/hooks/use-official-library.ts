/**
 * Official Library Hook
 * =====================
 * Fetches official library items (no auth). Uses /api/official (columnar tables).
 * Used for Library "Official" tab and add-to-library flows.
 */

'use client';

import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import {
  fetchOfficialLibrary,
  fetchOfficialLibraryCounts,
  addOfficialItemToLibrary,
} from '@/services/library-service';
import { userLibraryKeys } from '@/hooks/use-user-library';
import type { LibraryTabCounts } from '@/lib/library/library-tab-counts';
import type { LibraryItemType, LibraryRow } from '@/types/library';

export const officialLibraryKeys = {
  all: ['official-library'] as const,
  byType: (type: string) => ['official-library', type] as const,
  counts: ['official-library-counts'] as const,
};

export function useOfficialLibrary<T extends LibraryItemType>(
  type: T,
  options?: { enabled?: boolean | undefined },
): UseQueryResult<LibraryRow<T>[], Error> {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: officialLibraryKeys.byType(type),
    queryFn: () => fetchOfficialLibrary(type),
    staleTime: 5 * 60 * 1000, // 5 min — official library changes rarely; avoid refetch on every add-modal open
    refetchOnMount: true,
    enabled,
  });
}

export function useOfficialLibraryCounts(options?: {
  enabled?: boolean | undefined;
}): UseQueryResult<LibraryTabCounts, Error> {
  return useQuery({
    queryKey: officialLibraryKeys.counts,
    queryFn: fetchOfficialLibraryCounts,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    enabled: options?.enabled ?? true,
  });
}

const USER_LIBRARY_KEY_MAP: Record<LibraryItemType, string> = {
  powers: 'user-powers',
  techniques: 'user-techniques',
  'empowered-techniques': 'user-empowered-techniques',
  items: 'user-items',
  creatures: 'user-creatures',
  species: 'user-species',
};

export function useAddOfficialToLibrary<T extends LibraryItemType>(type: T) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: LibraryRow<T>) => addOfficialItemToLibrary(type, item),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: officialLibraryKeys.byType(type),
        refetchType: 'all',
      });
      await queryClient.invalidateQueries({
        queryKey: [USER_LIBRARY_KEY_MAP[type]],
        refetchType: 'all',
      });
      await queryClient.invalidateQueries({
        queryKey: userLibraryKeys.countsRoot,
        refetchType: 'all',
      });
    },
  });
}
