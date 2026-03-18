'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

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

const KEY = ['official-library', 'enhanced'] as const;

export function useOfficialEnhancedItems() {
  return useQuery<OfficialEnhancedItem[], Error>({
    queryKey: KEY,
    queryFn: () => apiFetch<OfficialEnhancedItem[]>('/api/official/enhanced-items'),
  });
}

export function useCreateOfficialEnhancedItem() {
  const qc = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (body: any) =>
      apiFetch('/api/official/enhanced-items', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useDeleteOfficialEnhancedItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/official/enhanced-items?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useUpdateOfficialEnhancedItem() {
  const qc = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: ({ id, patch }: { id: string; patch: any }) =>
      apiFetch(`/api/official/enhanced-items?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

