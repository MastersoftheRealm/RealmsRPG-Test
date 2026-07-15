/**
 * Width an expanded chip can grow to without leaving its flex-wrap row.
 * Measured from the chip's left edge to the chip group's content right edge so
 * the toggle stays under the pointer (siblings may wrap below).
 *
 * When the chip sits in a local wrapper with trailing siblings (e.g. remove ×),
 * those siblings’ widths are reserved so actions stay on the same cluster.
 */

export type MeasureStableExpandWidthOptions = {
  /** Prefer the collapsed-frame left edge so post-expand chrome (ring) cannot shift width. */
  leftOverride?: number;
};

export function measureStableExpandWidth(
  el: HTMLElement,
  opts?: MeasureStableExpandWidthOptions
): number {
  const group =
    (el.closest('[data-chip-group]') as HTMLElement | null) ?? el.parentElement;
  if (!group) return Math.ceil(el.getBoundingClientRect().width);

  const groupRect = group.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const padRight = parseFloat(getComputedStyle(group).paddingRight) || 0;
  let rightLimit = groupRect.right - padRight;

  const local = el.parentElement;
  if (local && local !== group) {
    let trailing = 0;
    let siblingCount = 0;
    let sib = el.nextElementSibling as HTMLElement | null;
    while (sib) {
      trailing += sib.getBoundingClientRect().width;
      siblingCount += 1;
      sib = sib.nextElementSibling as HTMLElement | null;
    }
    if (siblingCount > 0) {
      const gap = parseFloat(getComputedStyle(local).columnGap || getComputedStyle(local).gap) || 0;
      rightLimit -= trailing + gap * siblingCount;
    }
  }

  const left = opts?.leftOverride ?? elRect.left;
  const available = Math.floor(rightLimit - left);
  return Math.max(Math.ceil(elRect.width), available, 0);
}
