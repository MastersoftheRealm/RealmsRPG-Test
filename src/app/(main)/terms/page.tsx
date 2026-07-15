/**
 * Terms of Service Page
 * ======================
 * Edit prose in terms-copy.ts.
 */

import type { Metadata } from 'next';
import { PageContainer, PageHeader } from '@/components/ui';
import { TERMS_COPY } from '@/lib/constants/site-copy';
import type { LegalListItem } from '@/lib/constants/copy/terms-copy';

export const metadata: Metadata = {
  title: TERMS_COPY.pageTitle,
  description: TERMS_COPY.seoDescription,
};

function LegalList({ items }: { items?: readonly LegalListItem[] }) {
  if (!items?.length) return null;
  return (
    <ul className="list-disc list-inside text-text-secondary space-y-1">
      {items.map((item) =>
        typeof item === 'string' ? (
          <li key={item}>{item}</li>
        ) : (
          <li key={item.label}>
            <strong>{item.label}</strong> – {item.text}
          </li>
        )
      )}
    </ul>
  );
}

export default function TermsPage() {
  return (
    <PageContainer size="prose">
      <PageHeader title={TERMS_COPY.pageTitle} />

      <div className="prose prose-gray max-w-none space-y-8">
        <p className="text-text-secondary">{TERMS_COPY.intro}</p>

        {TERMS_COPY.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-semibold text-text-primary mb-4">{section.heading}</h2>
            {section.paragraphs.map((para, i) => (
              <p
                key={`${section.heading}-p-${i}`}
                className={
                  section.list || i < section.paragraphs.length - 1
                    ? 'text-text-secondary mb-3'
                    : 'text-text-secondary'
                }
              >
                {para}
              </p>
            ))}
            <LegalList items={section.list} />
            {'afterList' in section &&
              section.afterList?.map((para, i) => (
                <p key={`${section.heading}-after-${i}`} className="text-text-secondary mt-3">
                  {para}
                </p>
              ))}
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
