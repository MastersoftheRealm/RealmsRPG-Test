/**
 * Codex Hooks
 * ============
 * React Query hooks for codex/game reference data from Prisma (via API).
 * Replaces use-firestore-codex.
 */

'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';

const DEFAULT_OPTIONS = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: 2,
  refetchOnWindowFocus: false,
};

async function fetchCodex() {
  const res = await fetch('/api/codex');
  if (!res.ok) throw new Error('Failed to fetch codex');
  return res.json();
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

export const prefetchFunctions = {
  feats: () => fetch('/api/codex').then((r) => r.json()).then((d) => d.feats ?? []),
  skills: () => fetch('/api/codex').then((r) => r.json()).then((d) => d.skills ?? []),
  species: () => fetch('/api/codex').then((r) => r.json()).then((d) => d.species ?? []),
  traits: () => fetch('/api/codex').then((r) => r.json()).then((d) => d.traits ?? []),
  powerParts: () => fetch('/api/codex').then((r) => r.json()).then((d) => d.powerParts ?? []),
  techniqueParts: () => fetch('/api/codex').then((r) => r.json()).then((d) => d.techniqueParts ?? []),
  parts: () => fetch('/api/codex').then((r) => r.json()).then((d) => d.parts ?? []),
  itemProperties: () => fetch('/api/codex').then((r) => r.json()).then((d) => d.itemProperties ?? []),
  equipment: () => fetch('/api/codex').then((r) => r.json()).then((d) => d.equipment ?? []),
  creatureFeats: () => fetch('/api/codex').then((r) => r.json()).then((d) => d.creatureFeats ?? []),
};
