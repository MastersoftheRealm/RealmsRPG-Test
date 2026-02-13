/**
 * useGameData Hook
 * ==================
 * React Query hooks for game data (archetypes).
 *
 * NOTE: Legacy hooks for skills, feats, ancestries have been removed
 * (2026-02-13 audit). Use useCodexSkills, useCodexFeats, etc. from
 * use-codex.ts instead. Only useArchetypes remains until migrated.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { getArchetypes, getArchetype } from '@/services/game-data-service';

/** Query keys for game data */
export const gameDataKeys = {
  all: ['gameData'] as const,
  archetypes: () => [...gameDataKeys.all, 'archetypes'] as const,
  archetype: (id: string) => [...gameDataKeys.archetypes(), id] as const,
};

// =============================================================================
// Archetypes
// =============================================================================

export function useArchetypes() {
  return useQuery({
    queryKey: gameDataKeys.archetypes(),
    queryFn: getArchetypes,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useArchetype(id: string | undefined) {
  return useQuery({
    queryKey: gameDataKeys.archetype(id || ''),
    queryFn: () => getArchetype(id || ''),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}
