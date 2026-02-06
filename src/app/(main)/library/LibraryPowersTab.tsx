/**
 * Library Powers Tab
 * ===================
 * User's powers list with search and sort.
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Wand2 } from 'lucide-react';
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
import { derivePowerDisplay, formatPowerDamage } from '@/lib/calculators/power-calc';
import { useUserPowers, usePowerParts, useDuplicatePower } from '@/hooks';
import { Button } from '@/components/ui';
import type { DisplayItem } from '@/types';

const POWER_GRID_COLUMNS = '1.5fr 0.8fr 1fr 1fr 0.8fr 1fr 1fr 40px';

const POWER_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'energy', label: 'Energy' },
  { key: 'action', label: 'Action' },
  { key: 'duration', label: 'Duration' },
  { key: 'range', label: 'Range' },
  { key: 'area', label: 'Area' },
  { key: 'damage', label: 'Damage' },
];

interface LibraryPowersTabProps {
  onDelete: (item: DisplayItem) => void;
}

export function LibraryPowersTab({ onDelete }: LibraryPowersTabProps) {
  const { data: powers, isLoading, error } = useUserPowers();
  const { data: partsDb = [] } = usePowerParts();
  const duplicatePower = useDuplicatePower();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => {
    if (!powers) return [];

    return powers.map(power => {
      const display = derivePowerDisplay(
        {
          name: power.name,
          description: power.description,
          parts: power.parts || [],
          damage: power.damage,
          actionType: power.actionType,
          isReaction: power.isReaction,
          range: power.range,
          area: power.area,
          duration: power.duration,
        },
        partsDb
      );

      const damageStr = formatPowerDamage(power.damage);

      const parts: ChipData[] = display.partChips.map(chip => ({
        name: chip.text.split(' | TP:')[0].replace(/\s*\(Opt\d+ \d+\)/g, '').trim(),
        description: chip.description,
        cost: chip.finalTP,
        costLabel: 'TP',
      }));

      return {
        id: power.docId,
        name: display.name,
        description: display.description,
        energy: display.energy,
        action: display.actionType,
        duration: display.duration,
        range: display.range,
        area: display.area,
        damage: damageStr,
        tp: display.tp,
        parts,
      };
    });
  }, [powers, partsDb]);

  const filteredData = useMemo(() => {
    let result = cardData;

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    return sortItems(result);
  }, [cardData, search, sortItems]);

  if (error) {
    return <ErrorDisplay message="Failed to load powers" subMessage="Please try again later" />;
  }

  if (!isLoading && cardData.length === 0) {
    return (
      <ListEmptyState
        icon={<Wand2 className="w-8 h-8" />}
        title="No powers yet"
        message="Create your first power to see it here in your library."
        action={
          <Button asChild>
            <Link href="/power-creator">
              <Plus className="w-4 h-4" />
              Create Power
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
          placeholder="Search powers..."
        />
      </div>

      <div
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: POWER_GRID_COLUMNS }}
      >
        {POWER_COLUMNS.map(col => (
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
          <div className="py-12 text-center text-text-muted">No powers match your search.</div>
        ) : (
          filteredData.map(power => (
            <GridListRow
              key={power.id}
              id={power.id}
              name={power.name}
              description={power.description}
              gridColumns={POWER_GRID_COLUMNS}
              columns={[
                { key: 'Energy', value: power.energy, highlight: true },
                { key: 'Action', value: power.action },
                { key: 'Duration', value: power.duration },
                { key: 'Range', value: power.range },
                { key: 'Area', value: power.area },
                { key: 'Damage', value: power.damage },
              ]}
              chips={power.parts}
              chipsLabel="Parts & Proficiencies"
              totalCost={power.tp}
              costLabel="TP"
              onEdit={() => window.open(`/power-creator?edit=${power.id}`, '_blank')}
              onDelete={() => onDelete({ id: power.id, name: power.name } as DisplayItem)}
              onDuplicate={() => duplicatePower.mutate(power.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
