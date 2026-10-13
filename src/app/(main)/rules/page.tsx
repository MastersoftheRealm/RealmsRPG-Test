/**
 * Rulebook chapter index — opens at Welcome (ADR-0021 / TASK-905).
 */

import { createElement } from 'react';
import { PageContainer, PageHeader } from '@/components/ui';
import { RulebookArticle } from '@/components/rules/rulebook-article';
import { RulebookPager } from '@/components/rules/rulebook-pager';
import { RulebookShell } from '@/components/rules/rulebook-shell';
import { RULES_COPY } from '@/lib/constants/site-copy';
import { getAdjacentRulebookChapters, RULEBOOK_WELCOME_SLUG } from '@/lib/rules/rulebook';
import { getRulebookChapterComponent } from '@/content/rules';

export default function RulesPage() {
  const welcome = getRulebookChapterComponent(RULEBOOK_WELCOME_SLUG);
  const { next } = getAdjacentRulebookChapters(RULEBOOK_WELCOME_SLUG);

  return (
    <PageContainer size="content">
      <PageHeader title={RULES_COPY.pageTitle} description={RULES_COPY.pageDescription} />

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

      <RulebookShell currentSlug={RULEBOOK_WELCOME_SLUG}>
        {welcome ? <RulebookArticle>{createElement(welcome)}</RulebookArticle> : null}
        <RulebookPager next={next} />
      </RulebookShell>
    </PageContainer>
  );
}
