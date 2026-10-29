/**
 * Terms of Service Page
 * ======================
 * Edit prose in terms-copy.ts.
 */

import type { Metadata } from 'next';
import { LegalDocumentBody } from '@/components/legal/legal-document-body';
import { PageContainer, PageHeader } from '@/components/ui';
import { TERMS_COPY } from '@/lib/constants/site-copy';

export const metadata: Metadata = {
  title: TERMS_COPY.pageTitle,
  description: TERMS_COPY.seoDescription,
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <PageContainer size="prose">
      <PageHeader title={TERMS_COPY.pageTitle} />
      <LegalDocumentBody copy={TERMS_COPY} />
    </PageContainer>
  );
}
