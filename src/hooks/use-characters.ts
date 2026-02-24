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
import type { Character, CharacterSummary } from '@/types';

/** Query keys for character data */
export const characterKeys = {
  all: ['characters'] as const,
  lists: () => [...characterKeys.all, 'list'] as const,
  list: () => [...characterKeys.lists()] as const,
  details: () => [...characterKeys.all, 'detail'] as const,
  detail: (id: string) => [...characterKeys.details(), id] as const,
};

export interface UseCharactersOptions {
  /** When false, the query does not run (e.g. when user is not signed in). */
  enabled?: boolean;
}

/**
 * Get all characters for the current user.
 */
export function useCharacters(options?: UseCharactersOptions) {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: characterKeys.list(),
    queryFn: getCharacters,
    enabled,
  });
}

/**
 * Get a single character by ID.
 */
export function useCharacter(characterId: string | undefined) {
  return useQuery({
    queryKey: characterKeys.detail(characterId || ''),
    queryFn: () => getCharacter(characterId || ''),
    enabled: !!characterId,
  });
}

/**
 * Save character mutation.
 */
export function useSaveCharacter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Character> }) =>
      saveCharacter(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: characterKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
    },
  });
}

/**
 * Create character mutation.
 */
export function useCreateCharacter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Character>) => createCharacter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
    },
  });
}

/**
 * Delete character mutation.
 */
export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteCharacter(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: characterKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
    },
  });
}

/**
 * Duplicate character mutation.
 */
export function useDuplicateCharacter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => duplicateCharacter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
    },
  });
}
