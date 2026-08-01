/**
 * Shared official armament list helpers (Library Realms tab + Admin public library).
 */

import type { ChipData } from '@/components/shared';
import type { ColumnValue } from '@/components/shared/grid-list-row';
import type { ItemProperty } from '@/hooks/codex-types';
import type { LibraryItem } from '@/types/library';
import type { ItemPropertyPayload } from '@/lib/calculators/item-calc';
import {
  calculateItemCosts,
  calculateCurrencyCostAndRarity,
  deriveAgilityReductionFromProperties,
  deriveDamageReductionFromProperties,
  deriveShieldAmountFromProperties,
  deriveShieldDamageFromProperties,
  formatRange,
} from '@/lib/calculators/item-calc';
import { namedPropertyDescriptorChips } from '@/lib/detail-option/compact-facts';
import { formatDamageDisplay, formatListCellLabel } from '@/lib/utils';
import type { ArmamentLibraryKind } from '@/lib/library/armament-library-labels';

export type { ArmamentLibraryKind };

export function normalizeArmamentKind(type: string | undefined): ArmamentLibraryKind | null {
  const t = String(type ?? '').toLowerCase().trim();
  if (t === 'weapon' || t === 'armor' || t === 'shield') return t;
  return null;
}

export function filterItemsByArmamentKind<T extends { type?: string }>(
  items: T[],
  kind: ArmamentLibraryKind
): T[] {
  return items.filter((item) => normalizeArmamentKind(item.type) === kind);
}

export function countItemsByArmamentKind<T extends { type?: string }>(
  items: T[],
  kind: ArmamentLibraryKind
): number {
  return filterItemsByArmamentKind(items, kind).length;
}

type ArmamentHeaderColumn = {
  key: string;
  label: string;
  align: 'left' | 'center' | 'right';
  sortable?: boolean;
};

/** Data columns only — edit/delete/add use ListHeader `rowChrome`. */
export const ARMAMENT_LIBRARY_CONFIG: Record<
  ArmamentLibraryKind,
  { grid: string; headers: ArmamentHeaderColumn[] }
> = {
  weapon: {
    grid: '1.5fr 0.7fr 0.7fr 0.7fr 0.7fr 1fr',
    headers: [
      { key: 'name', label: 'NAME', align: 'left' },
      { key: 'rarity', label: 'RARITY', align: 'center' },
      { key: 'currency', label: 'CURRENCY', align: 'center' },
      { key: 'tp', label: 'TP', align: 'center' },
      { key: 'range', label: 'RANGE', align: 'center' },
      { key: 'damage', label: 'DAMAGE', align: 'center' },
    ],
  },
  armor: {
    grid: '1.5fr 0.7fr 0.7fr 0.7fr 1fr 0.8fr',
    headers: [
      { key: 'name', label: 'NAME', align: 'left' },
      { key: 'rarity', label: 'RARITY', align: 'center' },
      { key: 'currency', label: 'CURRENCY', align: 'center' },
      { key: 'tp', label: 'TP', align: 'center' },
      { key: 'damageReduction', label: 'DAMAGE RED.', align: 'center' },
      { key: 'agilityReduction', label: 'AGILITY RED.', align: 'center' },
    ],
  },
  shield: {
    grid: '1.5fr 0.7fr 0.7fr 0.7fr 0.8fr 1fr',
    headers: [
      { key: 'name', label: 'NAME', align: 'left' },
      { key: 'rarity', label: 'RARITY', align: 'center' },
      { key: 'currency', label: 'CURRENCY', align: 'center' },
      { key: 'tp', label: 'TP', align: 'center' },
      { key: 'block', label: 'BLOCK', align: 'center' },
      { key: 'damage', label: 'DAMAGE', align: 'center' },
    ],
  },
};

export interface OfficialItemRow {
  id: string;
  raw: LibraryItem;
  name: string;
  description: string;
  type: string;
  rarity: string;
  currency: number;
  tp: number;
  range: string;
  damage: string;
  damageReduction: number;
  agilityReduction: number;
  block: string;
  parts: ChipData[];
}

