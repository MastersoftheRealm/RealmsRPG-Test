/**
 * Codex Parts Tab
 * ===============
 * Power & technique parts list with filters: search, category, type, mechanics.
 */

'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
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
  type ChipData,
} from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import { useParts } from '@/hooks';

const PART_GRID_COLUMNS = '1.5fr 1fr 0.8fr 0.8fr 40px';
const PART_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'category', label: 'CATEGORY' },
  { key: 'energy', label: 'ENERGY', sortable: false as const },
  { key: 'tp', label: 'TP', sortable: false as const },
  { key: '_actions', label: '', sortable: false as const },
];

const CHIP_SECTION_STYLES: Record<string, string> = {
  default: 'bg-primary-50 border-primary-200 text-primary-700',
  archetype: 'bg-power-light border-power-border text-power-text',
  skill: 'bg-info-50 border-info-200 text-info-700',
};

function formatEnergyCost(en: number | undefined, isPercentage: boolean | undefined): string {
  if (en === undefined || en === 0) return '-';
  if (isPercentage) {
    const percentChange = (en - 1) * 100;
    const sign = percentChange >= 0 ? '+' : '';
    return `${sign}${percentChange.toFixed(percentChange % 1 === 0 ? 0 : 1)}%`;
  }
  return String(en);
}

type Part = NonNullable<ReturnType<typeof useParts>['data']>[number];

function PartCard({ part }: { part: Part }) {
  const typeChips: ChipData[] = [
    {
      name: part.type === 'power' ? 'Power' : 'Technique',
      category: part.type === 'power' ? 'archetype' : 'skill',
    },
  ];
  if (part.mechanic) typeChips.push({ name: 'Mechanic', category: 'default' });
  if (part.percentage) typeChips.push({ name: 'Percentage Cost', category: 'archetype' });

  const optionChips: ChipData[] = [];
  if (part.op_1_desc) {
    const enStr = part.op_1_en !== undefined && part.op_1_en !== 0 ? formatEnergyCost(part.op_1_en, part.percentage) : null;
    const tpStr = part.op_1_tp !== undefined && part.op_1_tp !== 0 ? String(part.op_1_tp) : null;
    const costParts = [enStr && `EN: ${enStr}`, tpStr && `TP: ${tpStr}`].filter(Boolean);
    optionChips.push({
      name: costParts.length ? `Option 1 (${costParts.join(', ')})` : 'Option 1',
      description: part.op_1_desc,
      category: 'cost',
    });
  }
  if (part.op_2_desc) {
    const enStr = part.op_2_en !== undefined && part.op_2_en !== 0 ? formatEnergyCost(part.op_2_en, part.percentage) : null;
    const tpStr = part.op_2_tp !== undefined && part.op_2_tp !== 0 ? String(part.op_2_tp) : null;
    const costParts = [enStr && `EN: ${enStr}`, tpStr && `TP: ${tpStr}`].filter(Boolean);
    optionChips.push({
      name: costParts.length ? `Option 2 (${costParts.join(', ')})` : 'Option 2',
      description: part.op_2_desc,
      category: 'cost',
    });
  }
  if (part.op_3_desc) {
    const enStr = part.op_3_en !== undefined && part.op_3_en !== 0 ? formatEnergyCost(part.op_3_en, part.percentage) : null;
    const tpStr = part.op_3_tp !== undefined && part.op_3_tp !== 0 ? String(part.op_3_tp) : null;
    const costParts = [enStr && `EN: ${enStr}`, tpStr && `TP: ${tpStr}`].filter(Boolean);
    optionChips.push({
      name: costParts.length ? `Option 3 (${costParts.join(', ')})` : 'Option 3',
      description: part.op_3_desc,
      category: 'cost',
    });
  }

  const detailSections: Array<{ label: string; chips: ChipData[]; hideLabelIfSingle?: boolean }> = [
    { label: 'Type', chips: typeChips, hideLabelIfSingle: true },
    ...(optionChips.length > 0 ? [{ label: 'Options', chips: optionChips }] : []),
  ];

  return (
    <GridListRow
      id={part.id}
      name={part.name}
      description={part.description || ''}
      gridColumns={PART_GRID_COLUMNS}
      columns={[
        { key: 'Category', value: part.category || '-' },
        { key: 'Energy', value: formatEnergyCost(part.base_en, part.percentage), className: 'text-blue-600' },
        { key: 'TP', value: part.base_tp ? part.base_tp : '-', className: 'text-tp' },
      ]}
      detailSections={detailSections}
    />
  );
}

interface PartFilters {
  search: string;
  categoryFilter: string;
  typeFilter: 'all' | 'power' | 'technique';
  mechanicMode: 'all' | 'only' | 'hide';
}

export function CodexPartsTab() {
  const { data: parts, isLoading, error } = useParts();
  const { sortState, handleSort, sortItems } = useSort('name');
  const [filters, setFilters] = useState<PartFilters>({
    search: '',
    categoryFilter: '',
    typeFilter: 'all',
    mechanicMode: 'hide',
  });

  const filterOptions = useMemo(() => {
    if (!parts) return { categories: [] };
    const categories = new Set<string>();
    parts.forEach((p: Part) => {
      if (p.category) categories.add(p.category);
    });
    return {
      categories: Array.from(categories).sort(),
    };
  }, [parts]);

  const filteredParts = useMemo(() => {
    if (!parts) return [];

    const filtered = parts.filter((p: Part) => {
      if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !p.description?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.categoryFilter && p.category !== filters.categoryFilter) return false;

      if (filters.typeFilter !== 'all' && p.type !== filters.typeFilter) return false;

      if (filters.mechanicMode === 'only' && !p.mechanic) return false;
      if (filters.mechanicMode === 'hide' && p.mechanic) return false;

      return true;
    });
    type FilteredPart = Part & { category: string };
    return sortItems<FilteredPart>(filtered.map((p: Part) => ({ ...p, category: p.category || '' })));
  }, [parts, filters, sortItems]);

  if (error) return <ErrorState message="Failed to load parts" />;

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={filters.search} onChange={(v) => setFilters(f => ({ ...f, search: v }))} placeholder="Search parts..." />
      </div>

      <FilterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SelectFilter
            label="Category"
            value={filters.categoryFilter}
            options={filterOptions.categories.map(c => ({ value: c, label: c }))}
            onChange={(v) => setFilters(f => ({ ...f, categoryFilter: v }))}
            placeholder="All Categories"
          />

          <SelectFilter
            label="Type"
            value={filters.typeFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'power', label: 'Power' },
              { value: 'technique', label: 'Technique' },
            ]}
            onChange={(v) => setFilters(f => ({ ...f, typeFilter: v as 'all' | 'power' | 'technique' }))}
            placeholder="All"
          />

          <SelectFilter
            label="Mechanics"
            value={filters.mechanicMode}
            options={[
              { value: 'all', label: 'All Parts' },
              { value: 'only', label: 'Only Mechanics' },
              { value: 'hide', label: 'Hide Mechanics' },
            ]}
            onChange={(v) => setFilters(f => ({ ...f, mechanicMode: v as 'all' | 'only' | 'hide' }))}
            placeholder="Hide Mechanics"
          />
        </div>
      </FilterSection>

      <ListHeader
        columns={PART_COLUMNS}
        gridColumns={PART_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
      />

      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredParts.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No parts found.</div>
        ) : (
          filteredParts.map(part => (
            <PartCard key={part.id} part={part} />
          ))
        )}
      </div>
    </div>
  );
}
