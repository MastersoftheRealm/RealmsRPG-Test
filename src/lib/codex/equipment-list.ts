/**
 * Shared Codex + Admin equipment list helpers (TASK-723 / TASK-806).
 * Gear GLR: Category / Currency / Rarity only (ADR-0016). Named property chips stay.
 */

import type { ColumnValue } from '@/components/patterns/list/grid-list-row-types';
import { type MetadataDetailSection } from '@/lib/chip/list-row-metadata';
import { namedPropertyDescriptorChips } from '@/lib/detail-option/compact-facts';
import type { ItemPropertyTpRow } from '@/lib/calculators/item-calc';
import { applyArmamentFilters, type ArmamentFilterState } from '@/lib/library/armament-filters';
import type { ArmamentCharacterContext } from '@/lib/library/armament-character-context';
import type { CodexEquipmentItem } from '@/types/codex';
import { formatListCellLabel } from '@/lib/utils';
import { rowMatchesPathRecommendedIds } from '@/lib/game/path-recommendation-index';
import { glrListChrome } from '@/lib/glr';

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
}

export function equipmentCurrency(item: {
  currency?: number | undefined;
  gold_cost?: number | undefined;
}): number {
  const value = item.currency ?? item.gold_cost ?? 0;
  return typeof value === 'number' && !Number.isNaN(value) ? value : 0;
}

export function buildCodexEquipmentColumns(item: CodexEquipmentItem): ColumnValue[] {
  const currency = equipmentCurrency(item);
  return [
    { key: 'category', value: formatListCellLabel(item.category) },
    { key: 'currency', value: currency },
    { key: 'rarity', value: formatListCellLabel(item.rarity) },
  ];
}

export function buildCodexEquipmentDetailSections(
  item: CodexEquipmentItem,
  propertiesDb: ItemPropertyTpRow[] = [],
): MetadataDetailSection[] {
  const sections: MetadataDetailSection[] = [];
  const propertyChips = namedPropertyDescriptorChips(item.properties, propertiesDb);
  if (propertyChips.length > 0) {
    sections.push({ label: 'Properties', chips: propertyChips, hideLabelIfSingle: true });
  }
  return sections;
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
): Array<T & { currency: number; category: string; rarity: string }> {
  const q = listFilters.search.trim().toLowerCase();
  const narrowed = items.filter((item) => {
    if (!rowMatchesPathRecommendedIds(item.id, pathRecommendedIds)) return false;
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
    currency: equipmentCurrency(item),
  }));

  return applyArmamentFilters(withCurrency, armamentFilters, characterContext, 'equipment');
}
