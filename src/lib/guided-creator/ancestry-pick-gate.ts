/**
 * Footer Continue gate for one ancestry pick screen (extracted from `AncestryStep`).
 *
 * The `mixed-species-skills` screen used to short-circuit to `true`, so a mixed-species
 * character could walk out of the Ancestry chapter with none of its two required species
 * skills. The predicate that decides it already existed (`hasRequiredMixedSpeciesSkills`);
 * it just was not applied here.
 */

import { hasRequiredMixedSpeciesSkills } from '@/lib/ancestry/ancestry-selection';
import type { AncestryPickTask } from '@/lib/guided-creator/ancestry-pick-tasks';

export interface AncestryPickGateInput {
  task: AncestryPickTask | undefined;
  /** Unique combined parent skill options (0 for single species). */
  mixedSkillOptionCount: number;
  selectedSpeciesSkillIdCount: number;
  /** True when the current screen's trait/flaw option is already picked. */
  hasPick: boolean;
  /** Ancestry chapter is complete by its own (codex-aware) predicate. */
  ancestryComplete: boolean;
}

export function canContinueAncestryPick({
  task,
  mixedSkillOptionCount,
  selectedSpeciesSkillIdCount,
  hasPick,
  ancestryComplete,
}: AncestryPickGateInput): boolean {
  if (!task) return ancestryComplete;
  if (task.phase === 'mixed-species-skills') {
    return hasRequiredMixedSpeciesSkills(mixedSkillOptionCount, selectedSpeciesSkillIdCount);
  }
  return Boolean(task.optional) || hasPick;
}
