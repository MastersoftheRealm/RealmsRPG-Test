import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageShell = readFileSync(new URL('./CreatorPageShell.tsx', import.meta.url), 'utf8');
const pageContainer = readFileSync(new URL('../ui/page-container.tsx', import.meta.url), 'utf8');
const creatorLayout = readFileSync(new URL('./CreatorLayout.tsx', import.meta.url), 'utf8');
const speciesPage = readFileSync(
  new URL('../../app/(main)/species-creator/page.tsx', import.meta.url),
  'utf8',
);
const modal = readFileSync(new URL('../ui/modal.tsx', import.meta.url), 'utf8');

describe('creator page width & sticky summary (batch 7)', () => {
  it('uses page scroll for sticky sidebar (no nested summary scroll)', () => {
    expect(pageShell).toContain('sticky top-20');
    expect(pageShell).toContain('lg:top-24');
    expect(pageShell).not.toContain('overflow-y-auto');
    expect(pageShell).not.toContain('max-h-[calc(100vh');
  });

  it('aligns xl creator gutters with layout-shell-wide', () => {
    expect(pageContainer).toMatch(/size === 'xl' \? 'min-w-0 px-4 sm:px-6 lg:px-24'/);
    expect(pageContainer).not.toMatch(/xl:.*lg:px-24/);
  });

  it('fills the sidebar grid track at desktop', () => {
    expect(creatorLayout).toContain('grid w-full');
    const sidebarCol = creatorLayout.match(/order-1[^"]*lg:order-2/)?.[0] ?? '';
    expect(sidebarCol).toContain('w-full');
    expect(sidebarCol).toContain('min-w-0');
  });

  it('enables species summary sticky chrome like other creators', () => {
    expect(speciesPage).not.toContain('stickySidebar={false}');
  });

  it('compensates scrollbar width when locking body scroll for modals', () => {
    expect(modal).toContain('document.body.style.paddingRight');
    expect(modal).toContain('scrollbarWidth');
  });
});
