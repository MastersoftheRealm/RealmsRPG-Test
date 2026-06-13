/**
 * Codex Properties Tab
 * ====================
 * Armament properties list with filters: search, type.
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
import { useSort } from '@/hooks/use-sort';
import { CodexMyCodexEmpty } from './CodexMyCodexEmpty';
import { useItemProperties, type ItemProperty } from '@/hooks';
import { formatListCellLabel } from '@/lib/utils';

const PROPERTY_GRID_COLUMNS = '1.5fr 1fr 0.8fr 0.8fr 0.8fr 40px';
const PROPERTY_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'type', label: 'TYPE' },
  { key: 'ip', label: 'ITEM PTS' },
  { key: 'tp', label: 'TP' },
  { key: 'cost', label: 'COST MULT' },
  { key: '_actions', label: '', sortable: false as const },
];

interface PropertyFilters {
  search: string;
  typeFilter: string;
}

function PropertyCard({ property }: { property: ItemProperty }) {
  const ip = property.base_ip ?? 0;
  const tp = property.base_tp ?? property.tp_cost ?? 0;
  const cost = property.base_c ?? property.gold_cost ?? 0;

  const optionChips: Array<{ name: string; description?: string; category: 'cost' | 'default' }> = [];
  if (property.op_1_desc) {
    const parts: string[] = [];
    // Include explicit 0 values so the user can tell the option was saved as 0 (not missing).
    if (property.op_1_ip !== undefined) parts.push(`IP ${property.op_1_ip}`);
    if (property.op_1_tp !== undefined) parts.push(`TP ${property.op_1_tp}`);
    if (property.op_1_c !== undefined) parts.push(`C ${property.op_1_c}`);
    optionChips.push({
      name: parts.length ? `Option (${parts.join(', ')})` : 'Option',
      description: property.op_1_desc,
      category: 'cost',
    });
  }

  const detailSections: Array<{ label: string; chips: Array<{ name: string; description?: string; category: 'cost' | 'default' }> }> =
    optionChips.length > 0 ? [{ label: 'Options', chips: optionChips }] : [];

  return (
    <GridListRow
      id={property.id}
      name={property.name}
      description={property.description || ''}
      gridColumns={PROPERTY_GRID_COLUMNS}
      columns={[
        { key: 'Type', value: formatListCellLabel(property.type || 'general') },
        {
          key: 'IP',
          value: typeof ip === 'number' && !Number.isNaN(ip) ? String(ip) : '-',
          className: 'text-blue-600',
        },
        {
          key: 'TP',
          value: typeof tp === 'number' && !Number.isNaN(tp) ? String(tp) : '-',
          className: 'text-tp',
        },
        {
          key: 'Cost',
          value: typeof cost === 'number' && !Number.isNaN(cost) ? `×${cost}` : '-',
          highlight: true,
        },
      ]}
      detailSections={detailSections.length > 0 ? detailSections : undefined}
    />
  );
}

export function CodexPropertiesTab({ codexMode = 'public' }: { codexMode?: 'public' | 'my' }) {
  const { data: properties, isLoading, error, refetch } = useItemProperties();
  const { sortState, handleSort } = useSort('name');
  const [filters, setFilters] = useState<PropertyFilters>({
    search: '',
    typeFilter: '',
  });

  const typeOptions = useMemo(() => {
    if (!properties) return [];
    const types = new Set<string>();
    properties.forEach((p: ItemProperty) => p.type && types.add(p.type));
    return Array.from(types).sort();
  }, [properties]);

  const filteredProperties = useMemo(() => {
    if (!properties) return [];

    const filtered = properties.filter((p: ItemProperty) => {
      if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !p.description?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.typeFilter && p.type !== filters.typeFilter) return false;
      return true;
    });
    return filtered.sort((a: ItemProperty, b: ItemProperty) => {
      const { col, dir } = sortState;
      if (col === 'name') return dir * a.name.localeCompare(b.name);
      if (col === 'type') return dir * (a.type || 'general').localeCompare(b.type || 'general');
      if (col === 'ip') return dir * ((a.base_ip ?? 0) - (b.base_ip ?? 0));
      if (col === 'tp') return dir * ((a.base_tp ?? a.tp_cost ?? 0) - (b.base_tp ?? b.tp_cost ?? 0));
      if (col === 'cost') return dir * ((a.base_c ?? a.gold_cost ?? 0) - (b.base_c ?? b.gold_cost ?? 0));
      return 0;
    });
  }, [properties, filters, sortState]);

  if (codexMode === 'my') {
    return <CodexMyCodexEmpty />;
  }

  if (error) return <ErrorState message="Failed to load properties" onRetry={() => refetch()} />;

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={filters.search} onChange={(v) => setFilters(f => ({ ...f, search: v }))} placeholder="Search properties..." />
      </div>

      <FilterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SelectFilter
            label="Type"
            value={filters.typeFilter}
            options={typeOptions.map(t => ({ value: t, label: formatListCellLabel(t) }))}
            onChange={(v) => setFilters(f => ({ ...f, typeFilter: v }))}
            placeholder="All Types"
          />
        </div>
      </FilterSection>

      <ListHeader
        columns={PROPERTY_COLUMNS}
        gridColumns={PROPERTY_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
      />

      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredProperties.length === 0 ? (
          <div className="p-8 text-center text-text-muted dark:text-text-secondary">No properties found.</div>
        ) : (
          filteredProperties.map((prop: ItemProperty) => (
            <PropertyCard key={prop.id} property={prop} />
          ))
        )}
      </div>
    </div>
  );
}
