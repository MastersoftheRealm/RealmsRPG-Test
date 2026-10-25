import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import type { GuidedSubStep } from '@/stores/guided-creator-store';

type GuidedChapterProgressRef = {
  title: string;
  subSteps: readonly GuidedSubStep[];
};

const subStepProgress = GUIDED_CREATOR_COPY.subStepProgress;

/** Shell subtitle + active chapter-rail pill when the chapter has more than one sub-step. */
export function guidedChapterProgressTitle(
  currentSubStep: GuidedSubStep,
  chapter: GuidedChapterProgressRef | null,
): string | null {
  if (!chapter) return null;
  if (chapter.subSteps.length === 1) return chapter.title;
  const subTitle = subStepProgress[currentSubStep as keyof typeof subStepProgress];
  if (subTitle && chapter.subSteps.includes(currentSubStep)) return subTitle;
  return chapter.title;
}
