/**
 * Firestore Codex Hooks
 * =====================
 * React Query hooks for codex/game reference data from Firestore.
 * Replaces RTDB for codex data after migration (TASK-118).
 * Returns same shapes as use-rtdb for drop-in replacement.
 */

'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { collection, getDocs, DocumentData } from 'firebase/firestore';
import { db, waitForFirebase } from '@/lib/firebase/client';

// =============================================================================
// Firestore Fetch Helpers
// =============================================================================

async function fetchFirestoreCollection<T>(
  collectionName: string,
  transform: (id: string, data: DocumentData) => T
): Promise<T[]> {
  await waitForFirebase();
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((doc) => transform(doc.id, doc.data()));
}

function toStrArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function toNumArray(val: unknown): number[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(Number);
  if (typeof val === 'number') return [val];
  if (typeof val === 'string') return val.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
  return [];
}

// =============================================================================
// Fetch Functions (mirror use-rtdb shapes)
// =============================================================================

async function fetchFeats() {
  return fetchFirestoreCollection('codex_feats', (id, d) => ({
    id,
    name: (d.name as string) || '',
    description: (d.description as string) || '',
    category: (d.category as string) || '',
    ability: d.ability as string | undefined,
    ability_req: toStrArray(d.ability_req),
    abil_req_val: toNumArray(d.abil_req_val),
    tags: toStrArray(d.tags),
    skill_req: toStrArray(d.skill_req),
    skill_req_val: toNumArray(d.skill_req_val),
    lvl_req: parseInt(d.lvl_req as string) || 0,
    uses_per_rec: parseInt(d.uses_per_rec as string) || 0,
    mart_abil_req: d.mart_abil_req as string | undefined,
    char_feat: Boolean(d.char_feat),
    state_feat: Boolean(d.state_feat),
    rec_period: d.rec_period as string | undefined,
    prereq_text: d.prereq_text as string | undefined,
  }));
}

async function fetchSkills() {
  return fetchFirestoreCollection('codex_skills', (id, d) => {
    let ability = '';
    if (Array.isArray(d.ability)) {
      ability = (d.ability as string[]).join(', ');
    } else if (typeof d.ability === 'string') {
      ability = d.ability;
    }
    const baseSkillId =
      typeof d.base_skill_id === 'number'
        ? d.base_skill_id
        : typeof d.base_skill_id === 'string' && d.base_skill_id !== ''
          ? parseInt(d.base_skill_id, 10)
          : undefined;
    return {
      id,
      name: (d.name as string) || '',
      description: (d.description as string) || '',
      ability,
      category: (d.category as string) || '',
      base_skill_id: !isNaN(baseSkillId as number) ? baseSkillId : undefined,
      trained_only: d.trained_only === true || d.trained_only === 'true',
    };
  });
}

async function fetchSpecies() {
  return fetchFirestoreCollection('codex_species', (id, d) => {
    let sizes: string[] = [];
    if (typeof d.sizes === 'string') {
      sizes = d.sizes.split(',').map((s: string) => s.trim());
    } else if (Array.isArray(d.sizes)) {
      sizes = d.sizes;
    }
    return {
      id,
      name: (d.name as string) || '',
      description: (d.description as string) || '',
      type: (d.type as string) || '',
      size: sizes[0] || 'Medium',
      sizes,
      speed: parseInt(d.speed as string) || 6,
      traits: toStrArray(d.traits),
      species_traits: toStrArray(d.species_traits),
      ancestry_traits: toStrArray(d.ancestry_traits),
      flaws: toStrArray(d.flaws),
      characteristics: toStrArray(d.characteristics),
      skills: toStrArray(d.skills),
      languages: toStrArray(d.languages),
      ability_bonuses: d.ability_bonuses as Record<string, number> | undefined,
      ave_height: d.ave_height as number | undefined,
      ave_weight: d.ave_weight as number | undefined,
      adulthood_lifespan: d.adulthood_lifespan as number[] | undefined,
    };
  });
}

async function fetchTraits() {
  return fetchFirestoreCollection('codex_traits', (id, d) => ({
    id,
    name: (d.name as string) || '',
    description: (d.description as string) || '',
    species: toStrArray(d.species),
    uses_per_rec: d.uses_per_rec as number | undefined,
    rec_period: d.rec_period as string | undefined,
  }));
}

