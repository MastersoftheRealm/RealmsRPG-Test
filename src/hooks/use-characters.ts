/**
 * useCharacters Hook
 * ====================
 * React Query hooks for character data
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCharacters,
  getCharacter,
  saveCharacter,
  createCharacter,
  deleteCharacter,
  duplicateCharacter,
} from '@/services/character-service';
import { useAuthStore } from '@/stores/auth-store';
import type { Character } from '@/types';

function viewerId(userId?: string | null): string {
  return userId?.trim() || 'anon';
}

/** Query keys for character data — scoped by viewer (ADR-0013 / TASK-741). */
export const characterKeys = {
  all: ['characters'] as const,
  lists: (userId: string) => [...characterKeys.all, 'list', viewerId(userId)] as const,
  list: (userId: string) => [...characterKeys.lists(userId)] as const,
  details: (userId: string) => [...characterKeys.all, 'detail', viewerId(userId)] as const,
  detail: (userId: string, id: string) => [...characterKeys.details(userId), id] as const,
};

export interface UseCharactersOptions {
  /** When false, the query does not run (e.g. when user is not signed in). */
  enabled?: boolean;
}

/**
 * Get all characters for the current user.
 */
export function useCharacters(options?: UseCharactersOptions) {
  const { user } = useAuthStore();
  const userId = user?.uid || '';
  const enabled = (options?.enabled ?? true) && !!userId;
  return useQuery({
    queryKey: characterKeys.list(userId),
    queryFn: getCharacters,
    enabled,
  });
}

/**
 * Get a single character by ID.
 */
export function useCharacter(characterId: string | undefined) {
  const { user } = useAuthStore();
  const userId = viewerId(user?.uid);
  return useQuery({
    queryKey: characterKeys.detail(userId, characterId || ''),
    queryFn: () => getCharacter(characterId || ''),
    enabled: !!characterId,
  });
}

/**
 * Save character mutation.
 */
export function useSaveCharacter() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = viewerId(user?.uid);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Character> }) =>
      saveCharacter(id, data, { updatedAt: data.updatedAt }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: characterKeys.detail(userId, id) });
      queryClient.invalidateQueries({ queryKey: characterKeys.lists(userId) });
    },
  });
}

/**
 * Create character mutation.
 */
export function useCreateCharacter() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = viewerId(user?.uid);

  return useMutation({
    mutationFn: (data: Partial<Character>) => createCharacter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.lists(userId) });
    },
  });
}

/**
 * Delete character mutation.
 */
export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = viewerId(user?.uid);

  return useMutation({
    mutationFn: (id: string) => deleteCharacter(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: characterKeys.detail(userId, id) });
      queryClient.invalidateQueries({ queryKey: characterKeys.lists(userId) });
    },
  });
}

/**
 * Duplicate character mutation.
 */
export function useDuplicateCharacter() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = viewerId(user?.uid);

  return useMutation({
    mutationFn: (id: string) => duplicateCharacter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.lists(userId) });
    },
  });
}
