/**
 * Shared sheet tour / milestone highlight helpers (TASK-388).
 */

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
  el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  el.classList.add(...HIGHLIGHT_CLASSES);
  return () => {
    el.classList.remove(...HIGHLIGHT_CLASSES);
  };
}
