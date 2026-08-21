/**
 * ListHeader / grid chrome from a resolved GLR layout (TASK-807 / ADR-0016).
 */

import { getGlrFactDef, type GlrFactId } from './glr-fact-catalog';
import type { GlrDensityMode } from './glr-density';
import {
  glrColumnKeyFor,
  glrHeaderTrackFor,
  glrNameTrackFor,
  resolveGlrFactLayout,
  type GlrResolveInput,
  type GlrResolvedLayout,
} from './resolve-glr-fact-layout';

export interface GlrHeaderColumn {
  key: string;
  label: string;
  align: 'left' | 'center' | 'right';
  sortable?: boolean | undefined;
  width?: string | undefined;
}

export interface GlrExtraColumn {
  key: string;
  label: string;
  width: string;
  align?: 'left' | 'center' | 'right' | undefined;
  sortable?: boolean | undefined;
  /** Insert after this header key (default: append). Use `name` to sit after identity. */
  afterKey?: string | undefined;
}

export interface GlrChromeOptions {
  nameLabel?: string | undefined;
  nameKey?: string | undefined;
  nameWidth?: string | undefined;
  /** browse → uppercase catalog headerLabel; play/select → titleLabel. */
  labelStyle?: 'header' | 'title' | undefined;
  keyStyle?: 'canonical' | 'usm' | undefined;
  sortable?: boolean | undefined;
  nameAlign?: 'left' | 'center' | 'right' | undefined;
  /** Identity / roll / description tracks that are not ranked facts. */
  extraColumns?: GlrExtraColumn[] | undefined;
  /** Override fact or extra track sizes (e.g. sheet minmax). */
  trackOverrides?: Record<string, string> | undefined;
  /** Data-column keys after name (facts + extras). Name stays first. */
  columnOrder?: string[] | undefined;
}

function labelStyleForMode(mode: GlrDensityMode): 'header' | 'title' {
  return mode === 'browse' ? 'header' : 'title';
}

export function glrFactLabel(factId: GlrFactId, labelStyle: 'header' | 'title'): string {
  const def = getGlrFactDef(factId);
  return labelStyle === 'header' ? def.headerLabel : def.titleLabel;
}

function applyTrackOverride(
  col: GlrHeaderColumn,
  trackOverrides?: Record<string, string>,
): GlrHeaderColumn {
  const width = trackOverrides?.[col.key];
  return width ? { ...col, width } : col;
}

function insertExtraColumns(
  columns: GlrHeaderColumn[],
  extras: GlrExtraColumn[] | undefined,
  sortable: boolean | undefined,
): GlrHeaderColumn[] {
  if (!extras?.length) return columns;
  const result = [...columns];
  for (const extra of extras) {
    const col: GlrHeaderColumn = {
      key: extra.key,
      label: extra.label,
      align: extra.align ?? 'center',
      width: extra.width,
    };
    if (sortable != null) col.sortable = sortable;
    else if (extra.sortable != null) col.sortable = extra.sortable;
    const afterKey = extra.afterKey ?? result[result.length - 1]?.key;
    const idx = afterKey ? result.findIndex((c) => c.key === afterKey) : -1;
    if (idx >= 0) result.splice(idx + 1, 0, col);
    else result.push(col);
  }
  return result;
}

function orderHeaderColumns(
  columns: GlrHeaderColumn[],
  nameKey: string,
  columnOrder?: string[],
): GlrHeaderColumn[] {
  if (!columnOrder?.length) return columns;
  const byKey = new Map(columns.map((c) => [c.key, c]));
  const name = byKey.get(nameKey);
  const rest = columnOrder.map((key) => byKey.get(key)).filter((c): c is GlrHeaderColumn => !!c);
  return name ? [name, ...rest] : rest;
}

export function glrHeaderColumns(
  layout: GlrResolvedLayout,
  options: GlrChromeOptions = {},
): GlrHeaderColumn[] {
  const labelStyle = options.labelStyle ?? labelStyleForMode(layout.mode);
  const keyStyle = options.keyStyle ?? 'canonical';
  const sortable = options.sortable;
  const nameKey = options.nameKey ?? 'name';
  const name: GlrHeaderColumn = {
    key: nameKey,
    label: options.nameLabel ?? (labelStyle === 'header' ? 'NAME' : 'Name'),
    align: options.nameAlign ?? 'left',
    width: options.nameWidth ?? glrNameTrackFor(layout.entityType, layout.mode),
  };
  if (sortable != null) name.sortable = sortable;

  const facts = layout.columnFacts.map((id) => {
    const col: GlrHeaderColumn = {
      key: glrColumnKeyFor(id, layout.entityType, layout.mode, keyStyle),
      label: glrFactLabel(id, labelStyle),
      align: 'center',
      width: glrHeaderTrackFor(id, layout.entityType, layout.mode),
    };
    if (sortable != null) col.sortable = sortable;
    return applyTrackOverride(col, options.trackOverrides);
  });

  const withExtras = insertExtraColumns(
    [applyTrackOverride(name, options.trackOverrides), ...facts],
    options.extraColumns,
    sortable,
  );
  return orderHeaderColumns(withExtras, nameKey, options.columnOrder);
}

export function glrGridTemplateFromHeaders(headers: GlrHeaderColumn[]): string {
  return headers.map((h) => h.width ?? '1fr').join(' ');
}

export function glrGridTemplate(layout: GlrResolvedLayout, options?: GlrChromeOptions): string {
  if (options) return glrGridTemplateFromHeaders(glrHeaderColumns(layout, options));
  const name = glrNameTrackFor(layout.entityType, layout.mode);
  const rest = layout.columnFacts.map((id) =>
    glrHeaderTrackFor(id, layout.entityType, layout.mode),
  );
  return [name, ...rest].join(' ');
}

export function glrListChrome(input: GlrResolveInput, options?: GlrChromeOptions) {
  const layout = resolveGlrFactLayout(input);
  const headers = glrHeaderColumns(layout, options);
  return {
    layout,
    headers,
    grid: glrGridTemplateFromHeaders(headers),
  };
}
