import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PAGE_FILLS_VIEWPORT_CLASSNAME } from './page-container';

const repoSrc = path.join(import.meta.dirname, '../..');

/** Lab CLS fails: short first paint, then a taller list or tracker (86e3k9fyg). */
const PAGES = [
  'app/(main)/encounters/[id]/combat/page.tsx',
  'app/(main)/codex/page.tsx',
  'app/(main)/characters/page.tsx',
] as const;

describe('page fills the viewport so the site footer starts below the fold (86e3k9fyg)', () => {
  it('reserves one viewport on the page body', () => {
    expect(PAGE_FILLS_VIEWPORT_CLASSNAME).toBe('min-h-screen');
  });

  it('uses that reserve on every combat, codex, and characters container', () => {
    for (const relativePath of PAGES) {
      const source = readFileSync(path.join(repoSrc, relativePath), 'utf8');
      const containers = source.match(/<PageContainer\b/g) ?? [];
      const reserves = source.match(/className=\{PAGE_FILLS_VIEWPORT_CLASSNAME\}/g) ?? [];
      expect(containers.length).toBeGreaterThan(0);
      expect(reserves.length).toBe(containers.length);
    }
  });
});
