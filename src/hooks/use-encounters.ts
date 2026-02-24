/**
 * useEncounters Hook
 * ===================
 * React Query hooks for encounter data (Prisma persistence).
 * When user is not signed in, encounters use localStorage (guest mode).
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
import {
  getGuestEncountersList,
  getGuestEncounter,
  createGuestEncounter,
  saveGuestEncounter,
  deleteGuestEncounter,
  isGuestEncounterId,
} from '@/lib/guest-encounter-storage';
import { useAuth } from './use-auth';
import type { Encounter, EncounterSummary } from '@/types/encounter';

export const encounterKeys = {
  all: ['encounters'] as const,
  lists: () => [...encounterKeys.all, 'list'] as const,
  list: () => [...encounterKeys.lists()] as const,
  details: () => [...encounterKeys.all, 'detail'] as const,
  detail: (id: string) => [...encounterKeys.details(), id] as const,
};

/** List all encounters for current user (or guest list from localStorage) */
export function useEncounters() {
  const { user } = useAuth();
  return useQuery<EncounterSummary[], Error>({
    queryKey: [...encounterKeys.list(), user?.id ?? 'guest'],
    queryFn: () => (user ? getEncounters() : Promise.resolve(getGuestEncountersList())),
  });
}

/** Get a single encounter by ID (API or guest localStorage) */
export function useEncounter(encounterId: string | undefined) {
  const { user } = useAuth();
  return useQuery<Encounter | null, Error>({
    queryKey: encounterKeys.detail(encounterId || ''),
    queryFn: () => {
      if (!encounterId) return Promise.resolve(null);
      if (user) return getEncounter(encounterId);
      if (isGuestEncounterId(encounterId)) return Promise.resolve(getGuestEncounter(encounterId));
      return getEncounter(encounterId);
    },
    enabled: !!encounterId,
  });
}

/** Create a new encounter (API or guest localStorage) */
export function useCreateEncounter() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<string, Error, Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'>>({
    mutationFn: (data) =>
      user ? createEncounter(data) : Promise.resolve(createGuestEncounter(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: encounterKeys.lists() });
    },
  });
}

/** Save/update an existing encounter (API or guest localStorage) */
export function useSaveEncounter() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<
    void,
    Error,
    { id: string; data: Partial<Omit<Encounter, 'id' | 'createdAt'>> }
  >({
    mutationFn: ({ id, data }) => {
      if (user || !isGuestEncounterId(id)) return saveEncounter(id, data);
      saveGuestEncounter(id, data);
      return Promise.resolve();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: encounterKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: encounterKeys.lists() });
    },
  });
}

/** Delete an encounter (API or guest localStorage) */
export function useDeleteEncounter() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, string>({
    mutationFn: (id) => {
      if (user || !isGuestEncounterId(id)) return deleteEncounter(id);
      deleteGuestEncounter(id);
      return Promise.resolve();
    },
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
