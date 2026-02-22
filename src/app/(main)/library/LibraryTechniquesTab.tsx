/**
 * Library Techniques Tab
 * ======================
 * User's techniques with search and sort.
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Swords } from 'lucide-react';
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
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import { deriveTechniqueDisplay, formatTechniqueDamage } from '@/lib/calculators/technique-calc';
import { useUserTechniques, useTechniqueParts, useDuplicateTechnique } from '@/hooks';
import { Button, useToast } from '@/components/ui';
import type { DisplayItem } from '@/types';

const TECHNIQUE_GRID_COLUMNS = '1.5fr 0.8fr 0.8fr 1fr 1fr 1fr 40px';
const TECHNIQUE_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'energy', label: 'ENERGY' },
  { key: 'tp', label: 'TP' },
  { key: 'action', label: 'ACTION' },
  { key: 'weapon', label: 'WEAPON' },
  { key: 'damage', label: 'DAMAGE' },
  { key: '_actions', label: '', sortable: false as const },
];

interface LibraryTechniquesTabProps {
  onDelete: (item: DisplayItem) => void;
}

export function LibraryTechniquesTab({ onDelete }: LibraryTechniquesTabProps) {
  const { showToast } = useToast();
  const { data: techniques = [], isLoading, error } = useUserTechniques();
  const { data: partsDb = [] } = useTechniqueParts();
  const duplicateTechnique = useDuplicateTechnique();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => {
    return techniques.map(tech => {
      const doc: TechniqueDocument = {
        name: String(tech.name ?? ''),
        description: String(tech.description ?? ''),
        parts: Array.isArray(tech.parts) ? (tech.parts as TechniqueDocument['parts']) : [],
        damage: Array.isArray(tech.damage) ? (tech.damage[0] as TechniqueDocument['damage']) : (tech.damage as TechniqueDocument['damage']),
        weapon: tech.weapon as TechniqueDocument['weapon'],
      };
      const display = deriveTechniqueDisplay(doc, partsDb);
      const damageStr = formatTechniqueDamage(doc.damage);
      const parts: ChipData[] = display.partChips.map(chip => ({
        name: chip.text.split(' | TP:')[0].replace(/\s*\(Opt\d+ \d+\)/g, '').trim(),
        description: chip.description,
        cost: chip.finalTP,
        costLabel: 'TP',
      }));
      return {
        id: String(tech.docId ?? tech.id ?? ''),
        name: display.name,
        description: display.description,
        energy: display.energy,
        tp: display.tp,
        action: display.actionType,
        weapon: display.weaponName || '-',
        damage: damageStr,
        parts,
      };
    });
  }, [techniques, partsDb]);

  const filteredData = useMemo(() => {
    let result = cardData;
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(t =>
        String(t.name ?? '').toLowerCase().includes(searchLower) ||
        String(t.description ?? '').toLowerCase().includes(searchLower) ||
        String(t.weapon ?? '').toLowerCase().includes(searchLower)
      );
    }
    return sortItems(result);
  }, [cardData, search, sortItems]);

  if (error) {
    return <ErrorDisplay message="Failed to load techniques" subMessage="Please try again later" />;
  }

  if (!isLoading && cardData.length === 0) {
    return (
      <ListEmptyState
        icon={<Swords className="w-8 h-8" />}
        title="No techniques yet"
        message="Create your first technique to see it here in your library."
        action={
          <Button asChild>
            <Link href="/technique-creator">
              <Plus className="w-4 h-4" />
              Create Technique
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
          placeholder="Search techniques..."
        />
      </div>

      <ListHeader
        columns={TECHNIQUE_HEADER_COLUMNS}
        gridColumns={TECHNIQUE_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
      />

      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredData.length === 0 ? (
          <div className="py-12 text-center text-text-muted">No techniques match your search.</div>
        ) : (
          filteredData.map(tech => (
            <GridListRow
              key={tech.id}
              id={tech.id}
              name={tech.name}
              description={tech.description}
              gridColumns={TECHNIQUE_GRID_COLUMNS}
              columns={[
                { key: 'Energy', value: tech.energy, highlight: true },
                { key: 'TP', value: tech.tp },
                { key: 'Action', value: tech.action },
                { key: 'Weapon', value: tech.weapon },
                { key: 'Damage', value: tech.damage },
              ]}
              chips={tech.parts}
              chipsLabel="Parts & Proficiencies"
              totalCost={typeof tech.tp === 'number' ? tech.tp : (parseFloat(String(tech.tp)) || undefined)}
              costLabel="TP"
              onEdit={() => window.open(`/technique-creator?edit=${tech.id}`, '_blank')}
              onDelete={() => onDelete({ id: tech.id, name: tech.name } as DisplayItem)}
              onDuplicate={() => duplicateTechnique.mutate(tech.id, { onError: (e) => showToast(e?.message ?? 'Failed to duplicate', 'error') })}
            />
          ))
        )}
      </div>
    </div>
  );
}
