/**
 * Your Hero leftovers — name, Health/Energy, unspent pools, unfinished chapters.
 *
 * Rail satisfaction is a structural floor (any skill pick, any ability points). The
 * step footers still require spending the pools. Players can chapter-rail onto Reveal
 * with leftover Skill or Ability points; Create must name those, not grey out.
 */

import type { GuidedDraft, GuidedSubStep } from '@/stores/guided-creator-store';
import { isGuidedSubStepSatisfied } from '@/lib/guided-creator/substep-satisfaction';

export type GuidedRevealBlocker =
  | { kind: 'name' }
  | { kind: 'healthEnergy'; remaining: number }
  | { kind: 'abilityPoints'; remaining: number; subStep: 'abilities' }
  | { kind: 'skillPoints'; remaining: number; subStep: 'skills' }
  | { kind: 'chapter'; chapterId: string; title: string; subStep: GuidedSubStep };

export type GuidedChapterRef = {
  id: string;
  title: string;
  subSteps: readonly GuidedSubStep[];
};

export function listGuidedRevealBlockers(args: {
  chapters: readonly GuidedChapterRef[];
  draft: GuidedDraft;
  healthEnergyRemaining: number;
  abilityPointsRemaining?: number | undefined;
  skillPointsRemaining?: number | undefined;
}): GuidedRevealBlocker[] {
  const {
    draft,
    chapters,
    healthEnergyRemaining,
    abilityPointsRemaining = 0,
    skillPointsRemaining = 0,
  } = args;
  const blockers: GuidedRevealBlocker[] = [];

  if (draft.name.trim().length === 0) {
    blockers.push({ kind: 'name' });
  }

  if (healthEnergyRemaining !== 0) {
    blockers.push({ kind: 'healthEnergy', remaining: healthEnergyRemaining });
  }

  if (isGuidedSubStepSatisfied('abilities', draft) && abilityPointsRemaining !== 0) {
    blockers.push({
      kind: 'abilityPoints',
      remaining: abilityPointsRemaining,
      subStep: 'abilities',
    });
  }

  if (isGuidedSubStepSatisfied('skills', draft) && skillPointsRemaining !== 0) {
    blockers.push({
      kind: 'skillPoints',
      remaining: skillPointsRemaining,
      subStep: 'skills',
    });
  }

  for (const chapter of chapters) {
    const incomplete = chapter.subSteps.filter(
      (step) => step !== 'reveal' && !isGuidedSubStepSatisfied(step, draft),
    );
    const first = incomplete[0];
    if (first === undefined) continue;
    blockers.push({
      kind: 'chapter',
      chapterId: chapter.id,
      title: chapter.title,
      subStep: first,
    });
  }

  return blockers;
}

export function guidedRevealBlockerKey(blocker: GuidedRevealBlocker): string {
  if (blocker.kind === 'chapter') return `chapter:${blocker.chapterId}`;
  return blocker.kind;
}
