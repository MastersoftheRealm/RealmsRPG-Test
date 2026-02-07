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
  SortHeader,
  LoadingState,
  ErrorDisplay as ErrorState,
  GridListRow,
} from '@/components/shared';
import { formatDamageDisplay } from '@/lib/utils';
import { useSort } from '@/hooks/use-sort';
import { useEquipment, useItemProperties, type ItemProperty } from '@/hooks';

const EQUIPMENT_GRID_COLUMNS = '1.5fr 1fr 0.8fr 1fr 40px';

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

  const propertyChips = useMemo(() => {
    if (!item.properties || item.properties.length === 0) return [];
    return item.properties.map((propName: string) => {
      const match = propertiesDb.find((p: ItemProperty) => p.name.toLowerCase() === propName.toLowerCase());
      return {
        name: match?.name || propName,
        description: match?.description,
        category: 'default' as const,
      };
    });
  }, [item.properties, propertiesDb]);

  const detailSections: Array<{ label: string; chips: { name: string; description?: string; category?: 'default' }[]; hideLabelIfSingle?: boolean }> = [];
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
        { key: 'Category', value: item.category || '-' },
        { key: 'Cost', value: cost > 0 ? `${cost}c` : '-', highlight: true },
        { key: 'Rarity', value: item.rarity || '-' },
      ]}
      detailSections={detailSections.length > 0 ? detailSections : undefined}
    />
  );
}

export function CodexEquipmentTab() {
  const { data: equipment, isLoading, error } = useEquipment();
  const { data: propertiesDb = [] } = useItemProperties();
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

  if (error) return <ErrorState message="Failed to load equipment" />;

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

      <div
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: EQUIPMENT_GRID_COLUMNS }}
      >
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="CATEGORY" col="category" sortState={sortState} onSort={handleSort} />
        <SortHeader label="COST" col="cost" sortState={sortState} onSort={handleSort} />
        <SortHeader label="RARITY" col="rarity" sortState={sortState} onSort={handleSort} />
      </div>

      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredEquipment.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No equipment found.</div>
        ) : (
          filteredEquipment.map((item: Equipment & { category: string; cost: number; rarity: string }) => (
            <EquipmentCard key={item.id} item={item} propertiesDb={propertiesDb} />
          ))
        )}
      </div>
    </div>
  );
}
