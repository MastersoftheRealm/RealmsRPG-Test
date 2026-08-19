/**
 * Rulebook chapter — server-rendered MDX (ADR-0021 / TASK-796).
 */

import type { Metadata } from 'next';
import { createElement } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageContainer, PageHeader } from '@/components/ui';
import { RulebookArticle } from '@/components/rules/rulebook-article';
import { RulebookNav } from '@/components/rules/rulebook-nav';
import { RULES_COPY } from '@/lib/constants/site-copy';
import { getCanonicalSiteUrl } from '@/lib/site-url';
import { getRulebookChapter, RULEBOOK_CHAPTERS } from '@/lib/rules/rulebook';
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
  const url = `${getCanonicalSiteUrl()}/rules/${chapter.slug}`;
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
  const chapter = getRulebookChapter(slug);
  if (!chapter) notFound();

  const index = RULEBOOK_CHAPTERS.findIndex((entry) => entry.slug === chapter.slug);
  const previous = index > 0 ? RULEBOOK_CHAPTERS[index - 1] : undefined;
  const next =
    index >= 0 && index < RULEBOOK_CHAPTERS.length - 1 ? RULEBOOK_CHAPTERS[index + 1] : undefined;
  const chapterBody = getRulebookChapterComponent(chapter.slug);
  if (!chapterBody) notFound();
  const url = `${getCanonicalSiteUrl()}/rules/${chapter.slug}`;
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

      <div className="md:grid md:grid-cols-[16rem_minmax(0,1fr)] md:items-start md:gap-8">
        <RulebookNav chapters={RULEBOOK_CHAPTERS} currentSlug={chapter.slug} />
        <div className="min-w-0">
          <RulebookArticle>{createElement(chapterBody)}</RulebookArticle>

          <nav
            aria-label="Adjacent chapters"
            className="mt-10 flex flex-col gap-3 border-t border-border-light pt-6 sm:flex-row sm:justify-between"
          >
            {previous ? (
              <Link
                href={`/rules/${previous.slug}`}
                className="min-h-[44px] font-medium text-primary-link-fg hover:underline md:min-h-0"
              >
                ← {previous.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/rules/${next.slug}`}
                className="min-h-[44px] font-medium text-primary-link-fg hover:underline sm:text-right md:min-h-0"
              >
                {next.title} →
              </Link>
            ) : null}
          </nav>
        </div>
      </div>
    </PageContainer>
  );
}
