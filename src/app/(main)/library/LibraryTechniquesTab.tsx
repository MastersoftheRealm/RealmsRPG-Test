/**
 * Library Techniques Tab
 * ======================
 * User's techniques list with search and sort.
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Swords } from 'lucide-react';
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
import { deriveTechniqueDisplay, formatTechniqueDamage } from '@/lib/calculators/technique-calc';
import { useUserTechniques, useTechniqueParts, useDuplicateTechnique, usePublicLibrary, useAddPublicToLibrary } from '@/hooks';
import { Button } from '@/components/ui';
import type { DisplayItem } from '@/types';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';

const TECHNIQUE_GRID_COLUMNS = '1.5fr 0.8fr 0.8fr 1fr 1fr 1fr 40px';

const TECHNIQUE_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'energy', label: 'Energy' },
  { key: 'tp', label: 'TP' },
  { key: 'action', label: 'Action' },
  { key: 'weapon', label: 'Weapon' },
  { key: 'damage', label: 'Damage' },
];

interface LibraryTechniquesTabProps {
  source: SourceFilterValue;
  onDelete: (item: DisplayItem) => void;
}

export function LibraryTechniquesTab({ source, onDelete }: LibraryTechniquesTabProps) {
  if (source !== 'my') {
    return (
      <div className="py-12 text-center text-text-secondary">
        <p className="mb-4">Browse public techniques in the Codex.</p>
        <Button asChild variant="secondary">
          <Link href="/codex">Open Codex → Public Library</Link>
        </Button>
      </div>
    );
  }
  const { data: techniques, isLoading, error } = useUserTechniques();
  const { data: partsDb = [] } = useTechniqueParts();
  const duplicateTechnique = useDuplicateTechnique();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => {
    if (!techniques) return [];

    return techniques.map(tech => {
      const display = deriveTechniqueDisplay(
        {
          name: tech.name,
          description: tech.description,
          parts: tech.parts || [],
          damage: tech.damage?.[0],
          weapon: tech.weapon,
        },
        partsDb
      );

      const damageStr = formatTechniqueDamage(tech.damage?.[0]);

      const parts: ChipData[] = display.partChips.map(chip => ({
        name: chip.text.split(' | TP:')[0].replace(/\s*\(Opt\d+ \d+\)/g, '').trim(),
        description: chip.description,
        cost: chip.finalTP,
        costLabel: 'TP',
      }));

      return {
        id: tech.docId,
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

      <div
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: TECHNIQUE_GRID_COLUMNS }}
      >
        {TECHNIQUE_COLUMNS.map(col => (
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
              totalCost={tech.tp}
              costLabel="TP"
              badges={[{ label: 'Mine', color: 'green' }]}
              onEdit={() => window.open(`/technique-creator?edit=${tech.id}`, '_blank')}
              onDelete={() => onDelete({ id: tech.id, name: tech.name } as DisplayItem)}
              onDuplicate={() => duplicateTechnique.mutate(tech.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
