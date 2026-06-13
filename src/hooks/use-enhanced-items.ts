/**
 * useEnhancedItems Hook
 * ======================
 * React Query hooks for user and official enhanced items.
 */

'use client';

import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import {
  getEnhancedItems,
  createEnhancedItem,
  deleteEnhancedItem,
  updateEnhancedItem,
} from '@/services/enhanced-items-service';
import type { UserEnhancedItem } from '@/types/crafting';
import { apiFetch } from '@/lib/api-client';

export type EnhancedItemsScope = 'user' | 'official';

export interface OfficialEnhancedItem {
  id: string;
  name: string;
  description?: string | null;
  currency_cost: number;
  rarity: string;
  base_item_source: string;
  base_item_id: string | null;
  base_item_name: string;
  base_item_description?: string | null;
  power_source: string;
  power_id: string;
  power_name: string;
  uses_type: string;
  uses_count: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>;
}

const OFFICIAL_API = '/api/official/enhanced-items';

export const enhancedItemsKeys = {
  all: (scope: EnhancedItemsScope) => ['enhanced-items', scope] as const,
  lists: (scope: EnhancedItemsScope) => [...enhancedItemsKeys.all(scope), 'list'] as const,
  list: (scope: EnhancedItemsScope) => enhancedItemsKeys.lists(scope),
};

async function fetchEnhancedItems(scope: EnhancedItemsScope) {
  if (scope === 'user') {
    return getEnhancedItems();
  }
  return apiFetch<OfficialEnhancedItem[]>(OFFICIAL_API);
}

export function useEnhancedItems(scope?: 'user'): UseQueryResult<UserEnhancedItem[], Error>;
export function useEnhancedItems(scope: 'official'): UseQueryResult<OfficialEnhancedItem[], Error>;
export function useEnhancedItems(scope: EnhancedItemsScope = 'user') {
  return useQuery({
    queryKey: enhancedItemsKeys.list(scope),
    queryFn: () => fetchEnhancedItems(scope),
  });
}

export function useOfficialEnhancedItems() {
  return useEnhancedItems('official');
}

export function useCreateEnhancedItem(scope: EnhancedItemsScope = 'user') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      body:
        | Omit<UserEnhancedItem, 'id' | 'createdAt' | 'updatedAt'>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        | Record<string, any>
    ) => {
      if (scope === 'user') {
        return createEnhancedItem(
          body as Omit<UserEnhancedItem, 'id' | 'createdAt' | 'updatedAt'>
        );
      }
      return apiFetch(OFFICIAL_API, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedItemsKeys.lists(scope) });
    },
  });
}

export function useCreateOfficialEnhancedItem() {
  return useCreateEnhancedItem('official');
}

export function useDeleteEnhancedItem(scope: EnhancedItemsScope = 'user') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (scope === 'user') {
        return deleteEnhancedItem(id);
      }
      return apiFetch(`${OFFICIAL_API}?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedItemsKeys.lists(scope) });
    },
  });
}

export function useDeleteOfficialEnhancedItem() {
  return useDeleteEnhancedItem('official');
}

export function useUpdateEnhancedItem(scope: EnhancedItemsScope = 'user') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: { potency?: number; name?: string } | Record<string, unknown>;
    }) => {
      if (scope === 'user') {
        return updateEnhancedItem(id, patch as { potency?: number; name?: string });
      }
      return apiFetch(`${OFFICIAL_API}?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedItemsKeys.lists(scope) });
    },
  });
}

export function useUpdateOfficialEnhancedItem() {
  return useUpdateEnhancedItem('official');
}
