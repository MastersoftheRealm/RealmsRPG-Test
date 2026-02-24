/**
 * useGameData Hook
 * ==================
 * useArchetype(id) — single archetype by id. Shares codex fetch (queryKey ['codex']).
 * useArchetypes: use CodexArchetypes from use-codex (re-exported in index).
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchCodex } from '@/lib/api-client';
import type { Archetype } from '@/types';

/** Query keys for game data */
export const gameDataKeys = {
  all: ['gameData'] as const,
  archetypes: () => [...gameDataKeys.all, 'archetypes'] as const,
  archetype: (id: string) => [...gameDataKeys.all, 'archetype', id] as const,
};

// =============================================================================
// Single archetype by id — shares codex fetch so no duplicate full codex request
// =============================================================================

export function useArchetype(id: string | undefined) {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => {
      const list = (data.archetypes ?? []) as Array<Record<string, unknown> & { id?: string }>;
      const found = list.find((a) => a.id === id);
      return found ? ({ ...found, id: found.id } as Archetype) : null;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}
