/**
 * Codex Utilities
 * ================
 * Trait/skill resolution helpers. Entity types live in `@/types/codex`.
 */

'use client';

import { useCodexTraits, useCodexSkills } from './use-codex';
import { useMemo } from 'react';

export type {
  CodexPayload,
  CodexPayloadKey,
  CodexArchetype,
  CodexFeat,
  CodexSkill,
  CodexSpecies,
  CodexTrait,
  CodexPowerPart,
  CodexTechniquePart,
  CodexPart,
  CodexItemProperty,
  CodexEquipmentItem,
  CodexCreatureFeat,
  PowerPart,
  TechniquePart,
  Part,
  ItemProperty,
  Feat,
  Skill,
  Species,
  Trait,
  EquipmentItem,
  CreatureFeat,
} from '@/types/codex';

import type { Trait, Skill } from '@/types/codex';

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

/** Species skill id "0" means "Any" (user picks any skill / extra skill point). */
export function resolveSkillIdsToNames(skillIds: (string | number)[], allSkills: Skill[]): string[] {
  const skillMap = buildSkillIdToNameMap(allSkills);
  return skillIds.map((id) => {
    if (String(id) === '0') return 'Any';
    return skillMap.get(String(id)) || String(id);
  });
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
