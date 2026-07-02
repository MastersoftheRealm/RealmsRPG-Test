/**
 * Codex Equipment Tab
 * ===================
 * Equipment list with filters: search, category, rarity.
 */

'use client';

import { useState, useMemo } from 'react';
import {
  SelectFilter,
  FilterSection,
} from '@/components/codex';
import {
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay as ErrorState,
  GridListRow,
} from '@/components/shared';
import { EmptyState } from '@/components/ui';
import { formatDamageDisplay, formatListCellLabel } from '@/lib/utils';
import { useSort } from '@/hooks/use-sort';
import { useEquipment, useItemProperties, type ItemProperty } from '@/hooks';
import { trainingPointsForItemPropertyRef } from '@/lib/calculators/item-calc';
import type { ChipData } from '@/components/shared/grid-list-row';

const EQUIPMENT_GRID_COLUMNS = '1.5fr 1fr 0.8fr 1fr 40px';
const EQUIPMENT_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'category', label: 'CATEGORY' },
  { key: 'cost', label: 'COST' },
  { key: 'rarity', label: 'RARITY' },
  { key: '_actions', label: '', sortable: false as const },
];

interface Equipment {
  id: string;
  name: string;
  description?: string;
  category?: string;
  gold_cost?: number;
  currency?: number;
  weight?: number;
  rarity?: string;
  damage?: string;
  armor_value?: number;
  properties?: string[];
}

interface EquipmentFilters {
  search: string;
  categoryFilter: string;
  rarityFilter: string;
}

function EquipmentCard({ item, propertiesDb = [] }: { item: Equipment; propertiesDb?: ItemProperty[] }) {
  const cost = item.currency ?? item.gold_cost ?? 0;

  const propertyChips = useMemo((): ChipData[] => {
    if (!item.properties || item.properties.length === 0) return [];
    return item.properties.map((propName: string) => {
      const match = propertiesDb.find((p: ItemProperty) => p.name.toLowerCase() === propName.toLowerCase());
      const cost = trainingPointsForItemPropertyRef(propName, propertiesDb);
      return {
        name: match?.name || propName,
        description: match?.description,
        cost: cost > 0 ? cost : undefined,
        costLabel: 'TP',
        category: (cost > 0 ? 'cost' : 'default') as 'cost' | 'default',
      };
    });
  }, [item.properties, propertiesDb]);

  const detailSections: Array<{ label: string; chips: ChipData[]; hideLabelIfSingle?: boolean }> = [];
  if (propertyChips.length > 0) {
    detailSections.push({ label: 'Properties', chips: propertyChips, hideLabelIfSingle: true });
  }
  const statsChips: { name: string; category: 'default' }[] = [];
  if (item.damage) statsChips.push({ name: `Damage: ${formatDamageDisplay(item.damage)}`, category: 'default' });
  if (item.armor_value !== undefined) statsChips.push({ name: `Armor: ${item.armor_value}`, category: 'default' });
  if (item.weight !== undefined) statsChips.push({ name: `Weight: ${item.weight} kg`, category: 'default' });
  if (statsChips.length > 0) {
    detailSections.push({ label: 'Stats', chips: statsChips, hideLabelIfSingle: true });
  }

  return (
    <GridListRow
      id={item.id}
      name={item.name}
      description={item.description}
      gridColumns={EQUIPMENT_GRID_COLUMNS}
      columns={[
        { key: 'Category', value: formatListCellLabel(item.category) },
        {
          key: 'Cost',
          value: typeof cost === 'number' && !Number.isNaN(cost) ? `${cost}c` : '-',
          highlight: true,
        },
        { key: 'Rarity', value: formatListCellLabel(item.rarity) },
      ]}
      detailSections={detailSections.length > 0 ? detailSections : undefined}
    />
  );
}

export function CodexEquipmentTab({ codexMode = 'public' }: { codexMode?: 'public' | 'my' }) {
  const loadPublicCodex = codexMode === 'public';
  const { data: equipment, isLoading, error, refetch } = useEquipment({ enabled: loadPublicCodex });
  const { data: propertiesDb = [] } = useItemProperties({ enabled: loadPublicCodex });
  const { sortState, handleSort, sortItems } = useSort('name');
  const [filters, setFilters] = useState<EquipmentFilters>({
    search: '',
    categoryFilter: '',
    rarityFilter: '',
  });

  const filterOptions = useMemo(() => {
    if (!equipment) return { categories: [], rarities: [] };
    const categories = new Set<string>();
    const rarities = new Set<string>();
    equipment.forEach((e: Equipment) => {
      if (e.category) categories.add(e.category);
      if (e.rarity) rarities.add(e.rarity);
    });
    return {
      categories: Array.from(categories).sort(),
      rarities: Array.from(rarities).sort()
    };
  }, [equipment]);

  const filteredEquipment = useMemo(() => {
    if (!equipment) return [];

    const filtered = equipment.filter((e: Equipment) => {
      if (filters.search && !e.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !e.description?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.categoryFilter && e.category !== filters.categoryFilter) return false;
      if (filters.rarityFilter && e.rarity !== filters.rarityFilter) return false;
      return true;
    });
    type FilteredItem = Equipment & { category: string; cost: number; rarity: string };
    return sortItems<FilteredItem>(filtered.map((e: Equipment) => ({
      ...e,
      category: e.category || '',
      cost: e.currency ?? e.gold_cost ?? 0,
      rarity: e.rarity || '',
    })));
  }, [equipment, filters, sortItems]);

  if (codexMode === 'my') {
    return (
      <EmptyState
        size="lg"
        title="My Codex: Equipment"
        description="Custom equipment lives in Library (My Library). Use Realms Codex for reference."
      />
    );
  }

  if (error) return <ErrorState message="Failed to load equipment" onRetry={() => refetch()} />;

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={filters.search} onChange={(v) => setFilters(f => ({ ...f, search: v }))} placeholder="Search equipment..." />
      </div>

      <FilterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SelectFilter
            label="Category"
            value={filters.categoryFilter}
            options={filterOptions.categories.map(c => ({ value: c, label: c }))}
            onChange={(v) => setFilters(f => ({ ...f, categoryFilter: v }))}
            placeholder="All Categories"
          />
          <SelectFilter
            label="Rarity"
            value={filters.rarityFilter}
            options={filterOptions.rarities.map(r => ({ value: r, label: r }))}
            onChange={(v) => setFilters(f => ({ ...f, rarityFilter: v }))}
            placeholder="All Rarities"
          />
        </div>
      </FilterSection>

      <ListHeader
        columns={EQUIPMENT_COLUMNS}
        gridColumns={EQUIPMENT_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
      />

      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredEquipment.length === 0 ? (
          <EmptyState title="No equipment found." size="sm" />
        ) : (
          filteredEquipment.map((item: Equipment & { category: string; cost: number; rarity: string }) => (
            <EquipmentCard key={item.id} item={item} propertiesDb={propertiesDb} />
          ))
        )}
      </div>
    </div>
  );
}
