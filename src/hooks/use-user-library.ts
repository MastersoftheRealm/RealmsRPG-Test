/**
 * User Library Hooks
 * ===================
 * React Query hooks for user-specific library data (powers, techniques, items, creatures).
 * Uses /api/user/library (Supabase).
 */

'use client';

import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { apiFetch } from '@/lib/api-client';
import { useCodexSpecies } from './use-codex';
import type { Species } from './codex-types';
import { readRecordImageUrl } from '@/components/guided-creator/guided-choice-image';

export type {
  LibraryItemType,
  LibraryItemByType,
  LibraryRow,
  SavedPart,
  SavedDamage,
  SavedProperty,
  LibraryPower,
  LibraryTechnique,
  LibraryItem,
  LibrarySpecies,
  LibraryCreature,
  UserPower,
  UserTechnique,
  UserItem,
  UserSpecies,
  UserCreature,
} from '@/types/library';

import type {
  LibraryItemType,
  LibraryPower,
  LibraryTechnique,
  LibraryItem,
  LibrarySpecies,
  LibraryCreature,
  UserSpecies,
} from '@/types/library';

// =============================================================================
// Query Keys
// =============================================================================

/** One canonical query key per library type, keyed by user id. */
const libraryQueryKey = (type: LibraryItemType, userId: string) => [`user-${type}`, userId] as const;

// =============================================================================
// Fetch Functions
// =============================================================================

const API_BASE = '/api/user/library';

async function fetchLibrary<T>(type: string, userId: string): Promise<T[]> {
  if (!userId) return [];
  return apiFetch<T[]>(`${API_BASE}/${type}`);
}

async function deleteLibraryItem(type: string, docId: string): Promise<void> {
  await apiFetch(`${API_BASE}/${type}/${encodeURIComponent(docId)}`, {
    method: 'DELETE',
  });
}

