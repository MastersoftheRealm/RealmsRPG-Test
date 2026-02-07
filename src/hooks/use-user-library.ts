/**
 * User Library Hooks
 * ===================
 * React Query hooks for user-specific library data (powers, techniques, items, creatures).
 * Uses /api/user/library (Prisma).
 */

'use client';

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';

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

export function useDeletePower(): UseMutationResult<void, Error, string> {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (docId: string) => deleteLibraryItem('powers', docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userPowers(user?.uid || '') });
    },
  });
}

export function useDeleteTechnique(): UseMutationResult<void, Error, string> {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (docId: string) => deleteLibraryItem('techniques', docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userTechniques(user?.uid || '') });
    },
  });
}

export function useDeleteItem(): UseMutationResult<void, Error, string> {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (docId: string) => deleteLibraryItem('items', docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userItems(user?.uid || '') });
    },
  });
}

export function useDeleteCreature(): UseMutationResult<void, Error, string> {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (docId: string) => deleteLibraryItem('creatures', docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userCreatures(user?.uid || '') });
    },
  });
}

// =============================================================================
// Duplicate Mutations
// =============================================================================

export function useDuplicatePower(): UseMutationResult<string, Error, string> {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (docId: string) => duplicateLibraryItem('powers', docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userPowers(user?.uid || '') });
    },
  });
}

export function useDuplicateTechnique(): UseMutationResult<string, Error, string> {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (docId: string) => duplicateLibraryItem('techniques', docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userTechniques(user?.uid || '') });
    },
  });
}

export function useDuplicateItem(): UseMutationResult<string, Error, string> {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (docId: string) => duplicateLibraryItem('items', docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userItems(user?.uid || '') });
    },
  });
}

export function useDuplicateCreature(): UseMutationResult<string, Error, string> {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (docId: string) => duplicateLibraryItem('creatures', docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userCreatures(user?.uid || '') });
    },
  });
}
