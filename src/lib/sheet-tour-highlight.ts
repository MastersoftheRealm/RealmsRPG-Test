/**
 * Shared sheet tour / milestone highlight helpers (TASK-388).
 */

/** Narrow phones (320px): flip card above/below the highlight (86e3jwkep). */
export const SHEET_TOUR_NARROW_MAX_WIDTH_PX = 480;

/** Above roll-log FAB (`z-floating`); bottom-left on desktop; room for dice on mobile. */
export const ONBOARDING_FLOATING_CARD_BASE_CLASS =
  'fixed z-tour left-4 right-4 max-w-[calc(100vw-2rem)] bottom-20 sm:right-20 md:left-4 md:right-auto md:bottom-8 md:w-96';

/** Narrow pin for shared onboarding cards (LevelUpGuideCard — TASK-388 / #453). */
export const ONBOARDING_FLOATING_CARD_NARROW_TOP_PIN_CLASS =
  'max-[480px]:top-[max(0.75rem,env(safe-area-inset-top))] max-[480px]:bottom-auto';

export const ONBOARDING_FLOATING_CARD_CLASS = `${ONBOARDING_FLOATING_CARD_BASE_CLASS} ${ONBOARDING_FLOATING_CARD_NARROW_TOP_PIN_CLASS}`;

/** Narrow viewport: card above the dock strip (target in lower half). */
export const SHEET_TOUR_NARROW_TOP_PLACEMENT_CLASS =
  'max-[480px]:top-[max(0.75rem,env(safe-area-inset-top))] max-[480px]:bottom-auto';

/** Narrow viewport: card above dock FAB (target in upper half). */
export const SHEET_TOUR_NARROW_BOTTOM_PLACEMENT_CLASS =
  'max-[480px]:bottom-20 max-[480px]:top-auto';

export type SheetTourNarrowAnchor = 'top' | 'bottom';

/** Pure placement math for unit tests and runtime. */
export function sheetTourCardAnchorForViewport(
  targetMidY: number,
  viewportHeight: number,
  viewportWidth: number,
): SheetTourNarrowAnchor {
  if (viewportWidth > SHEET_TOUR_NARROW_MAX_WIDTH_PX) return 'bottom';
  return targetMidY < viewportHeight / 2 ? 'bottom' : 'top';
}

/** Bottom-dock when the target sits in the top half of the viewport (86e3jwkep). */
export function sheetTourCardAnchor(target: HTMLElement | null): SheetTourNarrowAnchor {
  if (!target || typeof window === 'undefined') return 'bottom';
  const rect = target.getBoundingClientRect();
  return sheetTourCardAnchorForViewport(
    rect.top + rect.height / 2,
    window.innerHeight,
    window.innerWidth,
  );
}

export function sheetTourNarrowPlacementClasses(anchor: SheetTourNarrowAnchor): string {
  return anchor === 'top'
    ? SHEET_TOUR_NARROW_TOP_PLACEMENT_CLASS
    : SHEET_TOUR_NARROW_BOTTOM_PLACEMENT_CLASS;
}

/** Shared highlight scroll (LevelUpGuideCard and other non–SheetTour callers — #453). */
export function onboardingHighlightScrollBlock(): ScrollLogicalPosition {
  if (typeof window === 'undefined') return 'center';
  return window.innerWidth <= SHEET_TOUR_NARROW_MAX_WIDTH_PX ? 'start' : 'center';
}

export function sheetTourStepScrollBlockForViewport(
  targetMidY: number,
  viewportHeight: number,
  viewportWidth: number,
): ScrollLogicalPosition {
  if (viewportWidth > SHEET_TOUR_NARROW_MAX_WIDTH_PX) return 'center';
  const anchor = sheetTourCardAnchorForViewport(targetMidY, viewportHeight, viewportWidth);
  return anchor === 'bottom' ? 'start' : 'end';
}

export function sheetTourStepScrollBlock(target?: HTMLElement | null): ScrollLogicalPosition {
  if (typeof window === 'undefined') return 'center';
  const mid = target
    ? target.getBoundingClientRect().top + target.getBoundingClientRect().height / 2
    : window.innerHeight / 2;
  return sheetTourStepScrollBlockForViewport(mid, window.innerHeight, window.innerWidth);
}

const HIGHLIGHT_CLASSES = [
  'ring-2',
  'ring-primary-link-fg',
  'ring-offset-2',
  'ring-offset-background',
] as const;

export function findVisibleTourTarget(tourId: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const nodes = Array.from(document.querySelectorAll(`[data-tour-id="${tourId}"]`));
  const el = nodes.find((n) => {
    if (!(n instanceof HTMLElement)) return false;
    const style = window.getComputedStyle(n);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    const rect = n.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  }) as HTMLElement | undefined;
  return el ?? null;
}

function scrollHighlightIntoView(el: HTMLElement, block: ScrollLogicalPosition): void {
  el.scrollIntoView({ behavior: 'smooth', block, inline: 'nearest' });
}

/** Scroll into view and apply ring; returns cleanup. */
export function applyTourHighlight(tourId: string): () => void {
  const el = findVisibleTourTarget(tourId);
  if (!el) return () => {};
  scrollHighlightIntoView(el, onboardingHighlightScrollBlock());
  el.classList.add(...HIGHLIGHT_CLASSES);
  return () => {
    el.classList.remove(...HIGHLIGHT_CLASSES);
  };
}

/** Sheet tour step highlight — flips scroll when the card bottom-docks (86e3jwkep). */
export function applySheetTourStepHighlight(tourId: string): () => void {
  const el = findVisibleTourTarget(tourId);
  if (!el) return () => {};
  scrollHighlightIntoView(el, sheetTourStepScrollBlock(el));
  el.classList.add(...HIGHLIGHT_CLASSES);
  return () => {
    el.classList.remove(...HIGHLIGHT_CLASSES);
  };
}
