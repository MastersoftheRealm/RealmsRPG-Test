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

// =============================================================================
// Types
// =============================================================================

export interface SavedPart {
  id?: number;
  name?: string;
  op_1_lvl?: number;
  op_2_lvl?: number;
  op_3_lvl?: number;
  applyDuration?: boolean;
}

export interface SavedDamage {
  amount?: number | string;
  size?: number | string;
  type?: string;
  applyDuration?: boolean;
}

export interface UserPower {
  id: string;
  docId: string;
  name: string;
  description?: string;
  parts: SavedPart[];
  damage?: SavedDamage[];
  actionType?: string;
  isReaction?: boolean;
  range?: { steps?: number; applyDuration?: boolean };
  area?: { type?: string; level?: number; applyDuration?: boolean };
  duration?: { type?: string; value?: number; focus?: boolean; noHarm?: boolean; endsOnActivation?: boolean; sustain?: number };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserTechnique {
  id: string;
  docId: string;
  name: string;
  description?: string;
  parts: SavedPart[];
  damage?: SavedDamage[];
  weapon?: { id?: string | number; name?: string };
  actionType?: string;
  isReaction?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SavedProperty {
  id?: number;
  name?: string;
  op_1_lvl?: number;
}

export interface UserItem {
  id: string;
  docId: string;
  name: string;
  description?: string;
  type: 'weapon' | 'armor' | 'equipment' | 'shield';
  properties: SavedProperty[];
  damage?: SavedDamage[];
  isTwoHanded?: boolean;
  rangeLevel?: number;
  abilityRequirement?: { id?: string; name?: string; level?: number };
  damageReduction?: number;
  agilityReduction?: number;
  criticalRangeIncrease?: number;
  shieldDR?: { amount: number; size: number };
  hasShieldDamage?: boolean;
  shieldDamage?: { amount: number; size: number };
  costs?: { totalTP?: number; totalCurrency?: number; totalIP?: number };
  rarity?: string;
  armorValue?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserSpecies {
  id: string;
  docId?: string;
  name: string;
  description?: string;
  type?: string;
  size?: string;
  sizes?: string[];
  speed?: number;
  skills?: string[];
  species_traits?: string[];
  ancestry_traits?: string[];
  flaws?: string[];
  characteristics?: string[];
  languages?: string[];
  ave_height?: number;
  ave_weight?: number;
  adulthood_lifespan?: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserCreature {
  id: string;
  docId: string;
  name: string;
  description?: string;
  level: number;
  type?: string;
  size?: string;
  hitPoints?: number;
  energyPoints?: number;
  abilities?: Record<string, number>;
  defenses?: Record<string, number>;
  powerProficiency?: number;
  martialProficiency?: number;
  resistances?: string[];
  weaknesses?: string[];
  immunities?: string[];
  conditionImmunities?: string[];
  senses?: string[];
  movementTypes?: string[];
  languages?: string[];
  skills?: Array<{ name: string; value: number; proficient?: boolean }>;
  powers?: Array<{ name: string; description?: string }>;
  techniques?: Array<{ name: string; description?: string }>;
  feats?: Array<{ name: string; description?: string }>;
  armaments?: Array<{ name: string }>;
  hp?: number;
  attacks?: unknown[];
  createdAt?: Date;
  updatedAt?: Date;
}

// =============================================================================
// Query Keys
// =============================================================================

type LibraryType = 'powers' | 'techniques' | 'empowered-techniques' | 'items' | 'creatures' | 'species';

/** One canonical query key per library type, keyed by user id. */
const libraryQueryKey = (type: LibraryType, userId: string) => [`user-${type}`, userId] as const;

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
  type: LibraryType,
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
  useUserLibrary<UserPower>('powers', options);

export const useUserTechniques = (options?: { enabled?: boolean }) =>
  useUserLibrary<UserTechnique>('techniques', options);

export const useUserEmpoweredTechniques = (options?: { enabled?: boolean }) =>
  useUserLibrary<UserTechnique>('empowered-techniques', options);

export const useUserItems = (options?: { enabled?: boolean }) =>
  useUserLibrary<UserItem>('items', options);

export const useUserCreatures = (options?: { enabled?: boolean }) =>
  useUserLibrary<UserCreature>('creatures', options);

export const useUserSpecies = (options?: { enabled?: boolean }) =>
  useUserLibrary<UserSpecies>('species', options);

/** Normalize user species to Species shape for use in character creator, sheet, and codex. */
export function userSpeciesToSpecies(u: UserSpecies): Species {
  const sizes = u.sizes?.length ? u.sizes : (u.size ? [u.size] : ['Medium']);
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
function useDeleteLibraryItem(type: LibraryType): UseMutationResult<void, Error, string> {
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
function useDuplicateLibraryItem(type: LibraryType): UseMutationResult<string, Error, string> {
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
