/**
 * Privacy Policy Page
 * =====================
 * Edit prose in privacy-copy.ts.
 */

import type { Metadata } from 'next';
import { PageContainer, PageHeader } from '@/components/ui';
import { PRIVACY_COPY } from '@/lib/constants/site-copy';
import type { LegalListItem } from '@/lib/constants/copy/privacy-copy';

export const metadata: Metadata = {
  title: PRIVACY_COPY.pageTitle,
  description: PRIVACY_COPY.seoDescription,
};

function LegalList({ items }: { items?: readonly LegalListItem[] }) {
  if (!items?.length) return null;
  return (
    <ul className="list-inside list-disc space-y-1 text-text-secondary">
      {items.map((item) =>
        typeof item === 'string' ? (
          <li key={item}>{item}</li>
        ) : (
          <li key={item.label}>
            <strong>{item.label}</strong> – {item.text}
          </li>
        ),
      )}
    </ul>
  );
}

export default function PrivacyPage() {
  const email = PRIVACY_COPY.contactEmail;
  return (
    <PageContainer size="prose">
      <PageHeader title={PRIVACY_COPY.pageTitle} />

      <div className="prose prose-gray max-w-none space-y-8">
        <p className="text-text-secondary">
          {PRIVACY_COPY.intro.beforeLink}{' '}
          <a
            href={PRIVACY_COPY.siteUrl}
            className="text-primary-link-fg underline underline-offset-2 hover:opacity-90"
          >
            {PRIVACY_COPY.siteUrl}
          </a>
          {PRIVACY_COPY.intro.afterLink}
        </p>

        {PRIVACY_COPY.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-4 text-xl font-semibold text-text-primary">{section.heading}</h2>
            {section.paragraphs.map((para, i) => (
              <p
                key={`${section.heading}-p-${i}`}
                className={
                  i < section.paragraphs.length - 1 || section.list || section.contactEmail
                    ? 'mb-3 text-text-secondary'
                    : 'text-text-secondary'
                }
              >
                {para}
                {section.contactEmail && i === section.paragraphs.length - 1 ? (
                  <>
                    {' '}
                    <a
                      href={`mailto:${email}`}
                      className="text-primary-link-fg underline underline-offset-2 hover:opacity-90"
                    >
                      {email}
                    </a>
                    .
                  </>
                ) : null}
              </p>
            ))}
            <LegalList items={section.list} />
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
