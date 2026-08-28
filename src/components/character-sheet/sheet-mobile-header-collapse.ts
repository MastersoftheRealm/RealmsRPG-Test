/** Collapse after real panel travel; restore only at the top (TASK-902 hysteresis). */
const SHEET_HEADER_COLLAPSE_SCROLL_PX = 48;
const SHEET_HEADER_EXPAND_SCROLL_PX = 0;

export function nextSheetHeaderCollapsed(collapsed: boolean, scrollTop: number): boolean {
  if (collapsed) return scrollTop > SHEET_HEADER_EXPAND_SCROLL_PX;
  return scrollTop > SHEET_HEADER_COLLAPSE_SCROLL_PX;
}
