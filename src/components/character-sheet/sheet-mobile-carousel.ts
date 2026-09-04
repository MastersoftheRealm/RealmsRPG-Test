/** Mobile sheet C1: one column scroller + snap carousel (TASK-907). */

export const SHEET_CAROUSEL_PANEL_OPTIONS = [
  { value: 'abilities', label: 'Abilities' },
  { value: 'skills', label: 'Skills' },
  { value: 'archetype', label: 'Archetype' },
  { value: 'library', label: 'Library' },
] as const;

export type SheetCarouselPanelId = (typeof SHEET_CAROUSEL_PANEL_OPTIONS)[number]['value'];

export const SHEET_CAROUSEL_AXIS_PX = 8;

const SHEET_CAROUSEL_SNAP_SLACK_PX = 8;

export function isMobileSheetViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
}

function sheetCarouselStride(panelWidth: number, gap: number): number {
  return panelWidth + gap;
}

export function nearestSheetCarouselIndex(
  scrollLeft: number,
  panelWidth: number,
  gap: number,
  count: number,
): number {
  if (count <= 0 || panelWidth <= 0) return 0;
  const stride = sheetCarouselStride(panelWidth, gap);
  const index = Math.round(scrollLeft / stride);
  return Math.max(0, Math.min(count - 1, index));
}

export function isSheetCarouselNearSnap(
  scrollLeft: number,
  panelWidth: number,
  gap: number,
  count: number,
  slack = SHEET_CAROUSEL_SNAP_SLACK_PX,
): boolean {
  if (count <= 0 || panelWidth <= 0) return true;
  const stride = sheetCarouselStride(panelWidth, gap);
  for (let i = 0; i < count; i += 1) {
    if (Math.abs(scrollLeft - i * stride) <= slack) return true;
  }
  return false;
}

export function sheetCarouselGapPx(carousel: HTMLElement): number {
  const raw = getComputedStyle(carousel).columnGap || getComputedStyle(carousel).gap;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 16;
}

export function sheetCarouselPanelScrollLeft(carousel: HTMLElement, panel: HTMLElement): number {
  return (
    panel.getBoundingClientRect().left - carousel.getBoundingClientRect().left + carousel.scrollLeft
  );
}

export function sheetMobilePanels(carousel: HTMLElement): HTMLElement[] {
  return Array.from(carousel.querySelectorAll<HTMLElement>('[data-sheet-mobile-panel]'));
}