async function duplicateLibraryItem(type: string, docId: string): Promise<string> {
  const result = await apiFetch<{ id: string }>(`${API_BASE}/${type}`, {
    method: 'POST',
    body: JSON.stringify({ duplicateOf: docId }),
  });
  return result.id;
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Generic user-library query hook. The six named hooks below are thin,
 * type-bound wrappers over this factory (previously six copy-paste hooks). (DUP-06)
 */
export function useUserLibrary<T>(
  type: LibraryItemType,
  options?: { enabled?: boolean }
): UseQueryResult<T[], Error> {
  const { user } = useAuthStore();
  const userId = user?.uid || '';
  const enabled = (options?.enabled ?? true) && !!userId;

  return useQuery({
    queryKey: libraryQueryKey(type, userId),
    queryFn: () => fetchLibrary<T>(type, userId),
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export const useUserPowers = (options?: { enabled?: boolean }) =>
  useUserLibrary<LibraryPower>('powers', options);

export const useUserTechniques = (options?: { enabled?: boolean }) =>
  useUserLibrary<LibraryTechnique>('techniques', options);

export const useUserEmpoweredTechniques = (options?: { enabled?: boolean }) =>
  useUserLibrary<LibraryTechnique>('empowered-techniques', options);

export const useUserItems = (options?: { enabled?: boolean }) =>
  useUserLibrary<LibraryItem>('items', options);

export const useUserCreatures = (options?: { enabled?: boolean }) =>
  useUserLibrary<LibraryCreature>('creatures', options);

export const useUserSpecies = (options?: { enabled?: boolean }) =>
  useUserLibrary<LibrarySpecies>('species', options);

/** Normalize user species to Species shape for use in character creator, sheet, and codex. */
export function userSpeciesToSpecies(u: UserSpecies): Species {
  const sizes = u.sizes?.length ? u.sizes : u.size ? [u.size] : ['Medium'];
  const imageUrl = readRecordImageUrl(u);
  return {
    id: u.id,
    name: u.name,
    description: u.description ?? '',
    type: u.type ?? '',
    size: sizes[0] ?? 'Medium',
    sizes,
    speed: u.speed ?? 6,
    traits: [],
    species_traits: u.species_traits ?? [],
    ancestry_traits: u.ancestry_traits ?? [],
    flaws: u.flaws ?? [],
    characteristics: u.characteristics ?? [],
    skills: u.skills ?? [],
    languages: u.languages ?? [],
    ave_height: u.ave_height,
    ave_weight: u.ave_weight,
    adulthood_lifespan: u.adulthood_lifespan,
    image_url: imageUrl,
  };
}

/** Merged species list: user (My Codex) first, then codex (public). Use for species step, skills step, and character sheet so user-created species can be selected and resolved. */
export function useMergedSpecies(): UseQueryResult<Species[], Error> {
  const { data: codexSpecies = [], isLoading: codexLoading, error: codexError, refetch: refetchCodex } = useCodexSpecies();
  const { data: userSpecies = [], isLoading: userLoading, error: userError, refetch: refetchUser } = useUserSpecies();

  const merged = useMemo(() => {
    const codex = (codexSpecies ?? []) as Species[];
    const user = (userSpecies ?? []).map(userSpeciesToSpecies);
    return [...user, ...codex];
  }, [codexSpecies, userSpecies]);

  const isLoading = codexLoading || userLoading;
  const error = codexError ?? userError;

  const refetch = useCallback(async () => {
    await Promise.all([refetchCodex(), refetchUser()]);
  }, [refetchCodex, refetchUser]);

  return useMemo(
    () =>
      ({
        data: merged,
        isLoading,
        error: error ?? null,
        isError: !!error,
        refetch,
        status: isLoading ? 'pending' : error ? 'error' : 'success',
        isSuccess: !error && !isLoading,
        isPending: isLoading,
        isFetching: isLoading,
        failureCount: 0,
        failureReason: null,
        isStale: false,
        isFetched: true,
        fetchStatus: 'idle',
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        isRefetching: false,
        isRefetchError: false,
        isLoadingError: false,
        isPaused: false,
      }) as unknown as UseQueryResult<Species[], Error>,
    [merged, isLoading, error, refetch]
  );
}

// =============================================================================
// Generic Mutation Factories
// =============================================================================

/** Generic delete mutation for any library type */
function useDeleteLibraryItem(type: LibraryItemType): UseMutationResult<void, Error, string> {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (docId: string) => deleteLibraryItem(type, docId),
    onSuccess: () => {
      const uid = user?.uid;
      if (uid) queryClient.invalidateQueries({ queryKey: libraryQueryKey(type, uid) });
    },
  });
}

/** Generic duplicate mutation for any library type */
function useDuplicateLibraryItem(type: LibraryItemType): UseMutationResult<string, Error, string> {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (docId: string) => duplicateLibraryItem(type, docId),
    onSuccess: () => {
      const uid = user?.uid;
      if (uid) queryClient.invalidateQueries({ queryKey: libraryQueryKey(type, uid) });
    },
  });
}

// Named exports for backward compatibility
export const useDeletePower = () => useDeleteLibraryItem('powers');
export const useDeleteTechnique = () => useDeleteLibraryItem('techniques');
export const useDeleteEmpoweredTechnique = () => useDeleteLibraryItem('empowered-techniques');
export const useDeleteItem = () => useDeleteLibraryItem('items');
export const useDeleteCreature = () => useDeleteLibraryItem('creatures');
export const useDeleteSpecies = () => useDeleteLibraryItem('species');

export const useDuplicatePower = () => useDuplicateLibraryItem('powers');
export const useDuplicateTechnique = () => useDuplicateLibraryItem('techniques');
export const useDuplicateEmpoweredTechnique = () => useDuplicateLibraryItem('empowered-techniques');
export const useDuplicateItem = () => useDuplicateLibraryItem('items');
export const useDuplicateCreature = () => useDuplicateLibraryItem('creatures');
export const useDuplicateSpecies = () => useDuplicateLibraryItem('species');
