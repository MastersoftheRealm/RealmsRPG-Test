/**
 * GLR browse chrome headers/grid for official library list helpers (ADR-0016).
 */

import type { GlrEntityType } from '@/lib/glr/glr-fact-catalog';
import { glrListChrome } from '@/lib/glr/glr-list-chrome';

export function officialEntityBrowseChrome(entityType: GlrEntityType) {
  const chrome = glrListChrome({ entityType, mode: 'browse' });
  return {
    chrome,
    grid: chrome.grid,
    headers: chrome.headers.map(({ key, label, align }) => ({
      key,
      label,
      align: align ?? 'center',
    })),
  };
}
