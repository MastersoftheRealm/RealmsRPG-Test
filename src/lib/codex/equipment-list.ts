/**
 * Shared Codex + Admin equipment list helpers (TASK-723).
 * Mixed GLR: Category / Currency / Rarity columns; damage and DR as expand chips.
 */

import type { ChipData, ColumnValue } from '@/components/shared/grid-list-row-types';
import {
  metadataDescriptorChip,
  metadataDetailSection,
  type MetadataDetailSection,
} from '@/lib/chip/list-row-metadata';
import {
  damageFactChip,
  damageReductionFactChip,
  namedPropertyDescriptorChips,
} from '@/lib/detail-option/compact-facts';
import type { ItemPropertyTpRow } from '@/lib/calculators/item-calc';
import {
  applyArmamentFilters,
  type ArmamentFilterState,
} from '@/lib/library/armament-filters';
import type { ArmamentCharacterContext } from '@/lib/library/armament-character-context';
import type { CodexEquipmentItem } from '@/types/codex';
import { formatListCellLabel } from '@/lib/utils';

export const EQUIPMENT_GRID_COLUMNS = '1.5fr 1.1fr 0.7fr 0.85fr';

/** Data columns only — admin action chrome uses CodexBrowseListShell `rowChrome`. */
export const CODEX_EQUIPMENT_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'category', label: 'CATEGORY' },
  { key: 'currency', label: 'CURRENCY' },
  { key: 'rarity', label: 'RARITY' },
];

export interface CodexEquipmentListFilters {
  search: string;
  categoryFilter: string;
  rarityFilter: string;
}

export function equipmentCurrency(item: { currency?: number; gold_cost?: number }): number {
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
  propertiesDb: ItemPropertyTpRow[] = []
): MetadataDetailSection[] {
  const sections: MetadataDetailSection[] = [];
  const propertyChips = namedPropertyDescriptorChips(item.properties, propertiesDb);
  if (propertyChips.length > 0) {
    sections.push({ label: 'Properties', chips: propertyChips, hideLabelIfSingle: true });
  }

  const factChips: ChipData[] = [];
  const damageChip = damageFactChip(item.damage);
  if (damageChip) factChips.push(damageChip);
  if (item.armor_value != null) {
    const drChip = damageReductionFactChip(item.armor_value);
    if (drChip) factChips.push(drChip);
  }
  if (item.weight !== undefined) {
    factChips.push(metadataDescriptorChip(`Weight ${item.weight} kg`));
  }
  const facts = metadataDetailSection(factChips);
  if (facts) sections.push(facts);
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
  characterContext: ArmamentCharacterContext | null
): Array<T & { currency: number; category: string; rarity: string }> {
  const q = listFilters.search.trim().toLowerCase();
  const narrowed = items.filter((item) => {
    if (
      q &&
      !item.name.toLowerCase().includes(q) &&
      !item.description?.toLowerCase().includes(q)
    ) {
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
