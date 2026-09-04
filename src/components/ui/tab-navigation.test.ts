import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { scrollDeltaToRevealChild, tabListOverflowState } from './tab-navigation';

const tabNav = readFileSync(path.join(import.meta.dirname, 'tab-navigation.tsx'), 'utf8');
const globals = readFileSync(path.join(import.meta.dirname, '../../app/globals.css'), 'utf8');
const libraryTabNav = readFileSync(
  path.join(import.meta.dirname, '../character-sheet/use-library-tab-navigation.tsx'),
  'utf8',
);
const codexPage = readFileSync(
  path.join(import.meta.dirname, '../../app/(main)/codex/page.tsx'),
  'utf8',
);

describe('TabNavigation trailing + labelMobile (TASK-827)', () => {
  it('uses labelMobile below md and full label from md', () => {
    expect(tabNav).toMatch(/labelMobile\?: string \| undefined/);
    expect(tabNav).toContain('md:hidden');
    expect(tabNav).toContain('hidden md:inline');
  });

  it('keeps trailing outside the tablist scrollport', () => {
    expect(tabNav).toMatch(/trailing\?: React\.ReactNode/);
    expect(tabNav).toContain('tab-nav-with-trailing');
    expect(tabNav).toContain('tab-nav-trailing');
    expect(globals).toContain('.tab-nav-with-trailing');
    expect(globals).toMatch(/\.tab-nav-with-trailing \.tab-nav-scroll/);
    expect(globals).toContain('md:flex-row');
  });

  it('puts Codex Advanced in trailing, not a sibling overlay slab', () => {
    expect(codexPage).toMatch(/trailing=\{/);
    expect(codexPage).toContain('Advanced');
    expect(codexPage).not.toContain('min-h-[44px]');
    expect(codexPage).not.toMatch(/flex min-w-0 items-center gap-2/);
  });
});

describe('TabNavigation overflow affordance (TASK-840)', () => {
  it('reports start/end overflow from scroll metrics', () => {
    expect(tabListOverflowState(0, 324, 324)).toEqual({ start: false, end: false });
    expect(tabListOverflowState(0, 324, 541)).toEqual({ start: false, end: true });
    expect(tabListOverflowState(100, 324, 541)).toEqual({ start: true, end: true });
    expect(tabListOverflowState(217, 324, 541)).toEqual({ start: true, end: false });
  });

  it('treats 1–2px slack as no overflow (TASK-890)', () => {
    expect(tabListOverflowState(0, 324, 325)).toEqual({ start: false, end: false });
    expect(tabListOverflowState(0, 324, 326)).toEqual({ start: false, end: false });
    expect(tabListOverflowState(0, 324, 340)).toEqual({ start: false, end: true });
  });

  it('scrolls chevrons to list edges and clips vertical overflow (TASK-890)', () => {
    expect(tabNav).toContain('scrollTo');
    expect(tabNav).toMatch(/direction === -1 \? 0 : maxScroll/);
    expect(globals).toContain('overflow-y-hidden');
  });

  it('keeps sheet hide-eyes Dense instead of 44px slabs (TASK-887)', () => {
    expect(libraryTabNav).toContain('size="sm"');
    expect(libraryTabNav).not.toContain('min-h-[44px]');
    expect(libraryTabNav).not.toContain('min-w-[44px]');
  });

  it('reveals a clipped child by scrolling the list only', () => {
    const list = { left: 0, right: 324 };
    expect(scrollDeltaToRevealChild(list, { left: 40, right: 80 }, 40)).toBe(0);
    expect(scrollDeltaToRevealChild(list, { left: 400, right: 500 }, 40)).toBe(216);
    expect(scrollDeltaToRevealChild(list, { left: -30, right: 40 }, 40)).toBe(-70);
    expect(tabNav).not.toMatch(/\.scrollIntoView\s*\(/);
  });

  it('fades overflowing edges and mounts chevrons outside the tablist', () => {
    expect(tabNav).toContain('tab-nav-scroll');
    expect(tabNav).toContain('Show more tabs');
    expect(tabNav).toContain('Show previous tabs');
    expect(tabNav).toContain('TabNavOverflowScroller');
    expect(tabNav).not.toContain('UnderlineTabScroller');
    expect(globals).toContain('mask-image');
    expect(globals).toContain('.tab-nav-scroll-btn');
    expect(globals).toContain("[data-overflow-end='true']");
    expect(globals).toContain('3.25rem');
  });
});

describe('Guided rails reuse tab overflow chrome (TASK-848)', () => {
  const guidedShell = readFileSync(
    path.join(import.meta.dirname, '../guided-creator/guided-creator-shell.tsx'),
    'utf8',
  );

  it('wires ChapterRail onto TabNavOverflowScroller', () => {
    expect(guidedShell).toContain('TabNavOverflowScroller');
    expect(guidedShell).toContain('Show more chapters');
    expect(guidedShell).not.toMatch(/overflow-x-auto/);
    expect(guidedShell).not.toMatch(/\.scrollIntoView\s*\(/);
  });

  it('does not add a second overflow helper or shared/ui file', () => {
    expect(tabNav).toContain('tabListOverflowState');
    expect(tabNav).toContain('scrollDeltaToRevealChild');
    expect(tabNav).toContain('querySelector(\'[aria-current="step"]\')');
    expect(tabNav).toMatch(/type OverflowListTag = 'nav' \| 'ol'/);
    expect(guidedShell).not.toContain('getActiveElement');
  });
});
