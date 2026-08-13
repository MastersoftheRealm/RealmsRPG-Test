/**
 * Shared official armament list helpers (Library Realms tab + Admin public library).
 *
 * GLR required-facts registry surfaces: `ARMAMENT_GLR_SURFACE` in `@/lib/glr`.
 */

import type { ChipData } from '@/components/shared';
import type { ColumnValue } from '@/components/shared/grid-list-row';
import type { ItemProperty } from '@/hooks/codex-types';
import type { LibraryItem } from '@/types/library';
import {
  calculateItemCosts,
  calculateCurrencyCostAndRarity,
  deriveAgilityReductionFromProperties,
  deriveCriticalRangeIncreaseFromProperties,
  deriveShieldAmountFromProperties,
  deriveShieldDamageFromProperties,
  resolveWeaponRangeDisplay,
  type ItemPropertyPayload,
} from '@/lib/calculators/item-calc';
import {
  deriveAbilityRequirementFromProperties,
  type AbilityRequirement,
  type WeaponPropertyRef,
} from '@/lib/game/weapon-attack-ability';
import {
  formatAbilityRequirementFact,
  namedPropertyDescriptorChips,
} from '@/lib/detail-option/compact-facts';
import { resolveArmorDamageReduction } from '@/lib/game/resolve-armor-damage-reduction';
import { formatDamageDisplay, formatListCellLabel } from '@/lib/utils';
import type { ArmamentLibraryKind } from '@/lib/library/armament-library-labels';
import {
  applyArmamentFilters,
  type ArmamentFilterState,
} from '@/lib/library/armament-filters';
import type { ArmamentCharacterContext } from '@/lib/library/armament-character-context';

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
    grid: '1.4fr 0.55fr 0.6fr 0.45fr 0.7fr 0.7fr 0.9fr 0.55fr',
    headers: [
      { key: 'name', label: 'NAME', align: 'left' },
      { key: 'rarity', label: 'RARITY', align: 'center' },
      { key: 'currency', label: 'CURRENCY', align: 'center' },
      { key: 'tp', label: 'TP', align: 'center' },
      { key: 'damageReduction', label: 'DAMAGE RED.', align: 'center' },
      { key: 'agilityReduction', label: 'AGILITY RED.', align: 'center' },
      { key: 'abilityRequirement', label: 'ABL. REQ.', align: 'center' },
      { key: 'criticalRangeIncrease', label: 'CRIT +', align: 'center' },
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
  /** Dense column cell: "Strength 3+" (header is Abl. Req.); "-" when none. */
  abilityRequirement: string;
  /** Parsed ability requirement for character filters (TASK-680). */
  abilityReq: AbilityRequirement | null;
  /** Critical Range +1 stack total from armor (0 when none). */
  criticalRangeIncrease: number;
  block: string;
  parts: ChipData[];
}

/** Shown as armor Crit + column — omit from expanded property chips (no column+chip dupe). */
const ARMOR_COLUMN_PROPERTY_NAMES = new Set(['critical range +1']);

function propertyChipsForItem(
  item: LibraryItem,
  propertiesDb: ItemProperty[]
): ChipData[] {
  const props =
    (item.properties as Array<string | { id?: unknown; name?: string; op_1_lvl?: number }>) || [];
  const forChips =
    normalizeArmamentKind(item.type) === 'armor'
      ? props.filter((p) => {
          const n = (typeof p === 'string' ? p : String(p?.name ?? '')).trim().toLowerCase();
          return !ARMOR_COLUMN_PROPERTY_NAMES.has(n);
        })
      : props;
  return namedPropertyDescriptorChips(forChips, propertiesDb).map((chip) => {
    const prop = props.find((p) => {
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

function resolveCriticalRangeIncrease(item: LibraryItem, props: ItemPropertyPayload[]): number {
  const scalar = item.criticalRangeIncrease;
  if (scalar != null && scalar > 0) return scalar;
  return deriveCriticalRangeIncreaseFromProperties(props);
}

/** Column cell under Abl. Req. — Ability + level (header supplies "Req."). */
function formatAbilityRequirementColumn(
  item: LibraryItem,
  props: ItemPropertyPayload[]
): { display: string; req: AbilityRequirement | null } {
  const raw =
    item.abilityRequirement ?? deriveAbilityRequirementFromProperties(props);
  if (!raw?.name?.trim() || raw.level == null || Number.isNaN(Number(raw.level))) {
    return { display: '-', req: null };
  }
  const req: AbilityRequirement = {
    name: raw.name.trim(),
    level: Number(raw.level),
  };
  const fact = formatAbilityRequirementFact(req);
  if (!fact) return { display: '-', req: null };
  return { display: fact.replace(/ Requirement /, ' '), req };
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
    const rangeStr = resolveWeaponRangeDisplay(
      (item as LibraryItem & { range?: string }).range,
      props
    );
    const damageStr = formatDamageDisplay(item.damage) || '-';
    const damageReduction = resolveArmorDamageReduction({ ...item, properties: props });
    const agilityReduction = resolveAgilityReduction(item, props);
    const criticalRangeIncrease = resolveCriticalRangeIncrease(item, props);
    const abilityReqResult = formatAbilityRequirementColumn(item, props);
    const abilityRequirement = abilityReqResult.display;
    const abilityReq = abilityReqResult.req;
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
      abilityRequirement,
      abilityReq,
      criticalRangeIncrease,
      block: block !== '-' ? block : '-',
      parts: propertyChipsForItem(item, propertiesDb),
    };
  });
}

/** Column keys match `ARMAMENT_LIBRARY_CONFIG` headers (Library + Guided L2/L3). */
export function armamentRowColumns(row: OfficialItemRow, kind: ArmamentLibraryKind): ColumnValue[] {
  const headers = ARMAMENT_LIBRARY_CONFIG[kind].headers.filter((h) => h.key !== 'name');
  const byKey: Record<string, string | number> = {
    rarity: row.rarity,
    currency: row.currency,
    tp: row.tp,
    range: row.range,
    damage: row.damage,
    damageReduction: row.damageReduction > 0 ? row.damageReduction : '-',
    agilityReduction: row.agilityReduction > 0 ? row.agilityReduction : '-',
    abilityRequirement: row.abilityRequirement,
    criticalRangeIncrease:
      row.criticalRangeIncrease > 0 ? `+${row.criticalRangeIncrease}` : '-',
    block: row.block,
  };

  return headers.map((h) => ({
    key: h.key,
    label: h.label,
    value: byKey[h.key] ?? '-',
    align: h.align,
    highlight: h.key === 'tp' ? true : undefined,
  }));
}

export function filterOfficialItemRows<
  T extends {
    name?: string;
    description?: string;
    currency?: number | null;
    tp?: number | null;
    rarity?: string | null;
    abilityReq?: AbilityRequirement | null;
    properties?: WeaponPropertyRef[];
  },
>(
  rows: T[],
  search: string,
  sortItems: (items: T[]) => T[],
  filters?: ArmamentFilterState,
  characterContext?: ArmamentCharacterContext | null
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
  if (filters) {
    result = applyArmamentFilters(result, filters, characterContext ?? null);
  }
  return sortItems(result);
}
