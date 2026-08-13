/**
 * Codex Utilities
 * ================
 * Trait/skill resolution helpers. Entity types live in `@/types/codex`.
 */

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
import { buildSkillIdToName } from '@/lib/codex/skill-list';

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

// =============================================================================
// Skill ID Resolution Utilities
// =============================================================================

/** Species skill id "0" means "Any" (user picks any skill / extra skill point). */
export function resolveSkillIdsToNames(skillIds: (string | number)[], allSkills: Skill[]): string[] {
  const skillMap = buildSkillIdToName(allSkills);
  return skillIds.map((id) => {
    if (String(id) === '0') return 'Any';
    return skillMap.get(String(id)) || String(id);
  });
}
