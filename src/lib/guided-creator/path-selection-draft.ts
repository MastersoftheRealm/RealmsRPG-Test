/**
 * Guided path select draft patch: same path keeps dependents; new path clears them.
 */

import { resolvePathAbilityLabels } from '@/lib/guided-creator/path-ability-labels';
import { CHARACTER_STARTING_CURRENCY } from '@/stores/character-creator-store';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import { DEFAULT_ABILITIES, type Archetype, type ArchetypeCategory } from '@/types';

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
    archetypePathId: pathId,
    archetypeType: type,
    pow_abil: powAbil,
    mart_abil: martAbil,
    ...(pathChanged
      ? {
          // Reset scores + abilitiesMode so Abilities soft-default cannot keep the prior path array.
          abilities: { ...DEFAULT_ABILITIES },
          abilitiesMode: null,
          skills: {},
          declinedPathSkillIds: [],
          archetypeFeatIds: [],
          characterFeatIds: [],
          equipmentPhase: 'weapon' as const,
          loadoutWeapons: [],
          loadoutArmor: [],
          armaments: [],
          equipment: [],
          currency: CHARACTER_STARTING_CURRENCY,
          unarmedProwess: 0,
          powerIds: [],
          techniqueIds: [],
        }
      : {}),
  };
}
