/**
 * Shared official enhanced-item list helpers (Admin public library).
 */

import type { OfficialEnhancedItem } from '@/types/crafting';

export const OFFICIAL_ENHANCED_GRID = '1.6fr 1.3fr 1.3fr 0.9fr 0.9fr 0.9fr 40px';

export const OFFICIAL_ENHANCED_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'base', label: 'BASE ITEM' },
  { key: 'power', label: 'POWER' },
  { key: 'rarity', label: 'RARITY' },
  { key: 'cost', label: 'COST (C)' },
  { key: 'uses', label: 'USES' },
  { key: '_actions', label: '', sortable: false as const },
];

export interface OfficialEnhancedRow {
  id: string;
  raw: OfficialEnhancedItem;
  name: string;
  description?: string;
  base: string;
  power: string;
  rarity: string;
  cost: number;
  uses: string;
}

export function formatEnhancedUsesLabel(item: OfficialEnhancedItem): string {
  if (item.uses_type === 'permanent') return 'Permanent';
  return `${item.uses_count ?? 1} / ${item.uses_type === 'full' ? 'Full' : 'Partial'}`;
}

export function buildOfficialEnhancedRows(items: OfficialEnhancedItem[]): OfficialEnhancedRow[] {
  return items.map((e) => ({
    id: e.id,
    raw: e,
    name: e.name,
    description: e.description ?? undefined,
    base: e.base_item_name,
    power: e.power_name,
    rarity: e.rarity,
    cost: e.currency_cost,
    uses: formatEnhancedUsesLabel(e),
  }));
}

export function filterOfficialEnhancedRows(
  rows: OfficialEnhancedRow[],
  search: string,
  sortItems: (items: OfficialEnhancedRow[]) => OfficialEnhancedRow[]
): OfficialEnhancedRow[] {
  let list = rows;
  if (search.trim()) {
    const s = search.toLowerCase();
    list = list.filter(
      (e) =>
        e.name.toLowerCase().includes(s) ||
        e.base.toLowerCase().includes(s) ||
        e.power.toLowerCase().includes(s)
    );
  }
  return sortItems(list);
}
