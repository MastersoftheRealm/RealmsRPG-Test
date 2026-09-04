import { describe, expect, it } from 'vitest';
import { RULES_COPY } from '@/lib/constants/site-copy';
import {
  getAdjacentRulebookChapters,
  getRulebookChapter,
  getRulebookChapterHref,
  getRulebookNavTree,
  RULEBOOK_CHAPTERS,
  RULEBOOK_SITEMAP_PATHS,
} from './rulebook';

describe('rulebook chapters (TASK-796 / TASK-905)', () => {
  it('exposes unique slugs and sitemap paths without importing MDX', () => {
    const slugs = RULEBOOK_CHAPTERS.map((chapter) => chapter.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain('playing-the-game');
    expect(getRulebookChapter('playing-the-game')?.title).toBe('Playing the Game');
    expect(RULEBOOK_SITEMAP_PATHS).toContain('/rules');
    expect(RULEBOOK_SITEMAP_PATHS).not.toContain('/rules/welcome-to-realms');
    expect(RULEBOOK_SITEMAP_PATHS).toContain('/rules/playing-the-game');
  });

  it('keeps the Google Doc as view-source only (TASK-853)', () => {
    expect(RULES_COPY.viewUrl).toContain('docs.google.com');
    expect(RULES_COPY).not.toHaveProperty('embedUrl');
    expect(RULES_COPY).not.toHaveProperty('iframeTitle');
  });

  it('nests subchapters under Encounters, Character Creation, and Equipment', () => {
    const tree = getRulebookNavTree();
    expect(tree.map((node) => node.slug)).toEqual([
      'welcome-to-realms',
      'playing-the-game',
      'encounters',
      'character-creation',
      'equipment',
      'powers-and-techniques',
      'glossary',
      'the-realms',
    ]);

    const encounters = tree.find((node) => node.slug === 'encounters');
    expect(encounters?.children.map((child) => child.slug)).toEqual([
      'combat-encounters',
      'skill-encounters',
    ]);

    const creation = tree.find((node) => node.slug === 'character-creation');
    expect(creation?.children.map((child) => child.slug)).toEqual(['roll-tables']);

    const equipment = tree.find((node) => node.slug === 'equipment');
    expect(equipment?.title).toBe('Equipment, Crafting & Downtime');
    expect(equipment?.children.map((child) => child.slug)).toEqual(['crafting', 'downtime']);
  });

  it('maps Welcome to /rules and other chapters to /rules/[slug]', () => {
    expect(getRulebookChapterHref('welcome-to-realms')).toBe('/rules');
    expect(getRulebookChapterHref('welcome-to-realms', 'using-this-book')).toBe(
      '/rules#using-this-book',
    );
    expect(getRulebookChapterHref('combat-encounters', 'initiative-starting-combat')).toBe(
      '/rules/combat-encounters#initiative-starting-combat',
    );
  });

  it('walks reading order for adjacent chapters', () => {
    const fromEncounters = getAdjacentRulebookChapters('encounters');
    expect(fromEncounters.previous?.slug).toBe('playing-the-game');
    expect(fromEncounters.next?.slug).toBe('combat-encounters');
  });
});
