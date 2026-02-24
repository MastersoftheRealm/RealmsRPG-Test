/**
 * Codex Hooks
 * ============
 * React Query hooks for codex/game reference data from Prisma (via API).
 * Replaces use-firestore-codex.
 */

'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchCodex } from '@/lib/api-client';

// Codex data rarely changes (admin-only edits) — cache aggressively
const DEFAULT_OPTIONS = {
  staleTime: 30 * 60 * 1000,  // 30 min (was 5 min)
  gcTime: 60 * 60 * 1000,     // 60 min (was 30 min)
  retry: 2,
  refetchOnWindowFocus: false,
};

/** Full codex response (all collections). Use for spreadsheet or multi-collection views. */
export function useCodexFull(): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>, Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    ...DEFAULT_OPTIONS,
  });
}

export function useCodexFeats(): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['feats'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.feats ?? [],
    ...DEFAULT_OPTIONS,
  });
}

export function useCodexSkills(): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['skills'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.skills ?? [],
    ...DEFAULT_OPTIONS,
  });
}

export function useCodexSpecies(): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['species'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.species ?? [],
    ...DEFAULT_OPTIONS,
  });
}

export function useCodexTraits(): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['traits'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.traits ?? [],
    ...DEFAULT_OPTIONS,
  });
}

export function useCodexPowerParts(): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['powerParts'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.powerParts ?? [],
    ...DEFAULT_OPTIONS,
  });
}

export function useCodexTechniqueParts(): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['techniqueParts'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.techniqueParts ?? [],
    ...DEFAULT_OPTIONS,
  });
}

export function useCodexParts(): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['parts'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.parts ?? [],
    ...DEFAULT_OPTIONS,
  });
}

export function useCodexItemProperties(): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['itemProperties'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.itemProperties ?? [],
    ...DEFAULT_OPTIONS,
  });
}

export function useCodexEquipment(): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['equipment'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.equipment ?? [],
    ...DEFAULT_OPTIONS,
  });
}

export function useCodexArchetypes(): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['archetypes'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.archetypes ?? [],
    ...DEFAULT_OPTIONS,
  });
}

export function useCodexCreatureFeats(): UseQueryResult<Awaited<ReturnType<typeof fetchCodex>>['creatureFeats'], Error> {
  return useQuery({
    queryKey: ['codex'],
    queryFn: fetchCodex,
    select: (data) => data.creatureFeats ?? [],
    ...DEFAULT_OPTIONS,
  });
}

// Single shared codex fetch for prefetch — avoids N full fetches when multiple slices are prefetched
let codexPrefetchPromise: Promise<Record<string, unknown>> | null = null;
function getCodexOnce(): Promise<Record<string, unknown>> {
  if (!codexPrefetchPromise) {
    codexPrefetchPromise = fetch('/api/codex').then((r) => r.json());
  }
  return codexPrefetchPromise;
}

/** Prefetch helpers (e.g. for loaders). All share one codex fetch — call multiple; only one request. */
export const prefetchFunctions = {
  feats: () => getCodexOnce().then((d) => (d.feats ?? []) as unknown[]),
  skills: () => getCodexOnce().then((d) => (d.skills ?? []) as unknown[]),
  species: () => getCodexOnce().then((d) => (d.species ?? []) as unknown[]),
  traits: () => getCodexOnce().then((d) => (d.traits ?? []) as unknown[]),
  powerParts: () => getCodexOnce().then((d) => (d.powerParts ?? []) as unknown[]),
  techniqueParts: () => getCodexOnce().then((d) => (d.techniqueParts ?? []) as unknown[]),
  parts: () => getCodexOnce().then((d) => (d.parts ?? []) as unknown[]),
  itemProperties: () => getCodexOnce().then((d) => (d.itemProperties ?? []) as unknown[]),
  equipment: () => getCodexOnce().then((d) => (d.equipment ?? []) as unknown[]),
  creatureFeats: () => getCodexOnce().then((d) => (d.creatureFeats ?? []) as unknown[]),
};
