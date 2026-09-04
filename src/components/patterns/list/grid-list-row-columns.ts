import { isBlank } from '@/lib/detail-option/compact-facts';
import { formatColumnKeyLabel } from '@/lib/utils';
import type { ColumnValue } from './grid-list-row-types';

/** ReactNode column values (steppers, buttons) must not use text `truncate`. */
export function columnHasInteractiveValue(col: ColumnValue): boolean {
  const value = col.value;
  if (value == null) return false;
  return typeof value !== 'string' && typeof value !== 'number';
}

/** Overflow class for a collapsed header cell (TASK-909: keep steppers unclipped). */
export function collapsedColumnOverflowClass(col: ColumnValue): string {
  return columnHasInteractiveValue(col) ? 'min-w-0 text-sm' : 'min-w-0 truncate text-sm';
}

/** Humanize column key for display when label is not set. */
export function columnDisplayLabel(col: ColumnValue): string {
  if (col.label) return col.label;
  return formatColumnKeyLabel(col.key);
}

/**
 * True when a collapsed data column already shows Training Points / TP.
 * Expanded "Total TP" chips should be omitted in that case (no double reference).
 */
export function columnsAlreadyShowTrainingPoints(
  columns: ColumnValue[],
  costLabel?: string,
): boolean {
  const aliases = new Set(['tp', 'training points', 'total tp', 'total training points']);
  if (costLabel?.trim()) aliases.add(costLabel.trim().toLowerCase());
  return columns.some((col) => {
    const key = col.key.trim().toLowerCase();
    const label = (col.label ?? '').trim().toLowerCase();
    return aliases.has(key) || (label.length > 0 && aliases.has(label));
  });
}

/**
 * True when a column has a real value to paint. Empty / `-` / `—` / `none` stay off
 * the row (collapsed header, mobile summary, and expanded body).
 */
export function columnHasDisplayValue(col: ColumnValue): boolean {
  const value = col.value;
  if (value == null) return false;
  if (typeof value === 'string' || typeof value === 'number') return !isBlank(value);
  return true;
}

/** Columns hidden from the mobile grid (`hideOnMobile` default true). Skip blanks
 *  and description teasers (full text is expanded-only, TASK-909). */
export function columnsForMobileSummary(columns: ColumnValue[]): ColumnValue[] {
  return columns
    .filter(
      (col) =>
        col.key !== 'description' && col.hideOnMobile !== false && columnHasDisplayValue(col),
    )
    .slice(0, 3);
}

/**
 * When the expanded panel shows the full description, drop truncated description
 * previews from the collapsed header (desktop columns, mobile summary, flex stats).
 * TASK-909: hide the teaser even while collapsed — expand to read description.
 */
export function columnsWithoutDescriptionPreview(
  columns: ColumnValue[],
  suppressDescriptionPreview: boolean,
): ColumnValue[] {
  if (!suppressDescriptionPreview) return columns;
  return columns.filter((col) => col.key !== 'description');
}

export function descriptionColumnTrackCount(
  columns: ColumnValue[],
  columnSpans?: (number | undefined)[],
): number {
  return columns.reduce((sum, col, idx) => {
    if (col.key !== 'description') return sum;
    return sum + (columnSpans?.[idx] ?? 1);
  }, 0);
}

/** Grid tracks consumed by data columns (respecting columnSpans). */
export function dataColumnTrackCount(
  columns: ColumnValue[],
  columnSpans?: (number | undefined)[],
): number {
  return columns.reduce((sum, _col, idx) => sum + (columnSpans?.[idx] ?? 1), 0);
}