async function fetchPowerParts() {
  const all = await fetchFirestoreCollection('codex_parts', (id, d) => {
    const type = (d.type as string) || 'power';
    return {
      id,
      name: (d.name as string) || '',
      description: (d.description as string) || '',
      category: (d.category as string) || '',
      type,
    base_en: parseFloat(d.base_en as string) || 0,
    base_tp: parseFloat(d.base_tp as string) || 0,
    op_1_desc: d.op_1_desc as string | undefined,
    op_1_en: parseFloat(d.op_1_en as string) || 0,
    op_1_tp: parseFloat(d.op_1_tp as string) || 0,
    op_2_desc: d.op_2_desc as string | undefined,
    op_2_en: parseFloat(d.op_2_en as string) || 0,
    op_2_tp: parseFloat(d.op_2_tp as string) || 0,
    op_3_desc: d.op_3_desc as string | undefined,
    op_3_en: parseFloat(d.op_3_en as string) || 0,
    op_3_tp: parseFloat(d.op_3_tp as string) || 0,
    mechanic: Boolean(d.mechanic),
    duration: Boolean(d.duration),
    percentage: Boolean(d.percentage),
  };
  });
  return all.filter((p) => (p.type || 'power').toLowerCase() === 'power');
}

async function fetchTechniqueParts() {
  const all = await fetchFirestoreCollection('codex_parts', (id, d) => ({
    id,
    name: (d.name as string) || '',
    description: (d.description as string) || '',
    category: (d.category as string) || '',
    type: (d.type as string) || 'technique',
    base_tp: parseFloat(d.base_tp as string) || 0,
    base_stam: parseFloat(d.base_stam as string) || 0,
    base_en: parseFloat(d.base_en as string) || 0,
    op_1_desc: d.op_1_desc as string | undefined,
    op_1_en: parseFloat(d.op_1_en as string) || 0,
    op_1_tp: parseFloat(d.op_1_tp as string) || 0,
    op_2_desc: d.op_2_desc as string | undefined,
    op_2_en: parseFloat(d.op_2_en as string) || 0,
    op_2_tp: parseFloat(d.op_2_tp as string) || 0,
    op_3_desc: d.op_3_desc as string | undefined,
    op_3_en: parseFloat(d.op_3_en as string) || 0,
    op_3_tp: parseFloat(d.op_3_tp as string) || 0,
    percentage: Boolean(d.percentage),
    mechanic: Boolean(d.mechanic),
  }));
  return all.filter((p) => (p.type || 'technique').toLowerCase() === 'technique');
}

async function fetchParts() {
  return fetchFirestoreCollection('codex_parts', (id, d) => ({
    id,
    name: (d.name as string) || '',
    description: (d.description as string) || '',
    category: (d.category as string) || '',
    type: ((d.type as string)?.toLowerCase() || 'power') as 'power' | 'technique',
    base_en: parseFloat(d.base_en as string) || 0,
    base_tp: parseFloat(d.base_tp as string) || 0,
    op_1_desc: d.op_1_desc as string | undefined,
    op_1_en: parseFloat(d.op_1_en as string) || 0,
    op_1_tp: parseFloat(d.op_1_tp as string) || 0,
    op_2_desc: d.op_2_desc as string | undefined,
    op_2_en: parseFloat(d.op_2_en as string) || 0,
    op_2_tp: parseFloat(d.op_2_tp as string) || 0,
    op_3_desc: d.op_3_desc as string | undefined,
    op_3_en: parseFloat(d.op_3_en as string) || 0,
    op_3_tp: parseFloat(d.op_3_tp as string) || 0,
    percentage: d.percentage === true || d.percentage === 'true',
    mechanic: d.mechanic === true || d.mechanic === 'true',
  }));
}

async function fetchItemProperties() {
  return fetchFirestoreCollection('codex_properties', (id, d) => ({
    id,
    name: (d.name as string) || '',
    description: (d.description as string) || '',
    type: ((d.type as string) || 'general') as 'weapon' | 'armor' | 'shield' | 'general',
    tp_cost: parseFloat(d.tp_cost as string) || 0,
    gold_cost: parseFloat(d.gold_cost as string) || 0,
    base_ip: parseFloat(d.base_ip as string) || 0,
    base_tp: parseFloat(d.base_tp as string) || 0,
    base_c: parseFloat(d.base_c as string) || 0,
    op_1_desc: d.op_1_desc as string | undefined,
    op_1_ip: parseFloat(d.op_1_ip as string) || 0,
    op_1_tp: parseFloat(d.op_1_tp as string) || 0,
    op_1_c: parseFloat(d.op_1_c as string) || 0,
  }));
}

