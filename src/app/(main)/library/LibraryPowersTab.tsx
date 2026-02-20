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
  ListHeader,
  LoadingState,
  ErrorDisplay,
  ListEmptyState,
  type ChipData,
} from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import { derivePowerDisplay, formatPowerDamage } from '@/lib/calculators/power-calc';
import { useUserPowers, usePowerParts, useDuplicatePower, usePublicLibrary, useAddPublicToLibrary } from '@/hooks';
import { Button, useToast } from '@/components/ui';
import type { DisplayItem } from '@/types';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';

const POWER_GRID_COLUMNS = '1.5fr 0.8fr 1fr 1fr 0.8fr 1fr 1fr 40px';
const POWER_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'energy', label: 'ENERGY' },
  { key: 'action', label: 'ACTION' },
  { key: 'duration', label: 'DURATION' },
  { key: 'range', label: 'RANGE' },
  { key: 'area', label: 'AREA' },
  { key: 'damage', label: 'DAMAGE' },
  { key: '_actions', label: '', sortable: false as const },
];

interface LibraryPowersTabProps {
  source: SourceFilterValue;
  onDelete: (item: DisplayItem) => void;
}

export function LibraryPowersTab({ source, onDelete }: LibraryPowersTabProps) {
  const { showToast } = useToast();
  const { data: powers = [], isLoading: loadingUser, error } = useUserPowers();
  const { data: publicItems = [], isLoading: loadingPublic } = usePublicLibrary('powers');
  const { data: partsDb = [] } = usePowerParts();
  const duplicatePower = useDuplicatePower();
  const addPublic = useAddPublicToLibrary('powers');
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => {
    const rows: Array<{
      id: string;
      name: string;
      description: string;
      energy: string | number;
      action: string;
      duration: string;
      range: string;
      area: string;
      damage: string;
      tp: number;
      parts: ChipData[];
      itemSource: 'my' | 'public';
      raw: Record<string, unknown>;
    }> = [];

    const toRow = (p: { docId?: string; id?: string; name?: string; description?: string; parts?: unknown[]; damage?: unknown; actionType?: string; isReaction?: boolean; range?: unknown; area?: unknown; duration?: unknown }, itemSource: 'my' | 'public', raw: Record<string, unknown>) => {
      const doc: PowerDocument = {
        name: String(p.name ?? ''),
        description: String(p.description ?? ''),
        parts: Array.isArray(p.parts) ? (p.parts as PowerDocument['parts']) : [],
        damage: p.damage as PowerDocument['damage'],
        actionType: p.actionType,
        isReaction: p.isReaction,
        range: p.range as PowerDocument['range'],
        area: p.area as PowerDocument['area'],
        duration: p.duration as PowerDocument['duration'],
      };
      const display = derivePowerDisplay(doc, partsDb);
      const damageStr = formatPowerDamage(doc.damage);
      const parts: ChipData[] = display.partChips.map(chip => ({
        name: chip.text.split(' | TP:')[0].replace(/\s*\(Opt\d+ \d+\)/g, '').trim(),
        description: chip.description,
        cost: chip.finalTP,
        costLabel: 'TP',
      }));
      return {
        id: String(p.docId ?? p.id ?? ''),
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
        itemSource,
        raw,
      };
    };

    if (source === 'my' || source === 'all') {
      powers.forEach(p => rows.push(toRow(p, 'my', p as unknown as Record<string, unknown>)));
    }
    if (source === 'public' || source === 'all') {
      publicItems.forEach((p: Record<string, unknown>) => {
        rows.push(toRow(p as Parameters<typeof toRow>[0], 'public', p));
      });
    }
    return rows;
  }, [powers, publicItems, partsDb, source]);

  const isLoading = ((source === 'my' || source === 'all') && loadingUser) || ((source === 'public' || source === 'all') && loadingPublic);

  const filteredData = useMemo(() => {
    let result = cardData;

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(p =>
        String(p.name ?? '').toLowerCase().includes(searchLower) ||
        String(p.description ?? '').toLowerCase().includes(searchLower)
      );
    }

    return sortItems(result);
  }, [cardData, search, sortItems]);

  if (error) {
    return <ErrorDisplay message="Failed to load powers" subMessage="Please try again later" />;
  }

  if (!isLoading && cardData.length === 0) {
    const isPublicOnly = source === 'public';
    return (
      <ListEmptyState
        icon={<Wand2 className="w-8 h-8" />}
        title={isPublicOnly ? 'No public powers' : 'No powers yet'}
        message={isPublicOnly ? 'Public powers will appear here when admins add them.' : 'Create your first power to see it here in your library.'}
        action={!isPublicOnly ? (
          <Button asChild>
            <Link href="/power-creator">
              <Plus className="w-4 h-4" />
              Create Power
            </Link>
          </Button>
        ) : undefined}
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

      <ListHeader
        columns={POWER_HEADER_COLUMNS}
        gridColumns={POWER_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
      />

      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredData.length === 0 ? (
          <div className="py-12 text-center text-text-muted">No powers match your search.</div>
        ) : (
          filteredData.map(power => (
            <GridListRow
              key={`${power.itemSource}-${power.id}`}
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
              badges={power.itemSource === 'public' ? [{ label: 'Public', color: 'blue' }] : undefined}
              onEdit={power.itemSource === 'my' ? () => window.open(`/power-creator?edit=${power.id}`, '_blank') : undefined}
              onDelete={power.itemSource === 'my' ? () => onDelete({ id: power.id, name: power.name } as DisplayItem) : undefined}
              onDuplicate={power.itemSource === 'my' ? () => duplicatePower.mutate(power.id, { onError: (e) => showToast(e?.message ?? 'Failed to duplicate', 'error') }) : undefined}
              onAddToLibrary={power.itemSource === 'public' ? () => addPublic.mutate(power.raw, { onError: (e) => showToast(e?.message ?? 'Failed to add to library', 'error') }) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
