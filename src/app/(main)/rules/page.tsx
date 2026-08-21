/**
 * Rulebook chapter index (ADR-0021).
 */

import Link from 'next/link';
import { PageContainer, PageHeader } from '@/components/ui';
import { RulebookNav } from '@/components/rules/rulebook-nav';
import { RULES_COPY } from '@/lib/constants/site-copy';
import { RULEBOOK_CHAPTERS } from '@/lib/rules/rulebook';

export default function RulesPage() {
  return (
    <PageContainer size="content">
      <PageHeader title={RULES_COPY.pageTitle} description={RULES_COPY.pageDescription} />

      <p className="mb-4 font-nunito text-base leading-relaxed text-text-secondary">
        {RULES_COPY.seoDescription}
      </p>

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
        <RulebookNav chapters={RULEBOOK_CHAPTERS} />
        <ol className="min-w-0 space-y-3">
          {RULEBOOK_CHAPTERS.map((chapter, index) => (
            <li key={chapter.slug}>
              <Link
                href={`/rules/${chapter.slug}`}
                className="block min-w-0 rounded-md px-3 py-2 hover:bg-surface-alt"
              >
                <h2 className="font-display text-lg font-bold text-text-primary">
                  <span className="mr-2 text-text-muted tabular-nums">{index + 1}.</span>
                  {chapter.title}
                </h2>
                <p className="mt-1 text-sm text-text-secondary">{chapter.description}</p>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </PageContainer>
  );
}
