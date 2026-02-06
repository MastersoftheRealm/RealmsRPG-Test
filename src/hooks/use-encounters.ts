/**
 * useEncounters Hook
 * ===================
 * React Query hooks for encounter data (Firestore persistence).
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEncounters,
  getEncounter,
  createEncounter,
  saveEncounter,
  deleteEncounter,
} from '@/services/encounter-service';
import type { Encounter, EncounterSummary } from '@/types/encounter';

export const encounterKeys = {
  all: ['encounters'] as const,
  lists: () => [...encounterKeys.all, 'list'] as const,
  list: () => [...encounterKeys.lists()] as const,
  details: () => [...encounterKeys.all, 'detail'] as const,
  detail: (id: string) => [...encounterKeys.details(), id] as const,
};

/** List all encounters for current user */
export function useEncounters() {
  return useQuery<EncounterSummary[], Error>({
    queryKey: encounterKeys.list(),
    queryFn: getEncounters,
  });
}

/** Get a single encounter by ID */
export function useEncounter(encounterId: string | undefined) {
  return useQuery<Encounter | null, Error>({
    queryKey: encounterKeys.detail(encounterId || ''),
    queryFn: () => getEncounter(encounterId!),
    enabled: !!encounterId,
  });
}

/** Create a new encounter */
export function useCreateEncounter() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'>>({
    mutationFn: createEncounter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: encounterKeys.lists() });
    },
  });
}

/** Save/update an existing encounter */
export function useSaveEncounter() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { id: string; data: Partial<Omit<Encounter, 'id' | 'createdAt'>> }
  >({
    mutationFn: ({ id, data }) => saveEncounter(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: encounterKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: encounterKeys.lists() });
    },
  });
}

/** Delete an encounter */
export function useDeleteEncounter() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteEncounter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: encounterKeys.lists() });
    },
  });
}

/** Invalidate all encounter queries */
export function useInvalidateEncounters() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: encounterKeys.all });
  };
}
