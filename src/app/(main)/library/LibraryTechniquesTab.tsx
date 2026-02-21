/**
 * Library Techniques Tab
 * ======================
 * User's and/or public techniques with search and sort. Source filter: All / Public / My.
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
import { useUserTechniques, useTechniqueParts, useDuplicateTechnique, usePublicLibrary, useAddPublicToLibrary } from '@/hooks';
import { Button, useToast } from '@/components/ui';
import type { DisplayItem } from '@/types';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';

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
  source: SourceFilterValue;
  onDelete: (item: DisplayItem) => void;
}

export function LibraryTechniquesTab({ source, onDelete }: LibraryTechniquesTabProps) {
  const { showToast } = useToast();
  const { data: techniques = [], isLoading: loadingUser, error } = useUserTechniques();
  const { data: publicItems = [], isLoading: loadingPublic } = usePublicLibrary('techniques');
  const { data: partsDb = [] } = useTechniqueParts();
  const duplicateTechnique = useDuplicateTechnique();
  const addPublic = useAddPublicToLibrary('techniques');
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => {
    const rows: Array<{
      id: string;
      name: string;
      description: string;
      energy: string | number;
      tp: number | string;
      action: string;
      weapon: string;
      damage: string;
      parts: ChipData[];
      itemSource: 'my' | 'public';
      raw: Record<string, unknown>;
    }> = [];

    const toRow = (t: { docId?: string; id?: string; name?: string; description?: string; parts?: unknown[]; damage?: unknown; weapon?: string }, itemSource: 'my' | 'public', raw: Record<string, unknown>) => {
      const doc: TechniqueDocument = {
        name: String(t.name ?? ''),
        description: String(t.description ?? ''),
        parts: Array.isArray(t.parts) ? (t.parts as TechniqueDocument['parts']) : [],
        damage: Array.isArray(t.damage) ? (t.damage[0] as TechniqueDocument['damage']) : (t.damage as TechniqueDocument['damage']),
        weapon: t.weapon as TechniqueDocument['weapon'],
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
        id: String(t.docId ?? t.id ?? ''),
        name: display.name,
        description: display.description,
        energy: display.energy,
        tp: display.tp,
        action: display.actionType,
        weapon: display.weaponName || '-',
        damage: damageStr,
        parts,
        itemSource,
        raw,
      };
    };

    if (source === 'my' || source === 'all') {
      techniques.forEach(tech => rows.push(toRow(tech as Parameters<typeof toRow>[0], 'my', tech as unknown as Record<string, unknown>)));
    }
    if (source === 'public' || source === 'all') {
      publicItems.forEach((t: Record<string, unknown>) => {
        rows.push(toRow(t as Parameters<typeof toRow>[0], 'public', t));
      });
    }
    return rows;
  }, [techniques, publicItems, partsDb, source]);

  const isLoading = ((source === 'my' || source === 'all') && loadingUser) || ((source === 'public' || source === 'all') && loadingPublic);

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
    const isPublicOnly = source === 'public';
    return (
      <ListEmptyState
        icon={<Swords className="w-8 h-8" />}
        title={isPublicOnly ? 'No public techniques' : 'No techniques yet'}
        message={isPublicOnly ? 'Public techniques will appear here when admins add them.' : 'Create your first technique to see it here in your library.'}
        action={!isPublicOnly ? (
          <Button asChild>
            <Link href="/technique-creator">
              <Plus className="w-4 h-4" />
              Create Technique
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
              key={`${tech.itemSource}-${tech.id}`}
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
              badges={tech.itemSource === 'public' ? [{ label: 'Public', color: 'blue' }] : undefined}
              onEdit={tech.itemSource === 'my' ? () => window.open(`/technique-creator?edit=${tech.id}`, '_blank') : undefined}
              onDelete={tech.itemSource === 'my' ? () => onDelete({ id: tech.id, name: tech.name } as DisplayItem) : undefined}
              onDuplicate={tech.itemSource === 'my' ? () => duplicateTechnique.mutate(tech.id, { onError: (e) => showToast(e?.message ?? 'Failed to duplicate', 'error') }) : undefined}
              onAddToLibrary={tech.itemSource === 'public' ? () => addPublic.mutate(tech.raw, { onError: (e) => showToast(e?.message ?? 'Failed to add to library', 'error') }) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
