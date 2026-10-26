import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ONBOARDING_FLOATING_CARD_CLASS,
  SHEET_TOUR_NARROW_MAX_WIDTH_PX,
  sheetTourScrollBlock,
} from '@/lib/sheet-tour-highlight';

const globalsCss = readFileSync(new URL('./globals.css', import.meta.url), 'utf8');
const sheetRoute = readFileSync(
  new URL('./(detail)/characters/[id]/character-sheet-route.tsx', import.meta.url),
  'utf8',
);
const sheetBody = readFileSync(
  new URL('../components/character-sheet/character-sheet-body.tsx', import.meta.url),
  'utf8',
);
const librarySection = readFileSync(
  new URL('../components/character-sheet/library-section.tsx', import.meta.url),
  'utf8',
);
const tourHighlight = readFileSync(
  new URL('../lib/sheet-tour-highlight.ts', import.meta.url),
  'utf8',
);

describe('website bugs batch 22 — sheet zoom, tour, dark contrast, taps', () => {
  it('compacts site header and dock chrome on short viewports (86e3jwker)', () => {
    expect(sheetRoute).toContain('data-character-sheet-page');
    expect(sheetRoute).toContain('[--sheet-site-header-offset:5rem]');
    expect(sheetBody).toContain('calc(100svh-var(--sheet-site-header-offset,5rem))');
    expect(globalsCss).toContain('max-height: 28rem');
    expect(globalsCss).toMatch(
      /\[data-character-sheet-page\][\s\S]*--sheet-site-header-offset: 3\.5rem/,
    );
    expect(globalsCss).toContain('body:has([data-character-sheet-page]) header.z-header');
  });

  it('pins the sheet tour card to the top on 320px-wide viewports (86e3jwkep)', () => {
    expect(SHEET_TOUR_NARROW_MAX_WIDTH_PX).toBe(480);
    expect(ONBOARDING_FLOATING_CARD_CLASS).toContain('max-[480px]:bottom-auto');
    expect(ONBOARDING_FLOATING_CARD_CLASS).toContain('max-[480px]:top-');
    expect(tourHighlight).toContain('sheetTourScrollBlock()');
    expect(sheetTourScrollBlock()).toBe('center');
  });

  it('raises dark contrast for library tabs, section pills, and logo on sheet (86e3jwkem)', () => {
    expect(librarySection).toContain('character-sheet-library-tabs');
    expect(globalsCss).toContain(
      '.dark [data-character-sheet-page] .character-sheet-library-tabs .tab-nav-trigger:not(.tab-nav-trigger-active)',
    );
    expect(globalsCss).toContain(
      ".dark [data-character-sheet-page] [data-sheet-section-tabs] button[aria-selected='false']",
    );
    expect(globalsCss).toContain("header a[href='/'] img");
  });

  it('expands sheet mobile tap targets to 44px (86e3jwkeh)', () => {
    expect(globalsCss).toMatch(
      /@media \(max-width: 767px\)[\s\S]*\[data-character-sheet-page\] \.btn-stepper\.hit-area-dense::after/,
    );
    expect(globalsCss).toContain('[data-character-sheet-page] .hit-area-layout-neutral::after');
    expect(globalsCss).toContain('[data-sheet-section-tabs] .hit-area-dense::after');
  });
});
