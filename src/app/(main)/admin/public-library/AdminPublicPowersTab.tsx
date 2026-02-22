/**
 * Admin Public Library — Powers tab
 * List displayed like Library. Edit opens Power Creator with item loaded; row delete remains.
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  SectionHeader,
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay,
  GridListRow,
  ListEmptyState,
  DeleteConfirmModal,
  type ChipData,
} from '@/components/shared';
import { usePublicLibrary, usePowerParts } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useSort } from '@/hooks/use-sort';
import { derivePowerDisplay, formatPowerDamage } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { Wand2 } from 'lucide-react';

const POWER_GRID = '1.5fr 0.8fr 1fr 1fr 0.8fr 1fr 1fr 40px';
const QUERY_KEY = ['public-library', 'powers'] as const;

export function AdminPublicPowersTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: items = [], isLoading, error } = usePublicLibrary('powers');
  const { data: partsDb = [] } = usePowerParts();
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => {
    return (items as Array<Record<string, unknown>>).map((p) => {
      const doc: PowerDocument = {
        name: String(p.name ?? ''),
        description: String(p.description ?? ''),
        parts: Array.isArray(p.parts) ? (p.parts as PowerDocument['parts']) : [],
        damage: p.damage as PowerDocument['damage'],
        actionType: p.actionType as string | undefined,
        isReaction: p.isReaction as boolean | undefined,
        range: p.range as PowerDocument['range'],
        area: p.area as PowerDocument['area'],
        duration: p.duration as PowerDocument['duration'],
      };
      const display = derivePowerDisplay(doc, partsDb);
      const damageStr = formatPowerDamage(doc.damage);
      const parts: ChipData[] = display.partChips.map((chip) => ({
        name: chip.text.split(' | TP:')[0].replace(/\s*\(Opt\d+ \d+\)/g, '').trim(),
        description: chip.description,
        cost: chip.finalTP,
        costLabel: 'TP',
      }));
      return {
        id: String(p.id ?? p.docId ?? ''),
        raw: p,
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
  }, [items, partsDb]);

  const filtered = useMemo(() => {
    let r = cardData;
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(
        (x) =>
          String(x.name ?? '').toLowerCase().includes(s) ||
          String(x.description ?? '').toLowerCase().includes(s)
      );
    }
    return sortItems(r);
  }, [cardData, search, sortItems]);

  const handleDeleteFromList = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/public/powers?id=${encodeURIComponent(deleteConfirm.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(res.statusText);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleteConfirm(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  if (error) return <ErrorDisplay message="Failed to load public powers" />;

  return (
    <div>
      <SectionHeader title="Public Powers" size="md" />
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search powers..." />
      </div>
      <ListHeader
        columns={[
          { key: 'name', label: 'NAME' },
          { key: 'energy', label: 'ENERGY', sortable: false as const },
          { key: 'action', label: 'ACTION', sortable: false as const },
          { key: 'duration', label: 'DURATION', sortable: false as const },
          { key: 'range', label: 'RANGE', sortable: false as const },
          { key: 'area', label: 'AREA', sortable: false as const },
          { key: 'damage', label: 'DAMAGE', sortable: false as const },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns={POWER_GRID}
        sortState={sortState}
        onSort={handleSort}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <ListEmptyState
            icon={<Wand2 className="w-8 h-8" />}
            title="No public powers"
            message="Add one from the header or publish from a creator."
          />
        ) : (
          filtered.map((p) => (
            <GridListRow
              key={p.id}
              id={p.id}
              name={p.name}
              description={p.description}
              gridColumns={POWER_GRID}
              columns={[
                { key: 'Energy', value: p.energy, highlight: true },
                { key: 'Action', value: p.action },
                { key: 'Duration', value: p.duration },
                { key: 'Range', value: p.range },
                { key: 'Area', value: p.area },
                { key: 'Damage', value: p.damage },
              ]}
              chips={p.parts}
              chipsLabel="Parts"
              totalCost={p.tp}
              costLabel="TP"
              onEdit={() => router.push(`/power-creator?edit=${encodeURIComponent(p.id)}`)}
              onDelete={() => setDeleteConfirm({ id: p.id, name: p.name })}
            />
          ))
        )}
      </div>

      {deleteConfirm && (
        <DeleteConfirmModal
          isOpen={true}
          itemName={deleteConfirm.name}
          itemType="power"
          deleteContext="public library"
          isDeleting={false}
          onConfirm={handleDeleteFromList}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
