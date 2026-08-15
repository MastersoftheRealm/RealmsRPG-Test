import { formatColumnKeyLabel } from '@/lib/utils';
import type { ColumnValue } from './grid-list-row-types';

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

/** Columns hidden from the mobile grid (`hideOnMobile` default true). */
export function columnsForMobileSummary(columns: ColumnValue[]): ColumnValue[] {
  return columns.filter((col) => col.hideOnMobile !== false).slice(0, 3);
}

/** Stat columns for expanded mobile — skip description when the body already shows it. */
export function columnsForExpandedMobileStats(
  columns: ColumnValue[],
  hasDescriptionBody: boolean,
): ColumnValue[] {
  return columns.filter((col) => !(col.key === 'description' && hasDescriptionBody));
}

/**
 * When the expanded panel shows the full description, drop truncated description previews
 * from the collapsed header (desktop columns, mobile summary, flex stats).
 * Progressive disclosure: teaser → full text below — not both at once (Carbon/NN/g).
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
