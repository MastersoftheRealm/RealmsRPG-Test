/**
 * Guided feat selection helpers — capped multi-select (ancestry-style swap) +
 * draft → feat-requirement character snapshot.
 */

import type { GuidedDraft } from '@/stores/guided-creator-store';
import {
  checkFeatRequirements,
  type CharacterForFeatRequirement,
  type FeatForRequirement,
} from '@/lib/game/feat-requirements';
import type { CodexSkillForFeat } from '@/lib/game/formulas';

/**
 * Toggle / add / swap under a hard max. At capacity, selecting a new id replaces
 * the most recent pick (same grammar as archetype-feats Layer 1).
 */
export function applyCappedIdSelection(current: string[], id: string, max: number): string[] {
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

/**
 * Curated (Layer 1) feat ids the player may actually take (report 03 P1-10).
 *
 * A path can recommend a feat whose requirements this build does not meet; offering it
 * would save an illegal feat. `buildGuidedFeatsL2Items` already hides unmet feats in the
 * catalog, so the L1 cards apply the same rule — with the same escape hatch: an id that is
 * already selected stays visible even when unmet, or a build that drifts out of
 * qualification (skills changed after the pick) would have no way to deselect it.
 *
 * Ids with no codex match pass through: requirements cannot be evaluated, and the card
 * already renders as a bare id.
 */
export function selectableCuratedFeatIds(args: {
  ids: readonly (string | number)[];
  feats: FeatForRequirement[];
  selectedIds: readonly string[];
  requirementCharacter: CharacterForFeatRequirement;
  codexSkills: CodexSkillForFeat[];
}): string[] {
  const { ids, feats, selectedIds, requirementCharacter, codexSkills } = args;
  const selected = new Set(selectedIds.map(String));

  return ids.map(String).filter((id) => {
    if (selected.has(id)) return true;
    const feat = feats.find((f) => String(f.id) === id);
    if (!feat) return true;
    return checkFeatRequirements(feat, requirementCharacter, codexSkills, feats).met;
  });
}

/** Build the minimal character shape for `checkFeatRequirements` from a guided draft. */
export function guidedDraftToFeatRequirementCharacter(
  draft: GuidedDraft,
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
