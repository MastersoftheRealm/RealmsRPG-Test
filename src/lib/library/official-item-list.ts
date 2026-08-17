/**
 * Shared official armament list helpers (Library Realms tab + Admin public library).
 *
 * GLR fact catalog surfaces: `library-official-{weapon,armor,shield}` in
 * `glr-surface-bindings.ts` (ADR-0016). Headers come from `glrListChrome`.
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
import { applyArmamentFilters, type ArmamentFilterState } from '@/lib/library/armament-filters';
import type { ArmamentCharacterContext } from '@/lib/library/armament-character-context';
import {
  libraryRowPathIds,
  rowMatchesPathRecommendedIds,
} from '@/lib/game/path-recommendation-index';
import { glrListChrome } from '@/lib/glr';
import {
  glrSurfaceDetailSections,
  propertiesProficienciesSection,
} from '@/lib/chip/list-row-metadata';

export type { ArmamentLibraryKind };

export function normalizeArmamentKind(type: string | undefined): ArmamentLibraryKind | null {
  const t = String(type ?? '')
    .toLowerCase()
    .trim();
  if (t === 'weapon' || t === 'armor' || t === 'shield') return t;
  return null;
}

export function filterItemsByArmamentKind<T extends { type?: string }>(
  items: T[],
  kind: ArmamentLibraryKind,
): T[] {
  return items.filter((item) => normalizeArmamentKind(item.type) === kind);
}

export function countItemsByArmamentKind<T extends { type?: string }>(
  items: T[],
  kind: ArmamentLibraryKind,
): number {
  return filterItemsByArmamentKind(items, kind).length;
}

type ArmamentHeaderColumn = {
  key: string;
  label: string;
  align: 'left' | 'center' | 'right';
  sortable?: boolean;
};

function armamentChrome(kind: ArmamentLibraryKind): {
  grid: string;
  headers: ArmamentHeaderColumn[];
} {
  const chrome = glrListChrome({ entityType: kind, mode: 'browse' });
  return {
    grid: chrome.grid,
    headers: chrome.headers.map(({ key, label, align }) => ({
      key,
      label,
      align: align ?? 'center',
    })),
  };
}

/** Data columns only — edit/delete/add use ListHeader `rowChrome`. */
export const ARMAMENT_LIBRARY_CONFIG: Record<
  ArmamentLibraryKind,
  { grid: string; headers: ArmamentHeaderColumn[] }
> = {
  weapon: armamentChrome('weapon'),
  armor: armamentChrome('armor'),
  shield: armamentChrome('shield'),
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

function propertyChipsForItem(item: LibraryItem, propertiesDb: ItemProperty[]): ChipData[] {
  const props =
    (item.properties as Array<string | { id?: unknown; name?: string; op_1_lvl?: number }>) || [];
  return namedPropertyDescriptorChips(props, propertiesDb).map((chip) => {
    const prop = props.find((p) => {
      const n = typeof p === 'string' ? p : String(p?.name ?? '');
      return n.toLowerCase() === chip.name.toLowerCase();
    });
    const lvl =
      typeof prop === 'object' && prop && prop.op_1_lvl != null ? Number(prop.op_1_lvl) : 0;
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
  props: ItemPropertyPayload[],
): { display: string; req: AbilityRequirement | null } {
  const raw = item.abilityRequirement ?? deriveAbilityRequirementFromProperties(props);
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
  kind?: ArmamentLibraryKind,
): OfficialItemRow[] {
  const filtered = kind ? filterItemsByArmamentKind(items, kind) : items;
  return filtered.map((item) => {
    const props = (Array.isArray(item.properties) ? item.properties : []) as ItemPropertyPayload[];
    const costs = calculateItemCosts(props, propertiesDb);
    const { currencyCost, rarity } = calculateCurrencyCostAndRarity(
      costs.totalCurrency,
      costs.totalIP,
    );
    const rangeStr = resolveWeaponRangeDisplay(
      (item as LibraryItem & { range?: string }).range,
      props,
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
      damage: kind === 'shield' ? shieldDamage || '-' : damageStr,
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
    criticalRangeIncrease: row.criticalRangeIncrease > 0 ? `+${row.criticalRangeIncrease}` : '-',
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

export function officialItemDetailSections(row: OfficialItemRow, kind: ArmamentLibraryKind) {
  const family = kind === 'armor' ? 'armor' : kind === 'shield' ? 'shield' : 'weapon';
  const surface =
    kind === 'armor'
      ? 'library-official-armor'
      : kind === 'shield'
        ? 'library-official-shield'
        : 'library-official-weapon';
  const properties = propertiesProficienciesSection(row.parts, family);
  return glrSurfaceDetailSections(
    surface,
    {
      rarity: row.rarity,
      currency: row.currency,
      trainingPoints: row.tp > 0 ? row.tp : undefined,
      range: row.range,
      abilityRequirement: row.abilityReq,
      agilityReduction: row.agilityReduction,
      criticalRangeIncrease: row.criticalRangeIncrease,
      damageReduction: row.damageReduction,
      damage: row.damage,
      block: row.block,
    },
    properties ? [properties] : undefined,
  );
}

export function filterOfficialItemRows<
  T extends {
    id?: string | number;
    raw?: { id?: string | number | null; docId?: string | number | null };
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
  characterContext?: ArmamentCharacterContext | null,
  pathRecommendedIds?: ReadonlySet<string> | null,
): T[] {
  let result = rows;
  if (pathRecommendedIds) {
    result = result.filter((x) =>
      rowMatchesPathRecommendedIds(libraryRowPathIds(x), pathRecommendedIds),
    );
  }
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(
      (x) =>
        String(x.name ?? '')
          .toLowerCase()
          .includes(s) ||
        String(x.description ?? '')
          .toLowerCase()
          .includes(s),
    );
  }
  if (filters) {
    result = applyArmamentFilters(result, filters, characterContext ?? null);
  }
  return sortItems(result);
}
