/**
 * Shared official armament list helpers (Library Realms tab + Admin public library).
 */

import type { ChipData } from '@/components/shared';
import type { ItemProperty } from '@/hooks/codex-types';
import type { ItemPropertyPayload } from '@/lib/calculators/item-calc';
import {
  calculateItemCosts,
  calculateCurrencyCostAndRarity,
  formatRange,
  trainingPointsForItemPropertyRef,
} from '@/lib/calculators/item-calc';
import { formatDamageDisplay, formatListCellLabel } from '@/lib/utils';

export const OFFICIAL_ITEM_GRID = '1.5fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 40px';

export const OFFICIAL_ITEM_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME', align: 'left' as const },
  { key: 'type', label: 'TYPE', align: 'center' as const },
  { key: 'rarity', label: 'RARITY', align: 'center' as const },
  { key: 'currency', label: 'CURRENCY', align: 'center' as const },
  { key: 'tp', label: 'TP', align: 'center' as const },
  { key: 'range', label: 'RANGE', align: 'center' as const },
  { key: 'damage', label: 'DAMAGE', align: 'center' as const },
  { key: '_actions', label: '', sortable: false as const },
];

export interface OfficialItemRow {
  id: string;
  raw: Record<string, unknown>;
  name: string;
  description: string;
  type: string;
  rarity: string;
  currency: number;
  tp: number;
  range: string;
  damage: string;
  parts: ChipData[];
}

export function buildOfficialItemRows(
  items: Array<Record<string, unknown>>,
  propertiesDb: ItemProperty[]
): OfficialItemRow[] {
  return items.map((item) => {
    const props = (Array.isArray(item.properties) ? item.properties : []) as ItemPropertyPayload[];
    const costs = calculateItemCosts(props, propertiesDb);
    const { currencyCost, rarity } = calculateCurrencyCostAndRarity(costs.totalCurrency, costs.totalIP);
    const rangeStr = formatRange(props);
    const damageStr = formatDamageDisplay(item.damage) || '';
    const parts: ChipData[] = (
      (item.properties as Array<string | { id?: unknown; name?: string; op_1_lvl?: number }>) || []
    ).map((prop) => {
      const propName = typeof prop === 'string' ? prop : (prop.name || '');
      const dbProp = propertiesDb.find(
        (p) => p.name?.toLowerCase() === String(propName).toLowerCase()
      );
      const cost = trainingPointsForItemPropertyRef(prop, propertiesDb);
      const lvl = typeof prop === 'object' && prop && prop.op_1_lvl != null ? prop.op_1_lvl : 0;
      return {
        name: dbProp?.name || propName || '',
        description: dbProp?.description || '',
        cost: cost > 0 ? cost : undefined,
        costLabel: 'TP',
        category: (cost > 0 ? 'cost' : 'default') as 'cost' | 'default',
        level: lvl > 1 ? lvl : undefined,
      };
    });
    return {
      id: String(item.id ?? item.docId ?? ''),
      raw: item,
      name: String(item.name ?? ''),
      description: String(item.description ?? ''),
      type: formatListCellLabel(item.type),
      rarity: formatListCellLabel(rarity),
      currency: currencyCost,
      tp: costs.totalTP,
      range: rangeStr,
      damage: damageStr,
      parts,
    };
  });
}

export function filterOfficialItemRows<T extends { name?: string; description?: string; type?: string }>(
  rows: T[],
  search: string,
  sortItems: (items: T[]) => T[]
): T[] {
  let result = rows;
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(
      (x) =>
        String(x.name ?? '').toLowerCase().includes(s) ||
        String(x.description ?? '').toLowerCase().includes(s) ||
        String(x.type ?? '').toLowerCase().includes(s)
    );
  }
  return sortItems(result);
}
