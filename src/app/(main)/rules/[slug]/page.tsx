/**
 * Rulebook chapter — server-rendered MDX (ADR-0021 / TASK-796 / TASK-905).
 */

import type { Metadata } from 'next';
import { createElement } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { PageContainer, PageHeader } from '@/components/ui';
import { RulebookArticle } from '@/components/rules/rulebook-article';
import { RulebookPager } from '@/components/rules/rulebook-pager';
import { RulebookShell } from '@/components/rules/rulebook-shell';
import { RULES_COPY } from '@/lib/constants/site-copy';
import { getCanonicalSiteUrl } from '@/lib/site-url';
import {
  getAdjacentRulebookChapters,
  getRulebookChapter,
  getRulebookChapterHref,
  RULEBOOK_CHAPTERS,
  RULEBOOK_WELCOME_SLUG,
} from '@/lib/rules/rulebook';
import { getRulebookChapterComponent } from '@/content/rules';

type ChapterParams = { slug: string };

export function generateStaticParams(): ChapterParams[] {
  return RULEBOOK_CHAPTERS.map((chapter) => ({ slug: chapter.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<ChapterParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const chapter = getRulebookChapter(slug);
  if (!chapter) return { title: RULES_COPY.pageTitle };
  const url = `${getCanonicalSiteUrl()}${getRulebookChapterHref(chapter.slug)}`;
  return {
    title: chapter.title,
    description: chapter.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${chapter.title} | ${RULES_COPY.pageTitle}`,
      description: chapter.description,
      url,
      type: 'article',
    },
  };
}

export default async function RulebookChapterPage({ params }: { params: Promise<ChapterParams> }) {
  const { slug } = await params;
  if (slug === RULEBOOK_WELCOME_SLUG) {
    permanentRedirect('/rules');
  }
  const chapter = getRulebookChapter(slug);
  if (!chapter) notFound();

  const { previous, next } = getAdjacentRulebookChapters(chapter.slug);
  const chapterBody = getRulebookChapterComponent(chapter.slug);
  if (!chapterBody) notFound();
  const url = `${getCanonicalSiteUrl()}${getRulebookChapterHref(chapter.slug)}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: chapter.title,
    description: chapter.description,
    url,
  };

  return (
    <PageContainer size="content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader title={chapter.title} description={chapter.description} />

      <p className="mb-6 text-sm text-text-secondary">
        {RULES_COPY.viewSourcePrefix}{' '}
        <a
          href={RULES_COPY.viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary-link-fg hover:underline"
        >
          {RULES_COPY.openInNewTab}
        </a>
      </p>

      <RulebookShell currentSlug={chapter.slug}>
        <RulebookArticle>{createElement(chapterBody)}</RulebookArticle>
        <RulebookPager previous={previous} next={next} />
      </RulebookShell>
    </PageContainer>
  );
}
