/**
 * Ancestry inner-screen landing for chapter rail / footer Continue (TASK-697).
 *
 * Forward navigation always lands on species overview (phase 0) — never skips to
 * the first pick, including custom deep-catalog entry (TASK-640 regression removed).
 */

import type { AncestryPickTask } from '@/lib/guided-creator/ancestry-pick-tasks';
import type { GuidedDraft } from '@/stores/guided-creator-store';

export const ANCESTRY_SPECIES_OVERVIEW_PHASE_INDEX = 0;

/** TASK-640 briefly returned this when `prefersDeepCatalogEntry` — do not reintroduce. */
export const ANCESTRY_DEEP_ENTRY_OVERVIEW_SKIP_PHASE_INDEX = 1;

export function resolveForwardLandingPhaseIndex(
  tasks: readonly AncestryPickTask[],
  draft: Pick<GuidedDraft, 'creatorEntryMode' | 'archetypePathId'>
): number {
  void tasks;
  void draft;
  return ANCESTRY_SPECIES_OVERVIEW_PHASE_INDEX;
}
