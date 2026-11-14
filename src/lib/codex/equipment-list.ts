/**
 * Shared Codex + Admin equipment list helpers (TASK-723 / TASK-806).
 * Equipment GLR (entityType `gear`): Category / Currency / Rarity columns. Named property chips stay.
 */

import type { ColumnValue } from '@/components/patterns/list/grid-list-row-types';
import { glrSurfaceDetailSections, type MetadataDetailSection } from '@/lib/chip/list-row-metadata';
import { namedPropertyDescriptorChips } from '@/lib/detail-option/compact-facts';
import {
  calculateItemCosts,
  resolveItemMarketPricing,
  type ItemPropertyPayload,
  type ItemPropertyTpRow,
  type ItemStoredCostSums,
} from '@/lib/calculators/item-calc';
import { applyArmamentFilters, type ArmamentFilterState } from '@/lib/library/armament-filters';
import { normalizeArmamentKind } from '@/lib/library/official-item-list';
import type { ArmamentCharacterContext } from '@/lib/library/armament-character-context';
import type { CodexEquipmentItem } from '@/types/codex';
import { formatListCellLabel } from '@/lib/utils';
import { rowMatchesPathRecommendedIds } from '@/lib/game/path-recommendation-index';
import { glrListChrome } from '@/lib/glr';
import { rowMatchesCodexRulesSourceFilter } from '@/lib/codex/list-rules-source-filter';

const gearBrowseChrome = glrListChrome({ entityType: 'gear', mode: 'browse' });

export const EQUIPMENT_GRID_COLUMNS = gearBrowseChrome.grid;

/** Data columns only — admin action chrome uses CodexBrowseListShell `rowChrome`. */
export const CODEX_EQUIPMENT_HEADER_COLUMNS = gearBrowseChrome.headers.map(({ key, label }) => ({
  key,
  label,
}));

export interface CodexEquipmentListFilters {
  search: string;
  categoryFilter: string;
  rarityFilter: string;
  /** Rules sources (Core / expansions). Empty = All. */
  rulesSources: string[];
}

export function equipmentCurrency(item: {
  currency?: number | undefined;
  gold_cost?: number | undefined;
}): number {
  const value = item.currency ?? item.gold_cost ?? 0;
  return typeof value === 'number' && !Number.isNaN(value) ? value : 0;
}

type CodexEquipmentPricingRow = {
  type?: string | undefined;
  currency?: number | undefined;
  gold_cost?: number | undefined;
  properties?: readonly (string | ItemPropertyPayload)[] | undefined;
  costs?: ItemStoredCostSums | undefined;
};

function codexArmamentPropertyPayloads(
  properties: CodexEquipmentPricingRow['properties'],
): ItemPropertyPayload[] {
  return (properties ?? []).map((p) => (typeof p === 'string' ? { name: p } : p));
}

/**
 * Codex browse / guided display currency: armaments use item-calc market price;
 * gear bags keep the stored catalog column (crafting picker still uses `equipmentCurrency`).
 */
export function codexEquipmentDisplayCurrency(
  item: CodexEquipmentPricingRow,
  propertiesDb: ItemPropertyTpRow[] = [],
): number {
  if (!normalizeArmamentKind(item.type)) {
    return equipmentCurrency(item);
  }
  const pricing = resolveItemMarketPricing(
    codexArmamentPropertyPayloads(item.properties),
    propertiesDb,
    item.costs,
  );
  if (pricing.resolvedFromProperties && pricing.currencyCost > 0) {
    return pricing.currencyCost;
  }
  return equipmentCurrency(item);
}

/** Same `resolvedFromProperties` gate as `codexEquipmentDisplayCurrency` (browse + guided). */
export function codexEquipmentDisplayRarity(
  item: CodexEquipmentPricingRow & { rarity?: string | undefined },
  propertiesDb: ItemPropertyTpRow[] = [],
): string | undefined {
  if (!normalizeArmamentKind(item.type) || propertiesDb.length === 0) {
    return item.rarity;
  }
  const pricing = resolveItemMarketPricing(
    codexArmamentPropertyPayloads(item.properties),
    propertiesDb,
    item.costs,
  );
  if (pricing.resolvedFromProperties && pricing.rarity) {
    return pricing.rarity;
  }
  return item.rarity;
}

