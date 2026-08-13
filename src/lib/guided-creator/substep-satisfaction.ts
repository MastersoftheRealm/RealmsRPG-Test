/**
 * Derived sub-step completion for the guided creator.
 *
 * Completion is a predicate over the draft, never a recorded list. The chapter rail and the
 * Reveal save gate both read these predicates, so any patch that clears a chapter's picks
 * (path change, species change, restart) automatically re-locks every step that depended on
 * them — a rail jump can no longer land on Reveal with the build gutted.
 *
 * Predicates are draft-only structural floors. The codex-dependent half of each step's
 * `canContinue` (option counts, `core_rules` budgets) stays in the step component and gates
 * its footer; duplicating it here would make the rail disagree with the step whenever the
 * codex or rules are still loading.
 */

import { isGuidedCustomArchetypeComplete } from '@/lib/guided-creator/path-selection-draft';
import type { GuidedDraft, GuidedSubStep } from '@/stores/guided-creator-store';

function hasAllocatedAbilityPoints(abilities: GuidedDraft['abilities']): boolean {
  return Object.values(abilities ?? {}).some((value) => (value ?? 0) !== 0);
}

const SATISFACTION: Record<GuidedSubStep, (draft: GuidedDraft) => boolean> = {
  path: (draft) =>
    draft.pathLayer === 'l3'
      ? isGuidedCustomArchetypeComplete(draft.archetypeType, draft.pow_abil, draft.mart_abil)
      : Boolean(draft.archetypePathId),

  species: (draft) => Boolean(draft.speciesId),

  /**
   * Species-trait choices and mixed parent traits need the trait codex to know how many are
   * required — `AncestryStep.ancestryComplete` owns those. The floor here is the picks the
   * ancestry clear-list wipes: characteristic, ancestry trait(s), mixed species skills.
   */
  ancestry: (draft) =>
    Boolean(draft.selectedCharacteristicId) &&
    draft.selectedAncestryTraitIds.filter(Boolean).length >= (draft.selectedFlawId ? 2 : 1) &&
    (!draft.speciesMixed || draft.selectedSpeciesSkillIds.length > 0),

  abilities: (draft) =>
    draft.abilitiesMode !== null && hasAllocatedAbilityPoints(draft.abilities),

  skills: (draft) => Object.keys(draft.skills ?? {}).length > 0,

  'archetype-feats': (draft) => draft.archetypeFeatIds.length > 0,

  'character-feat': (draft) => draft.characterFeatIds.length === 1,

  /**
   * Weapons/armor/gear are all optional (TASK-456); overspending Currency is not.
   * `draft.currency` is the signed remainder LoadoutStep syncs from live spend —
   * not the clamped save value — so a rail jump cannot skip an overspent kit.
   */
  loadout: (draft) => (draft.currency ?? 0) >= 0,

  /** Powers and techniques are optional picks at level 1. */
  'powers-techniques': () => true,

  reveal: (draft) =>
    draft.name.trim().length > 0 &&
    draft.hpAllocated !== null &&
    draft.energyAllocated !== null,
};

export function isGuidedSubStepSatisfied(subStep: GuidedSubStep, draft: GuidedDraft): boolean {
  return SATISFACTION[subStep](draft);
}

/**
 * Rail reachability: a step opens once every step ahead of it in the flow is satisfied.
 * `order` is passed in (rather than imported) to keep this module free of store values.
 */
export function canOpenGuidedSubStep(
  subStep: GuidedSubStep,
  order: readonly GuidedSubStep[],
  draft: GuidedDraft
): boolean {
  const targetIdx = order.indexOf(subStep);
  if (targetIdx <= 0) return true;
  return order.slice(0, targetIdx).every((step) => isGuidedSubStepSatisfied(step, draft));
}

/**
 * Save gate for "Create character" — every sub-step, including Reveal's own name and
 * Health/Energy allocation. Callers add the rules-dependent `remaining === 0` check.
 */
export function isGuidedDraftSaveable(
  order: readonly GuidedSubStep[],
  draft: GuidedDraft
): boolean {
  return order.every((step) => isGuidedSubStepSatisfied(step, draft));
}
