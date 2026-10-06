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

function isEnergyFact(col: ColumnValue): boolean {
  return col.key.trim().toLowerCase() === 'energy';
}

/**
 * True when a column has a real value to paint. Empty / `-` / `—` / `none` stay off
 * the row (collapsed header, mobile summary, and expanded body).
 * Energy is the exception: a dash is the empty-cost stat and stays visible.
 */
export function columnHasDisplayValue(col: ColumnValue): boolean {
  const value = col.value;
  if (value == null) return false;
  if (isEnergyFact(col)) {
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  }
  if (typeof value === 'string' || typeof value === 'number') return !isBlank(value);
  return true;
}

/** Columns hidden from the mobile grid (`hideOnMobile` default true). Skip blanks
 *  and description teasers (full text is expanded-only, TASK-909). */
function appendMobileFact(summary: ColumnValue[], visible: ColumnValue[], key: string): void {
  const col = visible.find((candidate) => candidate.key.trim().toLowerCase() === key);
  if (col && !summary.includes(col)) summary.push(col);
}

export function columnsForMobileSummary(columns: ColumnValue[]): ColumnValue[] {
  const visible = columns.filter(
    (col) => col.key !== 'description' && col.hideOnMobile !== false && columnHasDisplayValue(col),
  );
  const summary = visible.slice(0, 3);
  // Duration can fall past the first three after a Modify join (86e3kfkca).
  appendMobileFact(summary, visible, 'duration');
  // Damage stays past the first three only when the caller marks it (creature stat block).
  for (const col of visible) {
    if (col.keepOnMobileSummary && !summary.includes(col)) summary.push(col);
  }
  return summary;
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
