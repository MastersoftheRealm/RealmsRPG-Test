/**
 * Selectable-row builders for species/creature load modals (creator Load flow).
 */

import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import { formatCreatureLevel } from '@/lib/game';
import { formatListCellLabel } from '@/lib/utils';

export function buildSpeciesSelectableItem(
  record: { id?: string; docId?: string; name?: string; description?: string; type?: string },
  source: 'my' | 'public',
): SelectableItem {
  const id = String(record.id ?? record.docId ?? '');
  const name = String(record.name ?? 'Unnamed');
  const type = String(record.type ?? '');
  return {
    id,
    name,
    description: String(record.description ?? ''),
    columns: type ? [{ key: 'Type', value: type }] : undefined,
    data: { source, raw: record },
  };
}

export function buildCreatureSelectableItem(c: {
  docId?: unknown;
  id?: unknown;
  name?: unknown;
  description?: unknown;
  level?: number | string | null;
  type?: unknown;
}): SelectableItem {
  const id = String(c.docId ?? c.id ?? '');
  return {
    id,
    name: String(c.name ?? 'Unnamed'),
    description: typeof c.description === 'string' ? c.description : undefined,
    data: c,
    columns: [
      { key: 'level', value: formatCreatureLevel(c.level), align: 'center' },
      { key: 'type', value: formatListCellLabel(String(c.type ?? 'creature')), align: 'center' },
    ],
  };
}
