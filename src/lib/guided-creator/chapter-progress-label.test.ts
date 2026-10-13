import { describe, expect, it } from 'vitest';
import { GUIDED_CHAPTERS } from '@/stores/guided-creator-store';
import { guidedChapterProgressTitle } from './chapter-progress-label';

describe('guidedChapterProgressTitle (86e3jmr0b)', () => {
  const foundation = GUIDED_CHAPTERS.find((c) => c.id === 'foundation')!;

  it('shows Species on the Foundation chapter while on the species sub-step', () => {
    expect(guidedChapterProgressTitle('species', foundation)).toBe('Species');
  });

  it('shows Archetype Path while on the path sub-step', () => {
    expect(guidedChapterProgressTitle('path', foundation)).toBe('Archetype Path');
  });

  it('uses the chapter title for single-sub-step chapters', () => {
    const ancestry = GUIDED_CHAPTERS.find((c) => c.id === 'ancestry')!;
    expect(guidedChapterProgressTitle('ancestry', ancestry)).toBe(ancestry.title);
  });
});
