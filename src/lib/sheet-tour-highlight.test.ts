import { describe, expect, it } from 'vitest';
import {
  isTallSheetTourTarget,
  SHEET_TOUR_NARROW_BOTTOM_PLACEMENT_CLASS,
  SHEET_TOUR_NARROW_MAX_WIDTH_PX,
  SHEET_TOUR_NARROW_TOP_PLACEMENT_CLASS,
  sheetTourCardAnchorForViewport,
  sheetTourNarrowPlacementClasses,
  onboardingHighlightScrollBlock,
  sheetTourStepScrollBlockForViewport,
} from './sheet-tour-highlight';

describe('sheet tour narrow placement (86e3jwkep)', () => {
  it('bottom-docks the card when the target is in the top half at 320px', () => {
    expect(sheetTourCardAnchorForViewport(80, 120, 640, 320)).toBe('bottom');
    expect(sheetTourNarrowPlacementClasses('bottom')).toBe(
      SHEET_TOUR_NARROW_BOTTOM_PLACEMENT_CLASS,
    );
    expect(sheetTourStepScrollBlockForViewport(80, 120, 640, 320)).toBe('start');
  });

  it('top-docks the card when a short target is in the lower half at 320px', () => {
    expect(sheetTourCardAnchorForViewport(440, 120, 640, 320)).toBe('top');
    expect(sheetTourNarrowPlacementClasses('top')).toBe(SHEET_TOUR_NARROW_TOP_PLACEMENT_CLASS);
    expect(sheetTourStepScrollBlockForViewport(440, 120, 640, 320)).toBe('end');
  });

  it('bottom-docks and scrolls to start for tall section targets at 320x568', () => {
    expect(isTallSheetTourTarget(1500, 568)).toBe(true);
    expect(sheetTourCardAnchorForViewport(200, 1500, 568, 320)).toBe('bottom');
    expect(sheetTourStepScrollBlockForViewport(200, 1500, 568, 320)).toBe('start');
  });

  it('uses centered scroll on wide viewports', () => {
    expect(sheetTourCardAnchorForViewport(80, 120, 800, SHEET_TOUR_NARROW_MAX_WIDTH_PX + 1)).toBe(
      'bottom',
    );
    expect(
      sheetTourStepScrollBlockForViewport(80, 120, 800, SHEET_TOUR_NARROW_MAX_WIDTH_PX + 1),
    ).toBe('center');
  });

  it('keeps shared narrow scroll at start for non–SheetTour highlights (#453)', () => {
    expect(onboardingHighlightScrollBlock()).toBe('center');
  });
});
