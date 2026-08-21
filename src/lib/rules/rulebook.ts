import chaptersJson from '@/content/rules/chapters.json';

export type RulebookHeading = { id: string; title: string };

export type RulebookChapterMeta = {
  slug: string;
  title: string;
  description: string;
  headings: RulebookHeading[];
};

export const RULEBOOK_CHAPTERS: RulebookChapterMeta[] = chaptersJson as RulebookChapterMeta[];

export const RULEBOOK_SITEMAP_PATHS = RULEBOOK_CHAPTERS.map((chapter) => `/rules/${chapter.slug}`);

export function getRulebookChapter(slug: string): RulebookChapterMeta | undefined {
  return RULEBOOK_CHAPTERS.find((chapter) => chapter.slug === slug);
}
