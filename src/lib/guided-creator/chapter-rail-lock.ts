/**
 * Why a guided chapter-rail pill is locked (86e3jmr0g).
 */

import {
  canOpenGuidedSubStep,
  isGuidedSubStepSatisfied,
} from '@/lib/guided-creator/substep-satisfaction';
import type { GuidedDraft, GuidedSubStep } from '@/stores/guided-creator-store';

export type GuidedChapterRailRef = {
  title: string;
  subSteps: readonly GuidedSubStep[];
};

/** First unsatisfied sub-step that blocks opening `targetSubStep`. */
export function findGuidedChapterRailBlockerSubStep(
  targetSubStep: GuidedSubStep,
  order: readonly GuidedSubStep[],
  draft: GuidedDraft,
): GuidedSubStep | null {
  if (canOpenGuidedSubStep(targetSubStep, order, draft)) return null;
  const targetIdx = order.indexOf(targetSubStep);
  if (targetIdx <= 0) return null;
  return order.slice(0, targetIdx).find((step) => !isGuidedSubStepSatisfied(step, draft)) ?? null;
}

/** Chapter that contains the blocking sub-step, for rail tooltip copy. */
export function findGuidedChapterRailBlockerChapter(
  targetSubStep: GuidedSubStep,
  chapters: readonly GuidedChapterRailRef[],
  order: readonly GuidedSubStep[],
  draft: GuidedDraft,
): GuidedChapterRailRef | null {
  const blocker = findGuidedChapterRailBlockerSubStep(targetSubStep, order, draft);
  if (!blocker) return null;
  return chapters.find((chapter) => chapter.subSteps.includes(blocker)) ?? null;
}
