/**
 * Horizontal chrome for GridListRow / ListHeader alignment
 * ======================================================
 * Row actions (rightSlot, edit, delete, selection) render outside the inner CSS grid.
 * ListHeader must reserve the same flex footprint so `fr` columns line up with row values.
 *
 * Widths mirror classes in `grid-list-row.tsx` (w-8, w-[4rem] mr-2, w-9, w-11).
 */

/** Matches GridListRow leftSlot wrapper: w-8 min-w-[2rem] */
export const GRID_LIST_ROW_LEFT_SLOT_WIDTH = '2rem';

/**
 * Matches GridListRow rightSlot wrapper: w-[4rem] + margin-right mr-2 (0.5rem).
 * Margin is outside the width box in flex layout, so it consumes extra horizontal space.
 */
export const GRID_LIST_ROW_RIGHT_SLOT_FLEX_WIDTH = 'calc(4rem + 0.5rem)';

/** Matches w-9 (edit / delete icon column) */
export const GRID_LIST_ROW_ICON_COLUMN_WIDTH = '2.25rem';

/** Matches min-w-[44px] w-11 selection column */
export const GRID_LIST_ROW_SELECTION_COLUMN_WIDTH = '2.75rem';

export interface ListHeaderRowChrome {
  /** GridListRow `leftSlot` (e.g. innate / equip toggle) — spacer before header grid */
  leftSlot?: boolean;
  /** GridListRow `rightSlot` (energy / use button) — spacer after header grid */
  rightSlot?: boolean;
  /** GridListRow `onEdit` pencil */
  edit?: boolean;
  /** GridListRow `onDelete` X */
  delete?: boolean;
  /**
   * Selection toggle rendered outside the row grid (rare).
   * Do not combine with `hasSelectionColumn` (that reserves space inside the grid).
   */
  externalSelection?: boolean;
}

export function hasListHeaderRowChrome(rowChrome?: ListHeaderRowChrome): boolean {
  if (!rowChrome) return false;
  return !!(
    rowChrome.leftSlot ||
    rowChrome.rightSlot ||
    rowChrome.edit ||
    rowChrome.delete ||
    rowChrome.externalSelection
  );
}
