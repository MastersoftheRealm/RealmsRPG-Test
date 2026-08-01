/**
 * Guided Path draft patches: path select, Path L1↔L3 layer switches, custom archetype.
 */

import { resolvePathAbilityLabels } from '@/lib/guided-creator/path-ability-labels';
import { CHARACTER_STARTING_CURRENCY } from '@/stores/character-creator-store';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import {
  DEFAULT_ABILITIES,
  type AbilityName,
  type Archetype,
  type ArchetypeCategory,
} from '@/types';

/** Clears chapter picks that depend on archetype / path identity. */
export function clearArchetypeDependentDraftFields(): Partial<GuidedDraft> {
  return {
    abilities: { ...DEFAULT_ABILITIES },
    abilitiesMode: null,
    skills: {},
    declinedPathSkillIds: [],
    archetypeFeatIds: [],
    characterFeatIds: [],
    equipmentPhase: 'weapon',
    loadoutWeapons: [],
    loadoutArmor: [],
    armaments: [],
    equipment: [],
    currency: CHARACTER_STARTING_CURRENCY,
    unarmedProwess: 0,
    powerIds: [],
    innatePowerIds: [],
    techniqueIds: [],
  };
}

/** Partial for `updateDraft`. Clears abilities/skills/feats/loadout/powers when path id changes. */
export function buildPathSelectionDraftPatch(
  currentArchetypePathId: string | null,
  path: Archetype
): Partial<GuidedDraft> {
  const pathId = String(path.id);
  const type = (path.type || 'power') as ArchetypeCategory;
  const { powAbil, martAbil } = resolvePathAbilityLabels(path);
  const pathChanged = currentArchetypePathId !== pathId;

  return {
    pathLayer: 'l1',
    archetypePathId: pathId,
    archetypeType: type,
    pow_abil: powAbil,
    mart_abil: martAbil,
    ...(pathChanged ? clearArchetypeDependentDraftFields() : {}),
  };
}

/** L1 → L3: custom archetype face (clears path + dependents). */
export function buildEnterCustomArchetypeLayerPatch(): Partial<GuidedDraft> {
  return {
    creatorEntryMode: 'custom',
    pathLayer: 'l3',
    archetypePathId: null,
    archetypeType: null,
    pow_abil: null,
    mart_abil: null,
    ...clearArchetypeDependentDraftFields(),
  };
}

/** L3 → L1: view archetype paths (clears custom picks + dependents). */
export function buildEnterPathLayerPatch(): Partial<GuidedDraft> {
  return {
    pathLayer: 'l1',
    archetypePathId: null,
    archetypeType: null,
    pow_abil: null,
    mart_abil: null,
    ...clearArchetypeDependentDraftFields(),
  };
}

/**
 * Chooser Guided / deep-link: Path L1 + guided catalog faces (not custom deep landing).
 */
export function buildOpenGuidedPathEntryPatch(): Partial<GuidedDraft> {
  return {
    creatorEntryMode: 'guided',
    pathLayer: 'l1',
  };
}

/**
 * Chooser Custom / deep-link: show Path L3.
 * Clears a path pick so custom archetype is the committed mode; keeps in-progress type/abilities.
 */
export function buildOpenCustomPathEntryPatch(): Partial<GuidedDraft> {
  return {
    creatorEntryMode: 'custom',
    pathLayer: 'l3',
    archetypePathId: null,
  };
}

/** Valid custom-archetype selection for Continue on Path L3. */
export function isGuidedCustomArchetypeComplete(
  type: ArchetypeCategory | null,
  powAbil: AbilityName | null,
  martAbil: AbilityName | null
): boolean {
  if (!type) return false;
  if (type === 'powered-martial') {
    return Boolean(powAbil && martAbil && powAbil !== martAbil);
  }
  if (type === 'power') return Boolean(powAbil);
  return Boolean(martAbil);
}

/**
 * Sync custom type + ability picks into the draft.
 * Clears dependents when archetype type changes.
 */
export function buildCustomArchetypeDraftPatch(args: {
  type: ArchetypeCategory;
  powAbil: AbilityName | null;
  martAbil: AbilityName | null;
  previousType: ArchetypeCategory | null;
}): Partial<GuidedDraft> {
  const { type, powAbil, martAbil, previousType } = args;
  const typeChanged = previousType !== type;

  let nextPow = powAbil;
  let nextMart = martAbil;
  if (type === 'power') {
    nextMart = null;
  } else if (type === 'martial') {
    nextPow = null;
  }

  return {
    pathLayer: 'l3',
    archetypePathId: null,
    archetypeType: type,
    pow_abil: nextPow,
    mart_abil: nextMart,
    ...(typeChanged ? clearArchetypeDependentDraftFields() : {}),
  };
}
