/**
 * Privacy Policy Page
 * =====================
 * Edit prose in privacy-copy.ts.
 */

import type { Metadata } from 'next';
import { LegalDocumentBody } from '@/components/legal/legal-document-body';
import { PageContainer, PageHeader } from '@/components/ui';
import { PRIVACY_COPY } from '@/lib/constants/site-copy';

export const metadata: Metadata = {
  title: PRIVACY_COPY.pageTitle,
  description: PRIVACY_COPY.seoDescription,
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <PageContainer size="prose">
      <PageHeader title={PRIVACY_COPY.pageTitle} />
      <LegalDocumentBody copy={PRIVACY_COPY} />
    </PageContainer>
  );
}
