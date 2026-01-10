/**
 * useGameData Hook
 * ==================
 * React Query hooks for game data (archetypes, skills, feats, etc.)
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getArchetypes,
  getArchetype,
  getSkills,
  getSkill,
  getFeats,
  getFeat,
  getAncestries,
  getAncestry,
  getGameData,
  getGameDataList,
} from '@/services/game-data-service';

/** Query keys for game data */
export const gameDataKeys = {
  all: ['gameData'] as const,
  archetypes: () => [...gameDataKeys.all, 'archetypes'] as const,
  archetype: (id: string) => [...gameDataKeys.archetypes(), id] as const,
  skills: () => [...gameDataKeys.all, 'skills'] as const,
  skill: (id: string) => [...gameDataKeys.skills(), id] as const,
  feats: () => [...gameDataKeys.all, 'feats'] as const,
  feat: (id: string) => [...gameDataKeys.feats(), id] as const,
  ancestries: () => [...gameDataKeys.all, 'ancestries'] as const,
  ancestry: (id: string) => [...gameDataKeys.ancestries(), id] as const,
  custom: (path: string) => [...gameDataKeys.all, 'custom', path] as const,
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

// =============================================================================
// Skills
// =============================================================================

export function useSkills() {
  return useQuery({
    queryKey: gameDataKeys.skills(),
    queryFn: getSkills,
    staleTime: 10 * 60 * 1000,
  });
}

export function useSkill(id: string | undefined) {
  return useQuery({
    queryKey: gameDataKeys.skill(id || ''),
    queryFn: () => getSkill(id || ''),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

// =============================================================================
// Feats
// =============================================================================

export function useFeats() {
  return useQuery({
    queryKey: gameDataKeys.feats(),
    queryFn: getFeats,
    staleTime: 10 * 60 * 1000,
  });
}

export function useFeat(id: string | undefined) {
  return useQuery({
    queryKey: gameDataKeys.feat(id || ''),
    queryFn: () => getFeat(id || ''),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

// =============================================================================
// Ancestries
// =============================================================================

export function useAncestries() {
  return useQuery({
    queryKey: gameDataKeys.ancestries(),
    queryFn: getAncestries,
    staleTime: 10 * 60 * 1000,
  });
}

export function useAncestry(id: string | undefined) {
  return useQuery({
    queryKey: gameDataKeys.ancestry(id || ''),
    queryFn: () => getAncestry(id || ''),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

// =============================================================================
// Generic Data
// =============================================================================

export function useGameData<T>(path: string) {
  return useQuery({
    queryKey: gameDataKeys.custom(path),
    queryFn: () => getGameData<T>(path),
    staleTime: 10 * 60 * 1000,
  });
}

export function useGameDataList<T extends { id?: string }>(path: string) {
  return useQuery({
    queryKey: gameDataKeys.custom(path),
    queryFn: () => getGameDataList<T>(path),
    staleTime: 10 * 60 * 1000,
  });
}
