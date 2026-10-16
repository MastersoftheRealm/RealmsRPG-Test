import { describe, expect, it } from 'vitest';
import {
  findGuidedChapterRailBlockerChapter,
  findGuidedChapterRailBlockerSubStep,
} from './chapter-rail-lock';
import {
  GUIDED_CHAPTERS,
  GUIDED_SUBSTEP_ORDER,
  useGuidedCreatorStore,
} from '@/stores/guided-creator-store';

function minimalDraft(
  overrides: Partial<ReturnType<typeof useGuidedCreatorStore.getState>['draft']> = {},
) {
  return { ...useGuidedCreatorStore.getState().draft, ...overrides };
}

describe('guided chapter rail lock (86e3jmr0g)', () => {
  it('returns null when the chapter is reachable', () => {
    const draft = minimalDraft({ archetypePathId: 'path-1' });
    expect(findGuidedChapterRailBlockerSubStep('species', GUIDED_SUBSTEP_ORDER, draft)).toBeNull();
  });

  it('names path as the blocker before species', () => {
    const draft = minimalDraft();
    expect(findGuidedChapterRailBlockerSubStep('species', GUIDED_SUBSTEP_ORDER, draft)).toBe(
      'path',
    );
    const chapter = findGuidedChapterRailBlockerChapter(
      'species',
      GUIDED_CHAPTERS,
      GUIDED_SUBSTEP_ORDER,
      draft,
    );
    expect(chapter?.title).toBe(GUIDED_CHAPTERS[0]!.title);
  });

  it('points at ancestry when abilities is locked', () => {
    const draft = minimalDraft({
      archetypePathId: 'path-1',
      speciesId: 'species-1',
    });
    expect(findGuidedChapterRailBlockerSubStep('abilities', GUIDED_SUBSTEP_ORDER, draft)).toBe(
      'ancestry',
    );
  });
});
