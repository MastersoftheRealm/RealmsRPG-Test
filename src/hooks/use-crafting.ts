/**
 * useCrafting Hook
 * ================
 * React Query hooks for crafting session data (Supabase).
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCraftingSessions,
  getCraftingSession,
  createCraftingSession,
  saveCraftingSession,
  deleteCraftingSession,
} from '@/services/crafting-service';
import type {
  CraftingSession,
  CraftingSessionSummary,
  CraftingSessionData,
} from '@/types/crafting';

export const craftingKeys = {
  all: ['crafting'] as const,
  lists: () => [...craftingKeys.all, 'list'] as const,
  list: () => [...craftingKeys.lists()] as const,
  details: () => [...craftingKeys.all, 'detail'] as const,
  detail: (id: string) => [...craftingKeys.details(), id] as const,
};

export function useCraftingSessions() {
  return useQuery<CraftingSessionSummary[], Error>({
    queryKey: craftingKeys.list(),
    queryFn: getCraftingSessions,
  });
}

export function useCraftingSession(sessionId: string | undefined) {
  return useQuery<CraftingSession | null, Error>({
    queryKey: craftingKeys.detail(sessionId || ''),
    queryFn: () => (sessionId ? getCraftingSession(sessionId) : Promise.resolve(null)),
    enabled: !!sessionId,
  });
}

export function useCreateCraftingSession() {
  const queryClient = useQueryClient();
  return useMutation<string, Error, CraftingSessionData>({
    mutationFn: createCraftingSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: craftingKeys.lists() });
    },
  });
}

export function useSaveCraftingSession() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { id: string; data: Partial<CraftingSessionData> }
  >({
    mutationFn: ({ id, data }) => saveCraftingSession(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: craftingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: craftingKeys.lists() });
    },
  });
}

export function useDeleteCraftingSession() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteCraftingSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: craftingKeys.lists() });
    },
  });
}
