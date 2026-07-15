/**
 * Guided feat selection helpers — capped multi-select (ancestry-style swap) +
 * draft → feat-requirement character snapshot.
 */

import type { GuidedDraft } from '@/stores/guided-creator-store';
import type { CharacterForFeatRequirement } from '@/lib/game/feat-requirements';

/**
 * Toggle / add / swap under a hard max. At capacity, selecting a new id replaces
 * the most recent pick (same grammar as archetype-feats Layer 1).
 */
export function applyCappedIdSelection(
  current: string[],
  id: string,
  max: number
): string[] {
  const key = String(id);
  if (current.includes(key)) {
    return current.filter((x) => x !== key);
  }
  if (current.length < max) {
    return [...current, key];
  }
  if (max <= 0) return current;
  return [...current.slice(0, -1), key];
}

/** Build the minimal character shape for `checkFeatRequirements` from a guided draft. */
export function guidedDraftToFeatRequirementCharacter(
  draft: GuidedDraft
): CharacterForFeatRequirement {
  const owned = [
    ...draft.archetypeFeatIds.map((id) => ({ id })),
    ...draft.characterFeatIds.map((id) => ({ id })),
  ];
  return {
    level: 1,
    abilities: draft.abilities,
    skills: draft.skills,
    mart_abil: draft.mart_abil ?? undefined,
    feats: owned,
    archetypeFeats: draft.archetypeFeatIds.map((id) => ({ id })),
  };
}