function propertyChipsForItem(
  item: LibraryItem,
  propertiesDb: ItemProperty[]
): ChipData[] {
  return namedPropertyDescriptorChips(
    (item.properties as Array<string | { id?: unknown; name?: string; op_1_lvl?: number }>) || [],
    propertiesDb
  ).map((chip) => {
    const prop = (
      (item.properties as Array<string | { id?: unknown; name?: string; op_1_lvl?: number }>) || []
    ).find((p) => {
      const n = typeof p === 'string' ? p : String(p?.name ?? '');
      return n.toLowerCase() === chip.name.toLowerCase();
    });
    const lvl = typeof prop === 'object' && prop && prop.op_1_lvl != null ? Number(prop.op_1_lvl) : 0;
    return {
      ...chip,
      level: lvl > 0 ? lvl : undefined,
    };
  });
}

function resolveAgilityReduction(item: LibraryItem, props: ItemPropertyPayload[]): number {
  const scalar = item.agilityReduction;
  if (scalar != null && scalar > 0) return scalar;
  return deriveAgilityReductionFromProperties(props);
}

export function buildOfficialItemRows(
  items: LibraryItem[],
  propertiesDb: ItemProperty[],
  kind?: ArmamentLibraryKind
): OfficialItemRow[] {
  const filtered = kind ? filterItemsByArmamentKind(items, kind) : items;
  return filtered.map((item) => {
    const props = (Array.isArray(item.properties) ? item.properties : []) as ItemPropertyPayload[];
    const costs = calculateItemCosts(props, propertiesDb);
    const { currencyCost, rarity } = calculateCurrencyCostAndRarity(costs.totalCurrency, costs.totalIP);
    const rangeStr = formatRange(props) || '-';
    const damageStr = formatDamageDisplay(item.damage) || '-';
    const damageReduction =
      item.damageReduction ??
      item.armorValue ??
      deriveDamageReductionFromProperties(props);
    const agilityReduction = resolveAgilityReduction(item, props);
    const block = deriveShieldAmountFromProperties(props);
    const shieldDamage =
      deriveShieldDamageFromProperties(props) ??
      (item.damage ? formatDamageDisplay(item.damage) : null);
    return {
      id: String(item.id ?? item.docId ?? ''),
      raw: item,
      name: String(item.name ?? ''),
      description: String(item.description ?? ''),
      type: formatListCellLabel(item.type),
      rarity: formatListCellLabel(rarity),
      currency: Math.round(currencyCost),
      tp: Math.round(costs.totalTP),
      range: rangeStr,
      damage: kind === 'shield' ? (shieldDamage || '-') : damageStr,
      damageReduction,
      agilityReduction,
      block: block !== '-' ? block : '-',
      parts: propertyChipsForItem(item, propertiesDb),
    };
  });
}

export function armamentRowColumns(row: OfficialItemRow, kind: ArmamentLibraryKind): ColumnValue[] {
  const rarity = { key: 'Rarity', value: row.rarity, align: 'center' as const };
  const currency = { key: 'Currency', value: row.currency, align: 'center' as const };
  const tp = { key: 'TP', value: row.tp, highlight: true, align: 'center' as const };

  if (kind === 'armor') {
    return [
      rarity,
      currency,
      tp,
      {
        key: 'Damage Reduction',
        value: row.damageReduction > 0 ? row.damageReduction : '-',
        align: 'center',
      },
      {
        key: 'Agility Red.',
        value: row.agilityReduction > 0 ? row.agilityReduction : '-',
        align: 'center',
      },
    ];
  }
  if (kind === 'shield') {
    return [
      rarity,
      currency,
      tp,
      { key: 'Block', value: row.block, align: 'center' },
      { key: 'Damage', value: row.damage, align: 'center' },
    ];
  }
  return [
    rarity,
    currency,
    tp,
    { key: 'Range', value: row.range, align: 'center' },
    { key: 'Damage', value: row.damage, align: 'center' },
  ];
}

export function filterOfficialItemRows<T extends { name?: string; description?: string }>(
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
        String(x.description ?? '').toLowerCase().includes(s)
    );
  }
  return sortItems(result);
}
