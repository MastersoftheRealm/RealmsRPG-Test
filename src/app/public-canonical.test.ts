import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { describe, expect, it } from 'vitest';
import { metadata as homeMetadata } from '@/app/(main)/page';
import { metadata as aboutMetadata } from '@/app/(main)/about/layout';
import { metadata as codexMetadata } from '@/app/(main)/codex/layout';
import { metadata as resourcesMetadata } from '@/app/(main)/resources/layout';
import { metadata as privacyMetadata } from '@/app/(main)/privacy/page';
import { metadata as termsMetadata } from '@/app/(main)/terms/page';
import { metadata as libraryMetadata } from '@/app/(main)/library/layout';
import { metadata as newCharacterMetadata } from '@/app/(main)/characters/new/page';
import { metadata as rulesMetadata } from '@/app/(main)/rules/layout';
import { SITEMAP_PATHS } from '@/app/sitemap';
import { rulebookChapterMetadata } from '@/lib/rules/rulebook-metadata';

function canonicalPath(metadata: Metadata): string {
  const canonical = metadata.alternates?.canonical;
  if (canonical == null) throw new Error('missing canonical');
  const raw =
    typeof canonical === 'string'
      ? canonical
      : canonical instanceof URL
        ? canonical.toString()
        : String(canonical.url);
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    const pathname = new URL(raw).pathname;
    return pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname || '/';
  }
  return raw === '' ? '/' : raw;
}

const STATIC_CANONICALS: Record<string, Metadata> = {
  '/': homeMetadata,
  '/about': aboutMetadata,
  '/codex': codexMetadata,
  '/resources': resourcesMetadata,
  '/privacy': privacyMetadata,
  '/terms': termsMetadata,
  '/library': libraryMetadata,
  '/characters/new': newCharacterMetadata,
};

describe('public page canonicals (1dfe8wf24wz)', () => {
  it('does not set a sitewide homepage canonical on the root layout', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/app/layout.tsx'), 'utf8');
    expect(source).toMatch(/metadataBase/);
    expect(source).not.toMatch(/canonical\s*:/);
  });

  it('gives every sitemap path its own canonical', () => {
    const slugPage = readFileSync(
      path.join(process.cwd(), 'src/app/(main)/rules/[slug]/page.tsx'),
      'utf8',
    );
    expect(slugPage).toContain('rulebookChapterMetadata');

    for (const sitemapPath of SITEMAP_PATHS) {
      if (sitemapPath === '/rules') {
        expect(canonicalPath(rulesMetadata)).toBe('/rules');
        continue;
      }
      if (sitemapPath.startsWith('/rules/')) {
        const slug = sitemapPath.slice('/rules/'.length);
        expect(canonicalPath(rulebookChapterMetadata(slug))).toBe(sitemapPath);
        continue;
      }
      const metadata = STATIC_CANONICALS[sitemapPath];
      expect(metadata, sitemapPath).toBeDefined();
      expect(canonicalPath(metadata!)).toBe(sitemapPath);
    }
  });
});
