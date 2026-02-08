/**
 * Public Library Hook
 * ===================
 * Fetches public library items (no auth). Used for Codex public tab and add-to-library flows.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPublicLibrary, addPublicItemToLibrary } from '@/services/library-service';

const PUBLIC_LIBRARY_KEYS = {
  all: ['public-library'] as const,
  byType: (type: string) => ['public-library', type] as const,
};

export function usePublicLibrary(type: 'powers' | 'techniques' | 'items' | 'creatures') {
  return useQuery({
    queryKey: PUBLIC_LIBRARY_KEYS.byType(type),
    queryFn: () => fetchPublicLibrary(type),
  });
}

const USER_LIBRARY_KEY_MAP: Record<string, string> = {
  powers: 'user-powers',
  techniques: 'user-techniques',
  items: 'user-items',
  creatures: 'user-creatures',
};

export function useAddPublicToLibrary(type: 'powers' | 'techniques' | 'items' | 'creatures') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicItem: Record<string, unknown>) => addPublicItemToLibrary(type, publicItem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PUBLIC_LIBRARY_KEYS.byType(type) });
      queryClient.invalidateQueries({ queryKey: [USER_LIBRARY_KEY_MAP[type]] });
    },
  });
}
