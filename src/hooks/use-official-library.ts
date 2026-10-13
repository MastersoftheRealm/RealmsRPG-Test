/**
 * Official Library Hook
 * =====================
 * Fetches official library items. Player catalogs are listed-only; admin
 * editor / creator load pass includeUnlisted (ADR-0027).
 */

'use client';

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useToast } from '@/components/ui';
import {
  addOfficialItemToLibrary,
  fetchOfficialLibrary,
  fetchOfficialLibraryCounts,
} from '@/services/library-service';
import { userLibraryKeys } from '@/hooks/use-user-library';
import type { CatalogListing } from '@/lib/library/catalog-listing';
import type { LibraryTabCounts } from '@/lib/library/library-tab-counts';
import type { LibraryItemType, LibraryRow } from '@/types/library';

export const officialLibraryKeys = {
  all: ['official-library'] as const,
  byType: (type: string, includeUnlisted = false) =>
    ['official-library', type, includeUnlisted ? 'all' : 'listed'] as const,
  counts: ['official-library-counts'] as const,
};

export function useOfficialLibrary<T extends LibraryItemType>(
  type: T,
  options?: { enabled?: boolean | undefined; includeUnlisted?: boolean | undefined },
): UseQueryResult<LibraryRow<T>[], Error> {
  const enabled = options?.enabled ?? true;
  const includeUnlisted = options?.includeUnlisted === true;
  return useQuery({
    queryKey: officialLibraryKeys.byType(type, includeUnlisted),
    queryFn: () => fetchOfficialLibrary(type, { includeUnlisted }),
    staleTime: 5 * 60 * 1000,
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
        queryKey: officialLibraryKeys.all,
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

export function usePatchOfficialCatalogListing(type: LibraryItemType | 'enhanced-items') {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return async (id: string, catalogListing: CatalogListing) => {
    try {
      await apiFetch(
        type === 'enhanced-items'
          ? `/api/official/enhanced-items?id=${encodeURIComponent(id)}`
          : `/api/official/${type}`,
        {
          method: 'PATCH',
          body: JSON.stringify(
            type === 'enhanced-items' ? { catalogListing } : { id, catalogListing },
          ),
        },
      );
      await queryClient.invalidateQueries({
        queryKey: officialLibraryKeys.all,
        refetchType: 'all',
      });
      await queryClient.invalidateQueries({
        queryKey: officialLibraryKeys.counts,
        refetchType: 'all',
      });
      if (type === 'enhanced-items') {
        await queryClient.invalidateQueries({ queryKey: ['enhanced-items'], refetchType: 'all' });
      }
      if (type === 'species') {
        await queryClient.invalidateQueries({ queryKey: ['codex'], refetchType: 'all' });
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to update library class', 'error');
    }
  };
}
