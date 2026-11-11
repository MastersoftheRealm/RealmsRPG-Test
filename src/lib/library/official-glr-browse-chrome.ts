/**
 * Shared GLR browse chrome for official Library / Realms list helpers (ADR-0016).
 */

import { glrListChrome, type GlrEntityType } from '@/lib/glr';

export type OfficialBrowseHeaderColumn = {
  key: string;
  label: string;
  align: 'left' | 'center' | 'right';
  sortable?: boolean | undefined;
};

export function officialBrowseHeaderColumns(
  chrome: ReturnType<typeof glrListChrome>,
): OfficialBrowseHeaderColumn[] {
  return chrome.headers.map(({ key, label, align }) => ({
    key,
    label,
    align: align ?? 'center',
  }));
}

export function officialEntityBrowseChrome(entityType: GlrEntityType) {
  const chrome = glrListChrome({ entityType, mode: 'browse' });
  return {
    chrome,
    grid: chrome.grid,
    headers: officialBrowseHeaderColumns(chrome),
  };
}
