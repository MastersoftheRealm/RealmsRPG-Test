import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { isSheetCarouselNearSnap, nearestSheetCarouselIndex } from './sheet-mobile-carousel';

const sheetBody = readFileSync(path.join(import.meta.dirname, 'character-sheet-body.tsx'), 'utf8');
const globals = readFileSync(path.join(import.meta.dirname, '../../app/globals.css'), 'utf8');
const sheetPage = readFileSync(
  path.join(import.meta.dirname, '../../app/(main)/characters/[id]/page.tsx'),
  'utf8',
);
const toolbar = readFileSync(path.join(import.meta.dirname, 'sheet-action-toolbar.tsx'), 'utf8');
const modal = readFileSync(path.join(import.meta.dirname, '../ui/modal.tsx'), 'utf8');

describe('sheet mobile carousel snap math (TASK-907)', () => {
  it('uses panel width plus gap as the snap stride', () => {
    expect(nearestSheetCarouselIndex(0, 360, 16, 4)).toBe(0);
    expect(nearestSheetCarouselIndex(376, 360, 16, 4)).toBe(1);
    expect(nearestSheetCarouselIndex(752, 360, 16, 4)).toBe(2);
  });

  it('picks the nearest panel from scrollLeft', () => {
    expect(nearestSheetCarouselIndex(180, 360, 16, 4)).toBe(0);
    expect(nearestSheetCarouselIndex(200, 360, 16, 4)).toBe(1);
    expect(nearestSheetCarouselIndex(9999, 360, 16, 4)).toBe(3);
    expect(nearestSheetCarouselIndex(-20, 360, 16, 4)).toBe(0);
  });

  it('treats rest-state offsets as snapped and mid-swipe as not', () => {
    expect(isSheetCarouselNearSnap(0, 360, 16, 4)).toBe(true);
    expect(isSheetCarouselNearSnap(376, 360, 16, 4)).toBe(true);
    expect(isSheetCarouselNearSnap(8, 360, 16, 4)).toBe(true);
    expect(isSheetCarouselNearSnap(40, 360, 16, 4)).toBe(false);
  });
});

describe('sheet carousel C1 chrome (TASK-907)', () => {
  it('uses a section switcher, not the tab-strip fade mask', () => {
    expect(sheetBody).toContain('data-sheet-mobile-carousel');
    expect(sheetBody).toContain('data-sheet-mobile-column');
    expect(sheetBody).toContain('SegmentedControl');
    expect(sheetBody).not.toContain('tabListOverflowState');
    expect(sheetBody).not.toContain('TabNavOverflowScroller');
    expect(sheetBody).not.toContain('max-h-[50%]');
    expect(sheetBody).not.toContain('nextSheetHeaderCollapsed');
    expect(globals).not.toContain("[data-sheet-mobile-carousel][data-overflow-end='true']");
    expect(globals).toContain('[data-sheet-mobile-column]');
  });
});

describe('narrow sheet clearance (86e3jt15m)', () => {
  it('reserves the FAB on every sheet frame and the owner dock when that strip is mounted', () => {
    expect(globals).toContain(
      '--sheet-mobile-bottom-reserve: var(--sheet-mobile-fab-gutter)',
    );
    expect(globals).toContain(
      '--sheet-mobile-bottom-reserve: var(--sheet-mobile-dock-height)',
    );
    expect(globals).toContain('padding-bottom: var(--sheet-mobile-bottom-reserve)');
    expect(globals).toContain('body:has(.floating-dock-bottom-right) footer');
    expect(sheetBody).toContain('max-md:min-w-0');
  });

  it('keeps modal footers above the roll-log dock and view-only copy in the page flow', () => {
    expect(modal).toContain('z-modal');
    expect(modal).not.toContain('z-overlay');
    expect(globals).toContain('--z-index-modal: 1050');
    expect(globals).toContain("body:has([aria-modal='true']) .floating-dock-bottom-right");
    expect(toolbar).not.toContain('fixed top-24');
    expect(sheetPage).toContain('View only');
    expect(sheetPage).toContain('isOwner ? CHARACTER_SHEET_MOBILE_DOCK_SCOPE_CLASSNAME');
  });
});
