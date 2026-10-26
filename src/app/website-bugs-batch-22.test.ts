import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ONBOARDING_FLOATING_CARD_CLASS,
  SHEET_TOUR_NARROW_BOTTOM_PLACEMENT_CLASS,
  SHEET_TOUR_NARROW_MAX_WIDTH_PX,
  sheetTourNarrowPlacementClasses,
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

function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const channels = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('website bugs batch 22 — sheet zoom, tour, dark contrast, taps', () => {
  it('compacts site header and dock chrome on short viewports (86e3jwker)', () => {
    expect(sheetRoute).toContain('data-character-sheet-page');
    expect(sheetRoute).toContain('[--sheet-site-header-offset:5rem]');
    expect(sheetBody).toContain('calc(100svh-var(--sheet-site-header-offset,5rem))');
    expect(globalsCss).toContain('max-height: 28.125rem');
    expect(globalsCss).toMatch(
      /\[data-character-sheet-page\][\s\S]*--sheet-site-header-offset: 3\.5rem/,
    );
    expect(globalsCss).toContain('body:has([data-character-sheet-page]) header.z-header');
    expect(globalsCss).toMatch(/@layer utilities[\s\S]*header\.z-header \.h-20[\s\S]*!important/);
    expect(globalsCss).toMatch(
      /has-sheet-mobile-dock[\s\S]*sheet-mobile-action-dock button[\s\S]*min-height: 2\.5rem !important/,
    );
  });

  it('flips the sheet tour card away from top-half targets on 320px (86e3jwkep)', () => {
    expect(SHEET_TOUR_NARROW_MAX_WIDTH_PX).toBe(480);
    expect(ONBOARDING_FLOATING_CARD_CLASS).not.toContain('max-[480px]:top-');
    expect(sheetTourNarrowPlacementClasses('bottom')).toBe(
      SHEET_TOUR_NARROW_BOTTOM_PLACEMENT_CLASS,
    );
    expect(tourHighlight).toContain('sheetTourCardAnchor');
    expect(tourHighlight).toContain('sheetTourNarrowPlacementClasses');
    expect(tourHighlight).toContain('sheetTourScrollBlock(el)');
  });

  it('raises dark contrast for library tabs, section pills, and logo on sheet (86e3jwkem)', () => {
    expect(librarySection).toContain('character-sheet-library-tabs');
    expect(globalsCss).toMatch(
      /\.dark[\s\S]*\[data-character-sheet-page\][\s\S]*\.character-sheet-library-tabs[\s\S]*\.tab-nav-trigger:not\(\.tab-nav-trigger-active\)/,
    );
    expect(globalsCss).toContain(
      ".dark [data-character-sheet-page] [data-sheet-section-tabs] button[aria-selected='false']",
    );
    expect(globalsCss).toContain("header a[href='/'] img");
    expect(globalsCss).toContain(
      '.dark [data-character-sheet-page] button[data-roll-trigger].bg-success-600',
    );
    expect(globalsCss).toContain('background-color: var(--color-success-dark)');
    expect(globalsCss).toContain(
      '.dark [data-character-sheet-page] button[data-roll-trigger].bg-danger-600',
    );
    expect(globalsCss).toContain('background-color: var(--color-danger-button)');
    // Token pairs for dark sheet RollButtons (text-text-on-dark on solid fills).
    expect(contrastRatio('#f9f9f9', '#055745')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#f9f9f9', '#991b1b')).toBeGreaterThanOrEqual(4.5);
  });

  it('expands sheet tap targets to 44px on coarse pointer only (86e3jwkeh)', () => {
    const sheetStepperHit = '[data-character-sheet-page] .btn-stepper.hit-area-dense::after';
    expect(globalsCss).toMatch(
      /@media \(pointer: coarse\)[\s\S]*\[data-character-sheet-page\] \.btn-stepper\.hit-area-dense::after/,
    );
    expect(globalsCss).toContain(
      '[data-character-sheet-page] [data-sheet-section-tabs] .hit-area-dense::after',
    );
    const stepperIdx = globalsCss.indexOf(sheetStepperHit);
    expect(stepperIdx).toBeGreaterThan(-1);
    const mediaStart = globalsCss.lastIndexOf('@media', stepperIdx);
    expect(globalsCss.slice(mediaStart, mediaStart + 40)).toContain('pointer: coarse');
    expect(globalsCss.slice(mediaStart, mediaStart + 40)).not.toContain('max-width: 767px');
  });
});
