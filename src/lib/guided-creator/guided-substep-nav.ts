/**
 * Guided footer / chapter sub-step navigation (DEV-V-013-T059 / TASK-592).
 *
 * Continue advances exactly one entry in the guided sub-step order. Completed
 * progress is never consulted — that was the furthest-jump regression.
 *
 * Order is passed in (not imported from the store) to avoid a store ↔ lib cycle.
 */

import type { GuidedSubStep } from '@/stores/guided-creator-store';

export type GuidedNavigationIntent = 'first' | 'forward' | 'back';

/**
 * Footer Continue target: immediate next sub-step, or null at the end.
 * Does not accept / use completed steps — never jumps to furthest progress.
 */
export function nextGuidedSubStep(
  current: GuidedSubStep,
  order: readonly GuidedSubStep[],
): GuidedSubStep | null {
  const idx = order.indexOf(current);
  if (idx < 0 || idx >= order.length - 1) return null;
  return order[idx + 1] ?? null;
}

/** Footer Back target: immediate previous sub-step, or null at the start. */
export function prevGuidedSubStep(
  current: GuidedSubStep,
  order: readonly GuidedSubStep[],
): GuidedSubStep | null {
  const idx = order.indexOf(current);
  if (idx <= 0) return null;
  return order[idx - 1] ?? null;
}

/**
 * Multi-screen steps (Ancestry, Loadout): chapter rail / Continue land on the
 * first inner screen; Back resumes the last inner screen.
 */
export function landsOnFirstInnerScreen(intent: GuidedNavigationIntent): boolean {
  return intent === 'first' || intent === 'forward';
}
