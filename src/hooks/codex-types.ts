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
  CreatureFeat,
} from '@/types/codex';

import type { Trait } from '@/types/codex';

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
  const sanitizedLookup = lookupStr
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '');
  const bySanitizedId = traits.find(
    (t) => t.id === sanitizedLookup || t.id === sanitizedLookup.replace(/_/g, '-'),
  );
  if (bySanitizedId) return bySanitizedId;
  const bySanitizedName = traits.find((t) => {
    const sanitizedName = String(t.name ?? '')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_-]/g, '');
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
