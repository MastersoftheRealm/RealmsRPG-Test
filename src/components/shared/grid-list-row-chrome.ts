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

/**
 * Grid track appended for inline selection toggles — pair with `ListHeader hasSelectionColumn`
 * on **custom** Modal + GridListRow lists (e.g. add-proficiency). Do **not** pre-wrap columns
 * passed into `UnifiedSelectionModal` — it applies `gridColumnsWithInlineSelection` internally.
 * Matches `GridListRow` inline selection wrapper (`min-w-[44px] w-11`).
 */
export const GRID_LIST_INLINE_SELECTION_COLUMN_TRACK = GRID_LIST_ROW_SELECTION_COLUMN_WIDTH;

/** Append the standard inline selection column track (must match ListHeader `hasSelectionColumn`). */
export function gridColumnsWithInlineSelection(gridColumns: string): string {
  return `${gridColumns} ${GRID_LIST_INLINE_SELECTION_COLUMN_TRACK}`;
}

/** Matches ListRowThumbnail button: w-11 h-11 (44px) — first grid track when `GridListRow.thumbnail` is set */
export const GRID_LIST_ROW_THUMBNAIL_COLUMN_WIDTH = '2.75rem';

export const THUMBNAIL_HEADER_COLUMN_KEY = '_thumbnail';

/** Prepend fixed thumb track so name/data columns align with ListHeader when art column is present */
export function gridTemplateColumnsWithThumbnail(gridColumns: string): string {
  return `${GRID_LIST_ROW_THUMBNAIL_COLUMN_WIDTH} ${gridColumns}`;
}

/** Blank header cell aligned over list-row thumbnails (not sortable). */
export function prependThumbnailHeaderColumn<
  T extends { key: string; label: string; sortable?: boolean },
>(columns: T[]): T[] {
  return [
    { key: THUMBNAIL_HEADER_COLUMN_KEY, label: '', sortable: false } as T,
    ...columns,
  ];
}

export interface ListHeaderRowChrome {
  /** GridListRow `leftSlot` (e.g. innate / equip toggle) — spacer before header grid */
  leftSlot?: boolean;
  /** GridListRow `rightSlot` (energy / use button) — spacer after header grid */
  rightSlot?: boolean;
  /**
   * Label over the rightSlot track (e.g. "Energy" on character sheet powers/techniques).
   * Requires `rightSlot: true`. Prefer this over a duplicate static Energy data column.
   */
  rightSlotLabel?: string;
  /**
   * Sort key for `rightSlotLabel` (e.g. character `cost`). Requires `onSort` on ListHeader.
   * Included in the mobile "Sort by" menu when set.
   */
  rightSlotSortKey?: string;
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

/** Character sheet Powers/Techniques: Energy label + sort over far-right spend buttons (not a mid-row value column). */
export const CHARACTER_SHEET_ENERGY_SPEND_ROW_CHROME: Pick<
  ListHeaderRowChrome,
  'rightSlot' | 'rightSlotLabel' | 'rightSlotSortKey'
> = {
  rightSlot: true,
  rightSlotLabel: 'Energy',
  rightSlotSortKey: 'cost',
};

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