/** Persist catalog Currency onto sheet equipment — never property C sum (TASK-873). */
export function persistEquipmentCost(item: {
  currency?: number | undefined;
  gold_cost?: number | undefined;
  cost?: number | undefined;
}): number {
  const catalog = equipmentCurrency(item);
  if (catalog > 0) return catalog;
  const stored = item.cost;
  return typeof stored === 'number' && stored > 0 ? stored : 0;
}

/** Category / Currency / Rarity cells shared by Codex browse and sheet play rows (TASK-873). */
export function buildEquipmentCatalogFactColumns(item: {
  category?: string | undefined;
  rarity?: string | undefined;
  currency?: number | undefined;
  gold_cost?: number | undefined;
  cost?: number | undefined;
}): ColumnValue[] {
  const catalogCurrency = equipmentCurrency(item);
  const storedCost = item.cost != null && item.cost > 0 ? item.cost : undefined;
  const currency = catalogCurrency > 0 ? catalogCurrency : (storedCost ?? catalogCurrency);
  return [
    { key: 'category', value: formatListCellLabel(item.category), align: 'center' },
    { key: 'currency', value: currency, align: 'center' },
    { key: 'rarity', value: formatListCellLabel(item.rarity), align: 'center' },
  ];
}

export function buildCodexEquipmentColumns(
  item: CodexEquipmentItem,
  propertiesDb: ItemPropertyTpRow[] = [],
): ColumnValue[] {
  const currency = codexEquipmentDisplayCurrency(item, propertiesDb);
  const rarity =
    formatListCellLabel(codexEquipmentDisplayRarity(item, propertiesDb)) ||
    formatListCellLabel(item.rarity);
  return [
    { key: 'category', value: formatListCellLabel(item.category), align: 'center' },
    { key: 'currency', value: currency, align: 'center' },
    { key: 'rarity', value: rarity, align: 'center' },
  ];
}

export function buildCodexEquipmentDetailSections(
  item: CodexEquipmentItem,
  propertiesDb: ItemPropertyTpRow[] = [],
): MetadataDetailSection[] {
  const payloads: ItemPropertyPayload[] = codexArmamentPropertyPayloads(item.properties);
  const costs = calculateItemCosts(payloads, propertiesDb);
  const tp = Math.round(costs.totalTP);
  const propertyChips = namedPropertyDescriptorChips(item.properties, propertiesDb);
  const extra: MetadataDetailSection[] | undefined =
    propertyChips.length > 0
      ? [{ label: 'Properties', chips: propertyChips, hideLabelIfSingle: true }]
      : undefined;
  return glrSurfaceDetailSections(
    'codex-equipment',
    { trainingPoints: tp > 0 ? tp : undefined },
    extra,
  );
}

export function collectCodexEquipmentFilterOptions(items: CodexEquipmentItem[] | undefined): {
  categories: string[];
  rarities: string[];
} {
  if (!items) return { categories: [], rarities: [] };
  const categories = new Set<string>();
  const rarities = new Set<string>();
  for (const item of items) {
    if (item.category) categories.add(item.category);
    if (item.rarity) rarities.add(item.rarity);
  }
  return {
    categories: Array.from(categories).sort(),
    rarities: Array.from(rarities).sort(),
  };
}

export function filterCodexEquipment<T extends CodexEquipmentItem>(
  items: T[],
  listFilters: CodexEquipmentListFilters,
  armamentFilters: ArmamentFilterState,
  characterContext: ArmamentCharacterContext | null,
  pathRecommendedIds?: ReadonlySet<string> | null,
  propertiesDb: ItemPropertyTpRow[] = [],
): Array<T & { currency: number; category: string; rarity: string }> {
  const q = listFilters.search.trim().toLowerCase();
  const narrowed = items.filter((item) => {
    if (!rowMatchesPathRecommendedIds(item.id, pathRecommendedIds)) return false;
    if (!rowMatchesCodexRulesSourceFilter(item.sources, listFilters.rulesSources)) return false;
    if (q && !item.name.toLowerCase().includes(q) && !item.description?.toLowerCase().includes(q)) {
      return false;
    }
    if (listFilters.categoryFilter && item.category !== listFilters.categoryFilter) return false;
    if (listFilters.rarityFilter && item.rarity !== listFilters.rarityFilter) return false;
    return true;
  });

  const withCurrency = narrowed.map((item) => ({
    ...item,
    category: item.category || '',
    rarity: item.rarity || '',
    currency: codexEquipmentDisplayCurrency(item, propertiesDb),
  }));

  return applyArmamentFilters(withCurrency, armamentFilters, characterContext, 'equipment');
}
