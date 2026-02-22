/**
 * User Library Hooks
 * ===================
 * React Query hooks for user-specific library data (powers, techniques, items, creatures).
 * Uses /api/user/library (Prisma).
 */

'use client';

import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { useCodexSpecies } from './use-codex';
import type { Species } from './use-rtdb';

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
  weapon?: { id?: number; name?: string };
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

const QUERY_KEYS = {
  userPowers: (userId: string) => ['user-powers', userId] as const,
  userTechniques: (userId: string) => ['user-techniques', userId] as const,
  userItems: (userId: string) => ['user-items', userId] as const,
  userCreatures: (userId: string) => ['user-creatures', userId] as const,
  userSpecies: (userId: string) => ['user-species', userId] as const,
};

// =============================================================================
// Fetch Functions
// =============================================================================

const API_BASE = '/api/user/library';

async function fetchLibrary<T>(type: string, userId: string): Promise<T[]> {
  if (!userId) return [];
  const res = await fetch(`${API_BASE}/${type}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

// =============================================================================
// Hooks
// =============================================================================

export function useUserPowers(): UseQueryResult<UserPower[], Error> {
  const { user } = useAuthStore();
  const userId = user?.uid || '';

  return useQuery({
    queryKey: QUERY_KEYS.userPowers(userId),
    queryFn: () => fetchLibrary<UserPower>('powers', userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useUserTechniques(): UseQueryResult<UserTechnique[], Error> {
  const { user } = useAuthStore();
  const userId = user?.uid || '';

  return useQuery({
    queryKey: QUERY_KEYS.userTechniques(userId),
    queryFn: () => fetchLibrary<UserTechnique>('techniques', userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useUserItems(): UseQueryResult<UserItem[], Error> {
  const { user } = useAuthStore();
  const userId = user?.uid || '';

  return useQuery({
    queryKey: QUERY_KEYS.userItems(userId),
    queryFn: () => fetchLibrary<UserItem>('items', userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useUserCreatures(): UseQueryResult<UserCreature[], Error> {
  const { user } = useAuthStore();
  const userId = user?.uid || '';

  return useQuery({
    queryKey: QUERY_KEYS.userCreatures(userId),
    queryFn: () => fetchLibrary<UserCreature>('creatures', userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useUserSpecies(): UseQueryResult<UserSpecies[], Error> {
  const { user } = useAuthStore();
  const userId = user?.uid || '';

  return useQuery({
    queryKey: QUERY_KEYS.userSpecies(userId),
    queryFn: () => fetchLibrary<UserSpecies>('species', userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/** Normalize user species to Species shape for use in character creator and sheet. */
function userSpeciesToSpecies(u: UserSpecies): Species {
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
// Mutations
// =============================================================================

async function deleteLibraryItem(type: string, docId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${type}/${encodeURIComponent(docId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Delete failed');
  }
}

async function duplicateLibraryItem(type: string, docId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ duplicateOf: docId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Duplicate failed');
  }
  const result = await res.json();
  return (result as { id: string }).id;
}

// =============================================================================
// Generic Mutation Factories
// =============================================================================

type LibraryType = 'powers' | 'techniques' | 'items' | 'creatures' | 'species';

const TYPE_QUERY_KEYS: Record<LibraryType, (uid: string) => readonly string[]> = {
  powers: QUERY_KEYS.userPowers,
  techniques: QUERY_KEYS.userTechniques,
  items: QUERY_KEYS.userItems,
  creatures: QUERY_KEYS.userCreatures,
  species: QUERY_KEYS.userSpecies,
};

/** Generic delete mutation for any library type */
function useDeleteLibraryItem(type: LibraryType): UseMutationResult<void, Error, string> {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (docId: string) => deleteLibraryItem(type, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TYPE_QUERY_KEYS[type](user?.uid || '') });
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
      queryClient.invalidateQueries({ queryKey: TYPE_QUERY_KEYS[type](user?.uid || '') });
    },
  });
}

// Named exports for backward compatibility
export const useDeletePower = () => useDeleteLibraryItem('powers');
export const useDeleteTechnique = () => useDeleteLibraryItem('techniques');
export const useDeleteItem = () => useDeleteLibraryItem('items');
export const useDeleteCreature = () => useDeleteLibraryItem('creatures');

export const useDuplicatePower = () => useDuplicateLibraryItem('powers');
export const useDuplicateTechnique = () => useDuplicateLibraryItem('techniques');
export const useDuplicateItem = () => useDuplicateLibraryItem('items');
export const useDuplicateCreature = () => useDuplicateLibraryItem('creatures');
