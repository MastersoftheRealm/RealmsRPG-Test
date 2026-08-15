/**
 * Rules Page
 * ===========
 * Core rulebook embedded from Google Docs — edit prose in rules-copy.ts.
 */

import { PageContainer, PageHeader, Card } from '@/components/ui';
import { RULES_COPY } from '@/lib/constants/site-copy';

export default function RulesPage() {
  return (
    <PageContainer size="xl">
      <PageHeader title={RULES_COPY.pageTitle} description={RULES_COPY.pageDescription} />

      <p className="mb-4 text-sm text-text-secondary">
        {RULES_COPY.embedTroublePrefix}{' '}
        <a
          href={RULES_COPY.viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary-link-fg hover:underline"
        >
          {RULES_COPY.openInNewTab}
        </a>
      </p>

      <Card className="overflow-hidden border-0 p-0 shadow-lg">
        <iframe
          src={RULES_COPY.embedUrl}
          className="w-full border-0"
          style={{ height: 'min(900px, calc(100vh - 220px))' }}
          allowFullScreen
          title={RULES_COPY.iframeTitle}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </Card>
    </PageContainer>
  );
}
