import { describe, expect, it } from 'vitest';
import { getRulebookChapter, RULEBOOK_CHAPTERS, RULEBOOK_SITEMAP_PATHS } from './rulebook';

describe('rulebook chapters (TASK-796)', () => {
  it('exposes unique slugs and sitemap paths without importing MDX', () => {
    const slugs = RULEBOOK_CHAPTERS.map((chapter) => chapter.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain('playing-the-game');
    expect(getRulebookChapter('playing-the-game')?.title).toBe('Playing the Game');
    expect(RULEBOOK_SITEMAP_PATHS).toContain('/rules/playing-the-game');
  });
});
