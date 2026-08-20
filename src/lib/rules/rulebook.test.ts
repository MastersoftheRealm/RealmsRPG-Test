import { describe, expect, it } from 'vitest';
import { RULES_COPY } from '@/lib/constants/site-copy';
import { getRulebookChapter, RULEBOOK_CHAPTERS, RULEBOOK_SITEMAP_PATHS } from './rulebook';

describe('rulebook chapters (TASK-796)', () => {
  it('exposes unique slugs and sitemap paths without importing MDX', () => {
    const slugs = RULEBOOK_CHAPTERS.map((chapter) => chapter.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain('playing-the-game');
    expect(getRulebookChapter('playing-the-game')?.title).toBe('Playing the Game');
    expect(RULEBOOK_SITEMAP_PATHS).toContain('/rules/playing-the-game');
  });

  it('keeps the Google Doc as view-source only (TASK-853)', () => {
    expect(RULES_COPY.viewUrl).toContain('docs.google.com');
    expect(RULES_COPY).not.toHaveProperty('embedUrl');
    expect(RULES_COPY).not.toHaveProperty('iframeTitle');
  });
});
