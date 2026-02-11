/**
 * Codex Utilities & Types
 * ========================
 * Trait/skill resolution and shared types. Data from use-codex (Prisma).
 * Legacy file name (use-rtdb.ts) retained for import compatibility.
 */

'use client';

import { useCodexTraits, useCodexSkills } from './use-codex';
import { useMemo } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface PowerPart {
  id: string;
  name: string;
  description: string;
  category: string;
  base_en: number;
  base_tp: number;
  op_1_desc?: string;
  op_1_en?: number;
  op_1_tp?: number;
  op_2_desc?: string;
  op_2_en?: number;
  op_2_tp?: number;
  op_3_desc?: string;
  op_3_en?: number;
  op_3_tp?: number;
  duration?: boolean;
  percentage?: boolean;
  mechanic?: boolean;
}

export interface TechniquePart {
  id: string;
  name: string;
  description: string;
  category: string;
  base_tp: number;
  base_stam: number;
  base_en?: number;
  op_1_desc?: string;
  op_1_en?: number;
  op_1_tp?: number;
  op_2_desc?: string;
  op_2_en?: number;
  op_2_tp?: number;
  op_3_desc?: string;
  op_3_en?: number;
  op_3_tp?: number;
  percentage?: boolean;
  mechanic?: boolean;
}

export type Part = PowerPart & { type: 'power' | 'technique' };

export interface ItemProperty {
  id: string;
  name: string;
  description: string;
  type?: 'weapon' | 'armor' | 'shield' | 'general';
  tp_cost?: number;
  gold_cost?: number;
  base_ip?: number;
  base_tp?: number;
  base_c?: number;
  op_1_desc?: string;
  op_1_ip?: number;
  op_1_tp?: number;
  op_1_c?: number;
  mechanic?: boolean;
}

export interface Feat {
  id: string;
  name: string;
  description: string;
  category: string;
  // May be a single ability/defense or multiple (see CODEX_SCHEMA_REFERENCE ability field)
  ability?: string | string[];
  ability_req: string[];
  abil_req_val: number[];
  tags: string[];
  skill_req: string[];
  skill_req_val: number[];
  lvl_req: number;
  uses_per_rec: number;
  mart_abil_req?: string;
  char_feat: boolean;
  state_feat: boolean;
  rec_period?: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  ability: string;
  base_skill_id?: number;
}

export interface Species {
  id: string;
  name: string;
  description: string;
  type: string;
  size: string;
  sizes: string[];
  speed: number;
  traits: string[];
  species_traits: string[];
  ancestry_traits: string[];
  flaws: string[];
  characteristics: string[];
  skills: string[];
  languages: string[];
  ability_bonuses?: Record<string, number>;
  ave_height?: number;
  ave_weight?: number;
  adulthood_lifespan?: number[];
}

export interface Trait {
  id: string;
  name: string;
  description: string;
  species?: string[];
  uses_per_rec?: number;
  rec_period?: string;
   /** True if this trait is a flaw (schema: codex_traits.flaw) */
  flaw?: boolean;
  /** True if this trait is a characteristic (schema: codex_traits.characteristic) */
  characteristic?: boolean;
}

export interface EquipmentItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'equipment';
  subtype?: string;
  category?: string;
  description: string;
  damage?: string;
  armor_value?: number;
  gold_cost: number;
  currency: number;
  properties: string[];
  rarity?: string;
  weight?: number;
}

export interface CreatureFeat {
  id: string;
  name: string;
  description: string;
  /** Creature feat point cost (schema: feat_points) */
  points: number;
  /** Feat level / tier (schema: feat_lvl) */
  feat_lvl?: number;
  /** Required creature level (schema: lvl_req) */
  lvl_req?: number;
  /** Mechanic-only flag (schema: mechanic) */
  mechanic?: boolean;
  tiers?: number;
  prereqs?: string[];
}

// =============================================================================
// Trait Resolution Utilities
// =============================================================================

export function findTraitByIdOrName(traits: Trait[], lookup: string | number): Trait | undefined {
  if (!traits || !lookup) return undefined;
  const lookupStr = String(lookup);
  const byId = traits.find((t) => t.id === lookupStr);
  if (byId) return byId;
  const byNumericId = traits.find((t) => String(t.id) === lookupStr);
  if (byNumericId) return byNumericId;
  const lowerLookup = lookupStr.toLowerCase();
  const byName = traits.find((t) => String(t.name ?? '').toLowerCase() === lowerLookup);
  if (byName) return byName;
  const sanitizedLookup = lookupStr.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
  const bySanitizedId = traits.find((t) => t.id === sanitizedLookup || t.id === sanitizedLookup.replace(/_/g, '-'));
  if (bySanitizedId) return bySanitizedId;
  const bySanitizedName = traits.find((t) => {
    const sanitizedName = String(t.name ?? '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
    return sanitizedName === sanitizedLookup || sanitizedName === lowerLookup;
  });
  return bySanitizedName;
}

export function resolveTraitIds(traitIds: (string | number)[], allTraits: Trait[]): Trait[] {
  if (!traitIds || !allTraits) return [];
  return traitIds.map((id) => {
    const trait = findTraitByIdOrName(allTraits, id);
    return trait || { id: String(id), name: String(id), description: 'Trait not found' };
  });
}

export function useResolvedTraits(traitIds: (string | number)[]): {
  traits: Trait[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data: allTraits, isLoading, error } = useCodexTraits();
  const resolvedTraits = useMemo(() => {
    if (!allTraits || !traitIds) return [];
    return resolveTraitIds(traitIds, allTraits);
  }, [allTraits, traitIds]);
  return { traits: resolvedTraits, isLoading, error: error || null };
}

// =============================================================================
// Skill ID Resolution Utilities
// =============================================================================

export function buildSkillIdToNameMap(skills: Skill[]): Map<string, string> {
  return new Map(skills.map((s) => [s.id, s.name]));
}

export function resolveSkillIdsToNames(skillIds: (string | number)[], allSkills: Skill[]): string[] {
  const skillMap = buildSkillIdToNameMap(allSkills);
  return skillIds.map((id) => skillMap.get(String(id)) || String(id));
}

export function useSkillIdToNameMap(): {
  skillIdToName: Map<string, string>;
  isLoading: boolean;
  error: Error | null;
} {
  const { data: skills, isLoading, error } = useCodexSkills();
  const skillIdToName = useMemo(() => {
    if (!skills) return new Map<string, string>();
    return buildSkillIdToNameMap(skills);
  }, [skills]);
  return { skillIdToName, isLoading, error: error || null };
}

export function useResolvedSkillNames(skillIds: (string | number)[]): {
  skillNames: string[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data: skills, isLoading, error } = useCodexSkills();
  const skillNames = useMemo(() => {
    if (!skills || !skillIds?.length) return [];
    return resolveSkillIdsToNames(skillIds, skills);
  }, [skills, skillIds]);
  return { skillNames, isLoading, error: error || null };
}
