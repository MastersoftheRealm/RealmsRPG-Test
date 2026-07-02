/**
 * Shared official creature list helpers (Library Realms tab + Admin public library).
 */

import { formatListCellLabel } from '@/lib/utils';

export const OFFICIAL_CREATURE_GRID = '1.5fr 0.8fr 1fr 40px';

export const OFFICIAL_CREATURE_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME', align: 'left' as const },
  { key: 'level', label: 'LEVEL', align: 'center' as const },
  { key: 'type', label: 'TYPE', align: 'center' as const },
  { key: '_actions', label: '', sortable: false as const },
];

export interface OfficialCreatureRow {
  id: string;
  raw: Record<string, unknown>;
  name: string;
  description: string;
  level: number;
  type: string;
}

export function buildOfficialCreatureRows(
  items: Array<Record<string, unknown>>
): OfficialCreatureRow[] {
  return items.map((c) => ({
    id: String(c.id ?? c.docId ?? ''),
    raw: c,
    name: String(c.name ?? ''),
    description: String(c.description ?? ''),
    level: Number(c.level ?? 0),
    type: String(c.type ?? ''),
  }));
}

export function filterOfficialCreatureRows<
  T extends { name?: string; description?: string; type?: string },
>(rows: T[], search: string, sortItems: (items: T[]) => T[]): T[] {
  let result = rows;
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(
      (x) =>
        String(x.name ?? '').toLowerCase().includes(s) ||
        String(x.type ?? '').toLowerCase().includes(s) ||
        String(x.description ?? '').toLowerCase().includes(s)
    );
  }
  return sortItems(result);
}

export function formatOfficialCreatureType(type: string): string {
  return formatListCellLabel(type);
}
