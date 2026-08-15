/**
 * Codex Hooks
 * ===========
 * React Query hooks for codex/game reference data from Supabase (via /api/codex).
 *
 * Browse hooks fetch one collection (`['codex', <key>]` → `?collection=`); `useCodexFull`
 * keeps the whole payload on `['codex']` for admin/creator multi-collection views (TASK-775).
 * `['codex']` invalidation is a key prefix, so admin saves still refresh every slice.
 */

'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchCodex, fetchCodexCollection } from '@/lib/api-client';
import { selectPowerParts, selectTechniqueParts } from '@/lib/codex/part-type';
import type { CodexCollectionKey, CodexPayload, CodexPayloadKey } from '@/types/codex';

// Codex + official library APIs use Cache-Control: must-revalidate; keep client staleTime aligned (TASK-359).
const DEFAULT_OPTIONS = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: 2,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
};

export type CodexQueryOptions = { enabled?: boolean };

/** Query keys for `/api/codex`. Collection keys sit under `['codex']` so prefix invalidation covers them. */
export const codexKeys = {
  all: ['codex'] as const,
  collection: <K extends CodexPayloadKey>(collection: K) => ['codex', collection] as const,
};

function withCodexEnabled(options?: CodexQueryOptions) {
  return {
    ...DEFAULT_OPTIONS,
    enabled: options?.enabled ?? true,
  };
}

/** Stable empty array so a missing collection does not re-render every subscriber. */
const EMPTY_COLLECTION: readonly never[] = [];

function useCodexCollection<K extends CodexCollectionKey, TResult>(
  collection: K,
  select: (payload: Pick<CodexPayload, K>) => TResult,
  options?: CodexQueryOptions,
): UseQueryResult<TResult, Error> {
  return useQuery({
    queryKey: codexKeys.collection(collection),
    queryFn: () => fetchCodexCollection(collection),
    select,
    ...withCodexEnabled(options),
  });
}

function selectOwnCollection<K extends CodexCollectionKey>(collection: K) {
  return (payload: Pick<CodexPayload, K>): CodexPayload[K] =>
    payload[collection] ?? (EMPTY_COLLECTION as unknown as CodexPayload[K]);
}

const SELECT_FEATS = selectOwnCollection('feats');
const SELECT_SKILLS = selectOwnCollection('skills');
const SELECT_SPECIES = selectOwnCollection('species');
const SELECT_TRAITS = selectOwnCollection('traits');
const SELECT_PARTS = selectOwnCollection('parts');
const SELECT_ITEM_PROPERTIES = selectOwnCollection('itemProperties');
const SELECT_EQUIPMENT = selectOwnCollection('equipment');
const SELECT_ARCHETYPES = selectOwnCollection('archetypes');
const SELECT_CREATURE_FEATS = selectOwnCollection('creatureFeats');

const SELECT_POWER_PARTS = (payload: Pick<CodexPayload, 'parts'>): CodexPayload['powerParts'] =>
  selectPowerParts(payload.parts ?? []);
const SELECT_TECHNIQUE_PARTS = (
  payload: Pick<CodexPayload, 'parts'>,
): CodexPayload['techniqueParts'] => selectTechniqueParts(payload.parts ?? []);

/** Full codex response (all collections). Use for spreadsheet or multi-collection views. */
export function useCodexFull(options?: CodexQueryOptions): UseQueryResult<CodexPayload, Error> {
  return useQuery({
    queryKey: codexKeys.all,
    queryFn: fetchCodex,
    ...withCodexEnabled(options),
  });
}

export function useCodexFeats(
  options?: CodexQueryOptions,
): UseQueryResult<CodexPayload['feats'], Error> {
  return useCodexCollection('feats', SELECT_FEATS, options);
}

export function useCodexSkills(
  options?: CodexQueryOptions,
): UseQueryResult<CodexPayload['skills'], Error> {
  return useCodexCollection('skills', SELECT_SKILLS, options);
}

export function useCodexSpecies(
  options?: CodexQueryOptions,
): UseQueryResult<CodexPayload['species'], Error> {
  return useCodexCollection('species', SELECT_SPECIES, options);
}

export function useCodexTraits(
  options?: CodexQueryOptions,
): UseQueryResult<CodexPayload['traits'], Error> {
  return useCodexCollection('traits', SELECT_TRAITS, options);
}

/** Power and technique parts come from the same table — one `['codex', 'parts']` fetch serves both. */
export function useCodexPowerParts(
  options?: CodexQueryOptions,
): UseQueryResult<CodexPayload['powerParts'], Error> {
  return useCodexCollection('parts', SELECT_POWER_PARTS, options);
}

export function useCodexTechniqueParts(
  options?: CodexQueryOptions,
): UseQueryResult<CodexPayload['techniqueParts'], Error> {
  return useCodexCollection('parts', SELECT_TECHNIQUE_PARTS, options);
}

export function useCodexParts(
  options?: CodexQueryOptions,
): UseQueryResult<CodexPayload['parts'], Error> {
  return useCodexCollection('parts', SELECT_PARTS, options);
}

export function useCodexItemProperties(
  options?: CodexQueryOptions,
): UseQueryResult<CodexPayload['itemProperties'], Error> {
  return useCodexCollection('itemProperties', SELECT_ITEM_PROPERTIES, options);
}

export function useCodexEquipment(
  options?: CodexQueryOptions,
): UseQueryResult<CodexPayload['equipment'], Error> {
  return useCodexCollection('equipment', SELECT_EQUIPMENT, options);
}

export function useCodexArchetypes(
  options?: CodexQueryOptions,
): UseQueryResult<CodexPayload['archetypes'], Error> {
  return useCodexCollection('archetypes', SELECT_ARCHETYPES, options);
}

export function useCodexCreatureFeats(
  options?: CodexQueryOptions,
): UseQueryResult<CodexPayload['creatureFeats'], Error> {
  return useCodexCollection('creatureFeats', SELECT_CREATURE_FEATS, options);
}
