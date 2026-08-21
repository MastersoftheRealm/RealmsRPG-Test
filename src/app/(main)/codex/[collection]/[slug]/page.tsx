/**
 * Codex detail article — server-rendered per-entry page (ADR-0021 / TASK-796).
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageContainer, PageHeader } from '@/components/ui';
import { CODEX_DETAIL_LABEL, isCodexDetailCollection } from '@/lib/codex/detail-href';
import { loadAllCodexDetailParams, loadCodexDetailEntry } from '@/lib/codex/detail-server';
import { getCanonicalSiteUrl } from '@/lib/site-url';
import { truncateText } from '@/lib/utils';

export const revalidate = 3600;
export const dynamicParams = true;

type DetailParams = { collection: string; slug: string };

function metaDescription(text: string, max: number): string {
  return truncateText(text.replace(/\s+/g, ' ').trim(), max);
}

export async function generateStaticParams(): Promise<DetailParams[]> {
  return loadAllCodexDetailParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<DetailParams>;
}): Promise<Metadata> {
  const { collection, slug } = await params;
  if (!isCodexDetailCollection(collection)) return { title: 'Codex' };
  const row = await loadCodexDetailEntry(collection, slug);
  if (!row) return { title: 'Codex' };
  const kind = CODEX_DETAIL_LABEL[collection];
  const description = metaDescription(row.description, 160) || `${kind} in the Realms Codex.`;
  const url = `${getCanonicalSiteUrl()}/codex/${collection}/${slug}`;
  return {
    title: row.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${row.name} | ${kind} | Codex`,
      description,
      url,
      type: 'article',
    },
  };
}

export default async function CodexDetailPage({ params }: { params: Promise<DetailParams> }) {
  const { collection, slug } = await params;
  if (!isCodexDetailCollection(collection)) notFound();
  const row = await loadCodexDetailEntry(collection, slug);
  if (!row) notFound();

  const kind = CODEX_DETAIL_LABEL[collection];
  const url = `${getCanonicalSiteUrl()}/codex/${collection}/${slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: row.name,
    description: metaDescription(row.description, 300),
    url,
  };

  return (
    <PageContainer size="prose">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="mb-3 text-sm text-text-secondary">
        <Link href="/codex" className="font-medium text-primary-link-fg hover:underline">
          Codex
        </Link>
        <span aria-hidden="true"> / </span>
        {kind}
      </p>
      <PageHeader title={row.name} description={kind} />
      {row.description ? (
        <div className="space-y-3 font-nunito text-base leading-relaxed whitespace-pre-wrap text-text-secondary">
          {row.description}
        </div>
      ) : (
        <p className="text-text-muted">No description is recorded for this entry.</p>
      )}
    </PageContainer>
  );
}
