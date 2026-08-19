/**
 * Keep a catalog visually stable when a block above it grows or shrinks
 * (TASK-728: L3 Selected panel insert). Height delta is independent of the
 * user's current scroll position — unlike comparing getBoundingClientRect().top
 * across frames, which fights manual scrolling.
 */

type VerticalScroller = {
  scrollBy?: ((x: number, y: number) => void) | undefined;
  scrollTop?: number | undefined;
};

function applyVerticalScrollDelta(scroller: VerticalScroller, delta: number): void {
  if (delta === 0) return;
  if (typeof scroller.scrollBy === 'function') {
    scroller.scrollBy(0, delta);
    return;
  }
  if (typeof scroller.scrollTop === 'number') {
    scroller.scrollTop += delta;
  }
}

export function nearestVerticalScroller(start: Element | null): Window | HTMLElement {
  let parent = start?.parentElement ?? null;
  while (parent) {
    const overflowY = getComputedStyle(parent).overflowY as string;
    if (
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      parent.scrollHeight > parent.clientHeight + 1
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return window;
}

/**
 * After layout, shift the scroller by the selected-region height change so the
 * catalog (and pointer) stay put. Skip on first paint / catalog hydrate so we
 * do not steal scroll when a draft already has selections.
 */
export function stabilizeAfterSelectedHeightChange(args: {
  previousHeight: number;
  nextHeight: number;
  skip: boolean;
  scroller: VerticalScroller | null;
}): number {
  const { previousHeight, nextHeight, skip, scroller } = args;
  if (!skip && scroller) {
    applyVerticalScrollDelta(scroller, nextHeight - previousHeight);
  }
  return nextHeight;
}
