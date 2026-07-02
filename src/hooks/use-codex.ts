/**
 * Codex Hooks
 * ============
 * React Query hooks for codex/game reference data from Supabase (via /api/codex).
 */

'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchCodex } from '@/lib/api-client';

// Codex + official library APIs use Cache-Control: must-revalidate; keep client staleTime aligned (TASK-359).
const DEFAULT_OPTIONS = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: 2,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
};

export type CodexQueryOptions = { enabled?: boolean };

function withCodexEnabled(options?: CodexQueryOptions) {
  return {
    ...DEFAULT_OPTIONS,
    enabled: options?.enabled ?? true,
  };
}

/** Full codex response (all collections). Use for spreadsheet or multi-collection views. */
export function useCodexFull(options?: CodexQueryOptions): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>, Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    ...withCodexEnabled(options),
  });
}

export function useCodexFeats(options?: CodexQueryOptions): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['feats'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.feats ?? [],
    ...withCodexEnabled(options),
  });
}

export function useCodexSkills(options?: CodexQueryOptions): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['skills'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.skills ?? [],
    ...withCodexEnabled(options),
  });
}

export function useCodexSpecies(options?: CodexQueryOptions): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['species'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.species ?? [],
    ...withCodexEnabled(options),
  });
}

export function useCodexTraits(options?: CodexQueryOptions): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['traits'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.traits ?? [],
    ...withCodexEnabled(options),
  });
}

export function useCodexPowerParts(options?: CodexQueryOptions): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['powerParts'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.powerParts ?? [],
    ...withCodexEnabled(options),
  });
}

export function useCodexTechniqueParts(options?: CodexQueryOptions): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['techniqueParts'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.techniqueParts ?? [],
    ...withCodexEnabled(options),
  });
}

export function useCodexParts(options?: CodexQueryOptions): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['parts'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.parts ?? [],
    ...withCodexEnabled(options),
  });
}

export function useCodexItemProperties(options?: CodexQueryOptions): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['itemProperties'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.itemProperties ?? [],
    ...withCodexEnabled(options),
  });
}

export function useCodexEquipment(options?: CodexQueryOptions): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['equipment'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.equipment ?? [],
    ...withCodexEnabled(options),
  });
}

export function useCodexArchetypes(options?: CodexQueryOptions): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['archetypes'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.archetypes ?? [],
    ...withCodexEnabled(options),
  });
}

export function useCodexCreatureFeats(options?: CodexQueryOptions): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['creatureFeats'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.creatureFeats ?? [],
    ...withCodexEnabled(options),
  });
}
