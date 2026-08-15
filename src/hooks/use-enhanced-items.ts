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
import type {
  CreateOfficialEnhancedItemInput,
  OfficialEnhancedItem,
  OfficialEnhancedItemPayload,
  UserEnhancedItem,
} from '@/types/crafting';
import { apiFetch } from '@/lib/api-client';
import { userLibraryKeys } from '@/hooks/use-user-library';

export type EnhancedItemsScope = 'user' | 'official';

export type {
  OfficialEnhancedItem,
  OfficialEnhancedItemPayload,
  CreateOfficialEnhancedItemInput,
  UpdateOfficialEnhancedItemInput,
  EnhancedItemUsesType,
} from '@/types/crafting';

type UserEnhancedItemCreate = Omit<UserEnhancedItem, 'id' | 'createdAt' | 'updatedAt'>;
type UserEnhancedItemPatch = { potency?: number; name?: string };

const OFFICIAL_API = '/api/official/enhanced-items';

export const enhancedItemsKeys = {
  all: (scope: EnhancedItemsScope) => ['enhanced-items', scope] as const,
  lists: (scope: EnhancedItemsScope) => [...enhancedItemsKeys.all(scope), 'list'] as const,
  list: (scope: EnhancedItemsScope) => enhancedItemsKeys.lists(scope),
};

function normalizeOfficialRow(row: OfficialEnhancedItem): OfficialEnhancedItem {
  const payload = (row.payload ?? {}) as OfficialEnhancedItemPayload;
  return { ...row, payload };
}

async function fetchEnhancedItems(scope: EnhancedItemsScope) {
  if (scope === 'user') {
    return getEnhancedItems();
  }
  const rows = await apiFetch<OfficialEnhancedItem[]>(OFFICIAL_API);
  return rows.map(normalizeOfficialRow);
}

export function useEnhancedItems(
  scope?: 'user',
  options?: { enabled?: boolean },
): UseQueryResult<UserEnhancedItem[], Error>;
export function useEnhancedItems(
  scope: 'official',
  options?: { enabled?: boolean },
): UseQueryResult<OfficialEnhancedItem[], Error>;
export function useEnhancedItems(
  scope: EnhancedItemsScope = 'user',
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: enhancedItemsKeys.list(scope),
    queryFn: () => fetchEnhancedItems(scope),
    enabled: options?.enabled ?? true,
  });
}

/** Create a user library enhanced item (from crafting). */
export function useCreateEnhancedItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UserEnhancedItemCreate) => createEnhancedItem(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedItemsKeys.lists('user') });
      queryClient.invalidateQueries({ queryKey: userLibraryKeys.countsRoot });
    },
  });
}

/** Create an official enhanced item (admin Realms Library). */
export function useCreateOfficialEnhancedItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateOfficialEnhancedItemInput) =>
      apiFetch(OFFICIAL_API, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedItemsKeys.lists('official') });
    },
  });
}

export function useDeleteEnhancedItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEnhancedItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedItemsKeys.lists('user') });
      queryClient.invalidateQueries({ queryKey: userLibraryKeys.countsRoot });
    },
  });
}

export function useDeleteOfficialEnhancedItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`${OFFICIAL_API}?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedItemsKeys.lists('official') });
    },
  });
}

export function useUpdateEnhancedItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UserEnhancedItemPatch }) =>
      updateEnhancedItem(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedItemsKeys.lists('user') });
    },
  });
}
