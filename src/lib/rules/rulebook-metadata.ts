import type { Metadata } from 'next';
import { RULES_COPY } from '@/lib/constants/site-copy';
import { getCanonicalSiteUrl } from '@/lib/site-url';
import { getRulebookChapter, getRulebookChapterHref } from '@/lib/rules/rulebook';

/** Chapter metadata. Canonical is a path; root metadataBase makes it absolute. */
export function rulebookChapterMetadata(slug: string): Metadata {
  const chapter = getRulebookChapter(slug);
  if (!chapter) return { title: RULES_COPY.pageTitle };
  const path = getRulebookChapterHref(chapter.slug);
  const url = `${getCanonicalSiteUrl()}${path}`;
  return {
    title: chapter.title,
    description: chapter.description,
    alternates: { canonical: path },
    openGraph: {
      title: `${chapter.title} | ${RULES_COPY.pageTitle}`,
      description: chapter.description,
      url,
      type: 'article',
    },
  };
}
