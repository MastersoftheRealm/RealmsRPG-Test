/**
 * Library Items (Armaments) Tab
 * =============================
 * User's armaments list with search and sort.
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Shield } from 'lucide-react';
import {
  GridListRow,
  SearchInput,
  SortHeader,
  LoadingState,
  ErrorDisplay,
  ListEmptyState,
  type ChipData,
} from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import {
  calculateItemCosts,
  calculateCurrencyCostAndRarity,
  formatRange as formatItemRange,
} from '@/lib/calculators/item-calc';
import { useUserItems, useItemProperties, useDuplicateItem } from '@/hooks';
import { Button } from '@/components/ui';
import type { DisplayItem } from '@/types';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';

const ARMAMENT_GRID_COLUMNS = '1.5fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 40px';

const ARMAMENT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'rarity', label: 'Rarity' },
  { key: 'currency', label: 'Currency' },
  { key: 'tp', label: 'TP' },
  { key: 'range', label: 'Range' },
  { key: 'damage', label: 'Damage' },
];

function formatDamageValue(damage: unknown): string {
  if (!damage) return '';

  if (typeof damage === 'string') {
    return damage;
  }

  if (Array.isArray(damage)) {
    const formatted = damage.map(d => {
      if (typeof d === 'string') return d;
      if (typeof d === 'object' && d !== null) {
        const entry = d as { size?: number | string; amount?: number | string; type?: string };
        const parts: string[] = [];
        if (entry.amount && entry.size) {
          parts.push(`${entry.amount}d${entry.size}`);
        } else if (entry.amount) {
          parts.push(String(entry.amount));
        }
        if (entry.type && entry.type !== 'none') {
          parts.push(String(entry.type));
        }
        return parts.join(' ');
      }
      return '';
    }).filter(Boolean);
    return formatted.join(', ') || '';
  }

  if (typeof damage === 'object' && damage !== null) {
    const d = damage as { size?: number | string; amount?: number | string; type?: string };
    const parts: string[] = [];

    if (d.amount && d.size) {
      parts.push(`${d.amount}d${d.size}`);
    } else if (d.amount) {
      parts.push(String(d.amount));
    }

    if (d.type && d.type !== 'none') {
      parts.push(String(d.type));
    }

    return parts.join(' ');
  }

  return '';
}

interface LibraryItemsTabProps {
  source: SourceFilterValue;
  onDelete: (item: DisplayItem) => void;
}

export function LibraryItemsTab({ source, onDelete }: LibraryItemsTabProps) {
  if (source !== 'my') {
    return (
      <div className="py-12 text-center text-text-secondary">
        <p className="mb-4">Browse public armaments in the Codex.</p>
        <Button asChild variant="secondary">
          <Link href="/codex">Open Codex → Public Library</Link>
        </Button>
      </div>
    );
  }
  const router = useRouter();
  const { data: items, isLoading, error } = useUserItems();
  const { data: propertiesDb = [] } = useItemProperties();
  const duplicateItem = useDuplicateItem();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => {
    if (!items) return [];

    return items.map(item => {
      const costs = calculateItemCosts(item.properties || [], propertiesDb);
      const { currencyCost, rarity } = calculateCurrencyCostAndRarity(costs.totalCurrency, costs.totalIP);

      const rangeStr = formatItemRange(item.properties || []);

      const parts: ChipData[] = (item.properties || []).map(prop => {
        const propId = typeof prop === 'string' ? null : prop.id;
        const propName = typeof prop === 'string' ? prop : prop.name || '';
        const optLevel = typeof prop === 'string' ? 1 : prop.op_1_lvl || 1;

        const dbProp = propId
          ? propertiesDb.find((p: { id: string }) => String(p.id) === String(propId))
          : propertiesDb.find((p: { name?: string }) => p.name?.toLowerCase() === propName.toLowerCase());

        const baseTp = dbProp?.base_tp ?? dbProp?.tp_cost ?? 0;

        return {
          name: dbProp?.name || propName,
          description: dbProp?.description || '',
          cost: baseTp * optLevel,
          costLabel: 'TP',
          level: optLevel > 1 ? optLevel : undefined,
        };
      });

      const totalTP = parts.reduce((sum, p) => sum + (p.cost || 0), 0);

      const typeLabel = item.type === 'weapon' ? 'Weapon'
        : item.type === 'armor' ? 'Armor'
          : 'Equipment';

      const formattedDamage = formatDamageValue(item.damage);

      return {
        id: item.docId,
        name: item.name,
        description: item.description || '',
        type: typeLabel,
        rarity: rarity,
        currency: Math.round(currencyCost),
        tp: Math.round(totalTP),
        range: rangeStr || '-',
        damage: formattedDamage || '-',
        parts,
      };
    });
  }, [items, propertiesDb]);

  const filteredData = useMemo(() => {
    let result = cardData;

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(item =>
        String(item.name ?? '').toLowerCase().includes(searchLower) ||
        String(item.description ?? '').toLowerCase().includes(searchLower) ||
        item.parts.some(p => String(p.name ?? '').toLowerCase().includes(searchLower))
      );
    }

    return sortItems(result);
  }, [cardData, search, sortItems]);

  if (error) {
    return <ErrorDisplay message="Failed to load armaments" subMessage="Please try again later" />;
  }

  if (!isLoading && cardData.length === 0) {
    return (
      <ListEmptyState
        icon={<Shield className="w-8 h-8" />}
        title="No armaments yet"
        message="Create your first weapon, armor, or equipment to see it here."
        action={
          <Button asChild>
            <Link href="/item-creator">
              <Plus className="w-4 h-4" />
              Create Armament
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search armaments..."
        />
      </div>

      <div
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: ARMAMENT_GRID_COLUMNS }}
      >
        {ARMAMENT_COLUMNS.map(col => (
          <SortHeader
            key={col.key}
            label={col.label.toUpperCase()}
            col={col.key}
            sortState={sortState}
            onSort={handleSort}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredData.length === 0 ? (
          <div className="py-12 text-center text-text-muted">No armaments match your search.</div>
        ) : (
          filteredData.map(item => (
            <GridListRow
              key={item.id}
              id={item.id}
              name={item.name}
              description={item.description}
              gridColumns={ARMAMENT_GRID_COLUMNS}
              columns={[
                { key: 'Type', value: item.type },
                { key: 'Rarity', value: item.rarity },
                { key: 'Currency', value: item.currency },
                { key: 'TP', value: item.tp, highlight: true },
                { key: 'Range', value: item.range },
                { key: 'Damage', value: item.damage },
              ]}
              chips={item.parts}
              chipsLabel="Properties & Proficiencies"
              totalCost={item.tp}
              costLabel="TP"
              badges={[{ label: 'Mine', color: 'green' }]}
              onEdit={() => router.push(`/item-creator?edit=${item.id}`)}
              onDelete={() => onDelete({ id: item.id, name: item.name } as DisplayItem)}
              onDuplicate={() => duplicateItem.mutate(item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
