/**
 * Shared sheet tour / milestone highlight helpers (TASK-388).
 */

/** Narrow phones (320px): pin the card to the top so it does not cover the highlight (86e3jwkep). */
export const SHEET_TOUR_NARROW_MAX_WIDTH_PX = 480;

/** Above roll-log FAB (`z-floating`); bottom-left on desktop; room for dice on mobile. */
export const ONBOARDING_FLOATING_CARD_CLASS =
  'fixed z-tour left-4 right-4 max-w-[calc(100vw-2rem)] max-[480px]:top-[max(0.75rem,env(safe-area-inset-top))] max-[480px]:bottom-auto bottom-20 sm:right-20 md:left-4 md:right-auto md:bottom-8 md:w-96';

export function sheetTourScrollBlock(): ScrollLogicalPosition {
  if (typeof window === 'undefined') return 'center';
  return window.innerWidth <= SHEET_TOUR_NARROW_MAX_WIDTH_PX ? 'start' : 'center';
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

/** Scroll into view and apply ring; returns cleanup. */
export function applyTourHighlight(tourId: string): () => void {
  const el = findVisibleTourTarget(tourId);
  if (!el) return () => {};
  el.scrollIntoView({ behavior: 'smooth', block: sheetTourScrollBlock(), inline: 'nearest' });
  el.classList.add(...HIGHLIGHT_CLASSES);
  return () => {
    el.classList.remove(...HIGHLIGHT_CLASSES);
  };
}