async function fetchEquipment() {
  return fetchFirestoreCollection('codex_equipment', (id, d) => ({
    id,
    name: (d.name as string) || '',
    type: ((d.type as string) || 'equipment') as 'weapon' | 'armor' | 'equipment',
    subtype: d.subtype as string | undefined,
    category: d.category as string | undefined,
    description: (d.description as string) || '',
    damage: d.damage as string | undefined,
    armor_value: d.armor_value != null ? parseInt(d.armor_value as string) : undefined,
    gold_cost: parseFloat(d.gold_cost as string) || 0,
    currency: parseFloat(d.currency as string) || parseFloat(d.gold_cost as string) || 0,
    properties: toStrArray(d.properties),
    rarity: d.rarity as string | undefined,
    weight: d.weight != null ? parseFloat(d.weight as string) : undefined,
  }));
}

async function fetchCreatureFeats() {
  return fetchFirestoreCollection('codex_creature_feats', (id, d) => ({
    id,
    name: (d.name as string) || '',
    description: (d.description as string) || '',
    points: Number(d.points ?? d.feat_points ?? d.cost ?? 0),
    tiers: d.tiers ? Number(d.tiers) : undefined,
    prereqs: toStrArray(d.prereqs),
  }));
}

// =============================================================================
// React Query Hooks
// =============================================================================

const DEFAULT_OPTIONS = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: 2,
  refetchOnWindowFocus: false,
};

export function useCodexFeats(): UseQueryResult<Awaited<ReturnType<typeof fetchFeats>>[number][], Error> {
  return useQuery({ queryKey: ['codex', 'feats'], queryFn: fetchFeats, ...DEFAULT_OPTIONS });
}

export function useCodexSkills(): UseQueryResult<Awaited<ReturnType<typeof fetchSkills>>[number][], Error> {
  return useQuery({ queryKey: ['codex', 'skills'], queryFn: fetchSkills, ...DEFAULT_OPTIONS });
}

export function useCodexSpecies(): UseQueryResult<Awaited<ReturnType<typeof fetchSpecies>>[number][], Error> {
  return useQuery({ queryKey: ['codex', 'species'], queryFn: fetchSpecies, ...DEFAULT_OPTIONS });
}

export function useCodexTraits(): UseQueryResult<Awaited<ReturnType<typeof fetchTraits>>[number][], Error> {
  return useQuery({ queryKey: ['codex', 'traits'], queryFn: fetchTraits, ...DEFAULT_OPTIONS });
}

export function useCodexPowerParts(): UseQueryResult<Awaited<ReturnType<typeof fetchPowerParts>>[number][], Error> {
  return useQuery({ queryKey: ['codex', 'power-parts'], queryFn: fetchPowerParts, ...DEFAULT_OPTIONS });
}

export function useCodexTechniqueParts(): UseQueryResult<
  Awaited<ReturnType<typeof fetchTechniqueParts>>[number][],
  Error
> {
  return useQuery({ queryKey: ['codex', 'technique-parts'], queryFn: fetchTechniqueParts, ...DEFAULT_OPTIONS });
}

export function useCodexParts(): UseQueryResult<Awaited<ReturnType<typeof fetchParts>>[number][], Error> {
  return useQuery({ queryKey: ['codex', 'parts'], queryFn: fetchParts, ...DEFAULT_OPTIONS });
}

export function useCodexItemProperties(): UseQueryResult<
  Awaited<ReturnType<typeof fetchItemProperties>>[number][],
  Error
> {
  return useQuery({ queryKey: ['codex', 'properties'], queryFn: fetchItemProperties, ...DEFAULT_OPTIONS });
}

export function useCodexEquipment(): UseQueryResult<Awaited<ReturnType<typeof fetchEquipment>>[number][], Error> {
  return useQuery({ queryKey: ['codex', 'equipment'], queryFn: fetchEquipment, ...DEFAULT_OPTIONS });
}

export function useCodexCreatureFeats(): UseQueryResult<
  Awaited<ReturnType<typeof fetchCreatureFeats>>[number][],
  Error
> {
  return useQuery({ queryKey: ['codex', 'creature-feats'], queryFn: fetchCreatureFeats, ...DEFAULT_OPTIONS });
}

// Prefetch functions for SSR or preloading
export const prefetchFunctions = {
  feats: fetchFeats,
  skills: fetchSkills,
  species: fetchSpecies,
  traits: fetchTraits,
  powerParts: fetchPowerParts,
  techniqueParts: fetchTechniqueParts,
  parts: fetchParts,
  itemProperties: fetchItemProperties,
  equipment: fetchEquipment,
  creatureFeats: fetchCreatureFeats,
};
