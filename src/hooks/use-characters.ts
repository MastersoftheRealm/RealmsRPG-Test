/**
 * useCharacters Hook
 * ====================
 * React Query hooks for character data
 */

'use client';

import type { QueryClient } from '@tanstack/react-query';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SetStateAction } from 'react';
import {
  getCharacters,
  getCharacter,
  saveCharacterWithConflictRetry,
  createCharacter,
  deleteCharacter,
  duplicateCharacter,
  type GetCharacterResult,
} from '@/services/character-service';
import { useAuthStore } from '@/stores/auth-store';
import type { Character } from '@/types';

/** Viewer segment for `characterKeys` (ADR-0013 / TASK-741). */
export function characterViewerId(userId?: string | null): string {
  return userId?.trim() || 'anon';
}

/** Query keys for character data — scoped by viewer (ADR-0013 / TASK-741). */
export const characterKeys = {
  all: ['characters'] as const,
  lists: (userId: string) => [...characterKeys.all, 'list', characterViewerId(userId)] as const,
  list: (userId: string) => [...characterKeys.lists(userId)] as const,
  details: (userId: string) => [...characterKeys.all, 'detail', characterViewerId(userId)] as const,
  detail: (userId: string, id: string) => [...characterKeys.details(userId), id] as const,
};

/** Apply a sheet `setCharacter` update onto the detail cache entry. */
export function nextCharacterDetailQueryData(
  prev: GetCharacterResult | undefined,
  update: SetStateAction<Character | null>,
): GetCharacterResult {
  const prevChar = prev?.character ?? null;
  const nextChar = typeof update === 'function' ? update(prevChar) : update;
  return {
    character: nextChar,
    libraryForView: prev?.libraryForView,
    ...(prev?.enrichment ? { enrichment: prev.enrichment } : {}),
  };
}

/** Shallow-merge saved/dirty keys into a cached character (library-add, lock token). */
export function mergeCharacterDetailQueryData(
  prev: GetCharacterResult | undefined,
  patch: Partial<Character>,
): GetCharacterResult | undefined {
  if (!prev?.character) return prev;
  return {
    ...prev,
    character: { ...prev.character, ...patch },
  };
}

/** Sheet `setCharacter` — writes `characterKeys.detail` (TASK-750). */
export function patchCharacterDetailQuery(
  queryClient: QueryClient,
  userId: string,
  characterId: string,
  update: SetStateAction<Character | null>,
): void {
  queryClient.setQueryData<GetCharacterResult>(characterKeys.detail(userId, characterId), (prev) =>
    nextCharacterDetailQueryData(prev, update),
  );
}

export interface UseCharactersOptions {
  /** When false, the query does not run (e.g. when user is not signed in). */
  enabled?: boolean | undefined;
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

export interface UseCharacterOptions {
  /** Sheet passes false so a focus refetch cannot clobber unsaved setQueryData edits. */
  refetchOnWindowFocus?: boolean | undefined;
}

/**
 * Get a single character by ID.
 * Query data is `GetCharacterResult` (character + optional libraryForView).
 */
export function useCharacter(characterId: string | undefined, options?: UseCharacterOptions) {
  const { user, loading: authLoading } = useAuthStore();
  const userId = characterViewerId(user?.uid);
  return useQuery({
    queryKey: characterKeys.detail(userId, characterId || ''),
    queryFn: () => getCharacter(characterId || ''),
    enabled: !!characterId && !authLoading,
    ...(options?.refetchOnWindowFocus !== undefined
      ? { refetchOnWindowFocus: options.refetchOnWindowFocus }
      : {}),
  });
}

/**
 * Save character mutation — dirty-key PATCH + `updatedAt` lock.
 * 409 refetches and retries once (`saveCharacterWithConflictRetry`, ADR-0013 / TASK-746).
 * Pass `mergeOnConflict` to re-apply a local operation onto the remote document
 * (library add); default retries the same dirty keys with the remote token.
 * Success merges `applied` (the body that persisted, including a 409 retry) +
 * `updatedAt` into `characterKeys.detail` (TASK-750) and invalidates the list —
 * not the detail query, so sheet `setQueryData` edits survive.
 */
export function useSaveCharacter() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = characterViewerId(user?.uid);

  return useMutation({
    mutationFn: ({
      id,
      data,
      updatedAt,
      mergeOnConflict,
    }: {
      id: string;
      data: Partial<Character>;
      updatedAt?: string | Date | null | undefined;
      mergeOnConflict?: (remote: Character) => {
        dirty: Partial<Character>;
        updatedAt?: string | Date | null | undefined;
      };
    }) =>
      saveCharacterWithConflictRetry(id, data, {
        updatedAt: updatedAt ?? data.updatedAt,
        mergeOnConflict:
          mergeOnConflict ??
          ((remote) => ({
            dirty: data,
            updatedAt: remote.updatedAt,
          })),
      }),
    onSuccess: (result, { id }) => {
      queryClient.setQueryData<GetCharacterResult>(characterKeys.detail(userId, id), (prev) =>
        mergeCharacterDetailQueryData(prev, {
          ...result.applied,
          ...(result.updatedAt ? { updatedAt: result.updatedAt } : {}),
        }),
      );
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
  const userId = characterViewerId(user?.uid);

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
  const userId = characterViewerId(user?.uid);

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
  const userId = characterViewerId(user?.uid);

  return useMutation({
    mutationFn: (id: string) => duplicateCharacter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.lists(userId) });
    },
  });
}
