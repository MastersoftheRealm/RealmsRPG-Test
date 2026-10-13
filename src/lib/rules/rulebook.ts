import chaptersJson from '@/content/rules/chapters.json';

export type RulebookHeading = { id: string; title: string };

export type RulebookChapterMeta = {
  slug: string;
  title: string;
  description: string;
  headings: RulebookHeading[];
  parentSlug?: string | undefined;
};

export type RulebookNavNode = RulebookChapterMeta & {
  chapterNumber: number;
  children: RulebookChapterMeta[];
};

export const RULEBOOK_CHAPTERS: RulebookChapterMeta[] = chaptersJson as RulebookChapterMeta[];

export const RULEBOOK_WELCOME_SLUG = 'welcome-to-realms';

export function getRulebookChapterHref(slug: string, headingId?: string): string {
  const base = slug === RULEBOOK_WELCOME_SLUG ? '/rules' : `/rules/${slug}`;
  return headingId ? `${base}#${headingId}` : base;
}

export const RULEBOOK_SITEMAP_PATHS = RULEBOOK_CHAPTERS.map((chapter) =>
  getRulebookChapterHref(chapter.slug),
);

export function getRulebookChapter(slug: string): RulebookChapterMeta | undefined {
  return RULEBOOK_CHAPTERS.find((chapter) => chapter.slug === slug);
}

export function getRulebookNavTree(
  chapters: readonly RulebookChapterMeta[] = RULEBOOK_CHAPTERS,
): RulebookNavNode[] {
  const roots = chapters.filter((chapter) => !chapter.parentSlug);
  return roots.map((chapter, index) => ({
    ...chapter,
    chapterNumber: index + 1,
    children: chapters.filter((child) => child.parentSlug === chapter.slug),
  }));
}

export function getAdjacentRulebookChapters(slug: string): {
  previous?: RulebookChapterMeta | undefined;
  next?: RulebookChapterMeta | undefined;
} {
  const index = RULEBOOK_CHAPTERS.findIndex((chapter) => chapter.slug === slug);
  if (index < 0) return {};
  return {
    ...(index > 0 ? { previous: RULEBOOK_CHAPTERS[index - 1] } : {}),
    ...(index < RULEBOOK_CHAPTERS.length - 1 ? { next: RULEBOOK_CHAPTERS[index + 1] } : {}),
  };
}
