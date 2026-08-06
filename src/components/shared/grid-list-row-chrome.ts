/**
 * Horizontal chrome for GridListRow / ListHeader alignment
 * ======================================================
 * Row actions (rightSlot, edit, delete, selection) render outside the inner CSS grid.
 * ListHeader must reserve the same flex footprint so `fr` columns line up with row values.
 *
 * **Spacing + rowChrome contract (TASK-631 / TASK-637):** Library / Official / Codex / USM /
 * creator-embedded GLR lists use `flex flex-col gap-1` row containers; edit/delete/add/
 * leftSlot/rightSlot must pass matching `rowChrome` on ListHeader (or `rightSlotWidth` for
 * equipment-step qty/remove). When header reserves a slot but row content is conditional
 * (e.g. patch sync), pass the same `rowChrome` on `GridListRow` so empty rows keep alignment.
 * No leftover 40px grid tracks. CI: `validate-glr-chrome-spacing.test.ts`.
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
 * on **custom** Modal / editor-chrome GridListRow lists (e.g. AdminTraits choice-option
 * picker — intentional nested editor chrome, not an add-X USM; TASK-572).
 * Do **not** pre-wrap columns passed into `UnifiedSelectionModal` — it applies
 * `gridColumnsWithInlineSelection` internally. Encounter participant pick uses
 * `AddCombatantModal` (non-USM; no GridListRow selection column).
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

/**
 * Tokenize a `grid-template-columns` string into track tokens.
 * Supports minmax(), fit-content(), and nested parentheses / brackets.
 */
export function tokenizeGridTemplateColumns(template?: string): string[] {
  if (!template) return [];

  const tokens: string[] = [];
  let current = '';
  let parenDepth = 0;
  let bracketDepth = 0;

  for (const char of template) {
    if (char === '(') parenDepth += 1;
    if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    if (char === '[') bracketDepth += 1;
    if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);

    const isSeparator = /\s/.test(char) && parenDepth === 0 && bracketDepth === 0;
    if (isSeparator) {
      const trimmed = current.trim();
      if (trimmed) tokens.push(trimmed);
      current = '';
      continue;
    }

    current += char;
  }

  const last = current.trim();
  if (last) tokens.push(last);
  return tokens;
}

/** Expand `repeat(n, …)` tokens so track counts / slices match rendered columns. */
export function expandGridTemplateTokens(template?: string): string[] {
  const expanded: string[] = [];
  for (const token of tokenizeGridTemplateColumns(template)) {
    const repeatMatch = token.match(/^repeat\(\s*(\d+)\s*,\s*(.+)\)$/i);
    if (repeatMatch) {
      const count = Number.parseInt(repeatMatch[1], 10);
      const inner = repeatMatch[2].trim();
      for (let i = 0; i < count; i += 1) expanded.push(inner);
    } else {
      expanded.push(token);
    }
  }
  return expanded;
}

/** Count explicit tracks in a grid-template-columns string (repeat-aware). */
export function countGridTemplateTracks(template?: string): number {
  return expandGridTemplateTokens(template).length;
}

export interface MobileCollapsedGridColumnsOptions {
  /** Full desktop template already including thumbnail track when present */
  resolvedGridColumns: string;
  hasThumbnailColumn: boolean;
  /**
   * Tracks consumed by thumbnail (optional) + Name + all data columns
   * (respecting columnSpans). Trailing tracks beyond this are action columns.
   */
  dataTracksUsed: number;
  /**
   * How many data-column tracks stay visible below `lg`
   * (`hideOnMobile: false`). Name always gets `minmax(0, 1fr)`.
   */
  mobileVisibleDataTracks?: number;
}

/**
 * Mobile (`max-lg`) grid template for GridListRow.
 *
 * Desktop templates keep empty `fr` tracks for columns that are `display: none`
 * on mobile, which squeezes the name left beside X/+ actions. Collapse to:
 * `[thumb?] minmax(0, 1fr) [visible mobile data…] [trailing action tracks]`.
 *
 * Callers must apply this via a CSS variable + `max-lg:[grid-template-columns:…]`
 * class — not inline `style.gridTemplateColumns` (inline beats the media query).
 */
export function buildMobileCollapsedGridColumns(
  options: MobileCollapsedGridColumnsOptions
): string {
  const {
    resolvedGridColumns,
    hasThumbnailColumn,
    dataTracksUsed,
    mobileVisibleDataTracks = 0,
  } = options;

  const tracks = expandGridTemplateTokens(resolvedGridColumns);
  const trailingActionTracks = tracks.slice(Math.max(0, dataTracksUsed));

  const parts: string[] = [];
  if (hasThumbnailColumn) {
    parts.push(GRID_LIST_ROW_THUMBNAIL_COLUMN_WIDTH);
  }
  parts.push('minmax(0, 1fr)');
  for (let i = 0; i < Math.max(0, mobileVisibleDataTracks); i += 1) {
    parts.push('auto');
  }
  parts.push(...trailingActionTracks);
  return parts.join(' ');
}
