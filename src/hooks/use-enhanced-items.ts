/**
 * useEnhancedItems Hook
 * ======================
 * React Query hooks for user enhanced items (saved from crafting).
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEnhancedItems,
  createEnhancedItem,
  deleteEnhancedItem,
  updateEnhancedItem,
} from '@/services/enhanced-items-service';
import type { UserEnhancedItem } from '@/types/crafting';

export const enhancedItemsKeys = {
  all: ['enhanced-items'] as const,
  lists: () => [...enhancedItemsKeys.all, 'list'] as const,
  list: () => [...enhancedItemsKeys.lists()] as const,
};

export function useEnhancedItems() {
  return useQuery<UserEnhancedItem[], Error>({
    queryKey: enhancedItemsKeys.list(),
    queryFn: getEnhancedItems,
  });
}

export function useCreateEnhancedItem() {
  const queryClient = useQueryClient();
  return useMutation<
    string,
    Error,
    Omit<UserEnhancedItem, 'id' | 'createdAt' | 'updatedAt'>
  >({
    mutationFn: createEnhancedItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedItemsKeys.lists() });
    },
  });
}

export function useDeleteEnhancedItem() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteEnhancedItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedItemsKeys.lists() });
    },
  });
}

export function useUpdateEnhancedItem() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { id: string; patch: { potency?: number; name?: string } }
  >({
    mutationFn: ({ id, patch }) => updateEnhancedItem(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedItemsKeys.lists() });
    },
  });
}
