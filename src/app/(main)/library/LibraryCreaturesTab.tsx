/**
 * Library Creatures Tab
 * =====================
 * User's and/or public creatures. Source filter: All / Public / My.
 * When My only: full CreatureStatBlock. When Public/All: GridListRow list with Add to library.
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import {
  CreatureStatBlock,
  GridListRow,
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay,
  ListEmptyState,
} from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import { useUserCreatures, useDuplicateCreature, usePublicLibrary, useAddPublicToLibrary } from '@/hooks';
import { Button, useToast } from '@/components/ui';
import type { DisplayItem } from '@/types';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';

const CREATURE_GRID = '1.5fr 0.8fr 1fr 40px';

interface LibraryCreaturesTabProps {
  source: SourceFilterValue;
  onDelete: (item: DisplayItem) => void;
}

export function LibraryCreaturesTab({ source, onDelete }: LibraryCreaturesTabProps) {
  const { showToast } = useToast();
  const { data: creatures = [], isLoading: loadingUser, error } = useUserCreatures();
  const { data: publicItems = [], isLoading: loadingPublic } = usePublicLibrary('creatures');
  const duplicateCreature = useDuplicateCreature();
  const addPublic = useAddPublicToLibrary('creatures');
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const mergedCardData = useMemo(() => {
    const rows: Array<{ id: string; name: string; description: string; level: number; type: string; itemSource: 'my' | 'public'; raw: Record<string, unknown> }> = [];
    if (source === 'my' || source === 'all') {
      creatures.forEach(c => {
        rows.push({
          id: c.docId,
          name: c.name || '',
          description: c.description || '',
          level: c.level ?? 0,
          type: c.type || '',
          itemSource: 'my',
          raw: c as unknown as Record<string, unknown>,
        });
      });
    }
    if (source === 'public' || source === 'all') {
      publicItems.forEach((c: Record<string, unknown>) => {
        rows.push({
          id: String(c.id ?? c.docId ?? ''),
          name: String(c.name ?? ''),
          description: String(c.description ?? ''),
          level: Number(c.level ?? 0),
          type: String(c.type ?? ''),
          itemSource: 'public',
          raw: c,
        });
      });
    }
    return rows;
  }, [creatures, publicItems, source]);

  const isLoading = ((source === 'my' || source === 'all') && loadingUser) || ((source === 'public' || source === 'all') && loadingPublic);

  const filteredMerged = useMemo(() => {
    let r = mergedCardData;
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(x =>
        String(x.name ?? '').toLowerCase().includes(s) ||
        String(x.type ?? '').toLowerCase().includes(s) ||
        String(x.description ?? '').toLowerCase().includes(s)
      );
    }
    return sortItems(r);
  }, [mergedCardData, search, sortItems]);

  const myOnlyCreatures = useMemo(() => {
    if (!creatures.length) return [];
    let filtered = creatures.filter(c => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        c.name?.toLowerCase().includes(searchLower) ||
        c.type?.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower)
      );
    });
    return sortItems(filtered.map(c => ({ ...c, name: c.name || '', level: c.level ?? 0 })));
  }, [creatures, search, sortItems]);

  if (error) {
    return <ErrorDisplay message="Failed to load creatures" subMessage="Please try again later" />;
  }

  if (source === 'my') {
    if (!loadingUser && (!creatures || creatures.length === 0)) {
      return (
        <ListEmptyState
          icon={<Users className="w-8 h-8" />}
          title="No creatures yet"
          message="Create your first creature to see it here in your library."
          action={
            <Button asChild>
              <Link href="/creature-creator">
                <Plus className="w-4 h-4" />
                Create Creature
              </Link>
            </Button>
          }
        />
      );
    }

    return (
      <div>
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search creatures..." />
        </div>
        <ListHeader
          columns={[
            { key: 'name', label: 'Name', width: '2fr' },
            { key: 'level', label: 'Level', width: '1fr' },
          ]}
          sortState={sortState}
          onSort={handleSort}
          className="grid-cols-2"
        />
        {loadingUser ? (
          <LoadingState />
        ) : myOnlyCreatures.length === 0 ? (
          <div className="py-12 text-center text-text-muted">No creatures match your search.</div>
        ) : (
          <div className="space-y-3">
            {myOnlyCreatures.map(creature => (
              <CreatureStatBlock
                key={creature.docId}
                creature={{
                  id: creature.docId,
                  name: creature.name,
                  description: creature.description,
                  level: creature.level,
                  type: creature.type,
                  size: creature.size,
                  hp: creature.hp,
                  hitPoints: creature.hitPoints,
                  energyPoints: creature.energyPoints,
                  abilities: creature.abilities,
                  defenses: creature.defenses,
                  powerProficiency: creature.powerProficiency,
                  martialProficiency: creature.martialProficiency,
                  resistances: creature.resistances,
                  weaknesses: creature.weaknesses,
                  immunities: creature.immunities,
                  conditionImmunities: creature.conditionImmunities,
                  senses: creature.senses,
                  movementTypes: creature.movementTypes,
                  languages: creature.languages,
                  skills: creature.skills,
                  powers: creature.powers,
                  techniques: creature.techniques,
                  feats: creature.feats,
                  armaments: creature.armaments,
                }}
                onEdit={() => window.open(`/creature-creator?edit=${creature.docId}`, '_blank')}
                onDelete={() => onDelete({ id: creature.docId, name: creature.name } as DisplayItem)}
                onDuplicate={() => duplicateCreature.mutate(creature.docId, { onError: (e) => showToast(e?.message ?? 'Failed to duplicate', 'error') })}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!isLoading && mergedCardData.length === 0) {
    const isPublicOnly = source === 'public';
    return (
      <ListEmptyState
        icon={<Users className="w-8 h-8" />}
        title={isPublicOnly ? 'No public creatures' : 'No creatures'}
        message={isPublicOnly ? 'Public creatures will appear here when admins add them.' : 'Add creatures to your library or create your own.'}
      />
    );
  }

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search creatures..." />
      </div>
      <ListHeader
        columns={[
          { key: 'name', label: 'NAME' },
          { key: 'level', label: 'LEVEL', sortable: false as const },
          { key: 'type', label: 'TYPE', sortable: false as const },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns={CREATURE_GRID}
        sortState={sortState}
        onSort={handleSort}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredMerged.length === 0 ? (
          <div className="py-12 text-center text-text-muted">No creatures match your search.</div>
        ) : (
          filteredMerged.map(c => (
            <GridListRow
              key={`${c.itemSource}-${c.id}`}
              id={c.id}
              name={c.name}
              description={c.description}
              gridColumns={CREATURE_GRID}
              columns={[
                { key: 'Level', value: c.level, highlight: true },
                { key: 'Type', value: c.type },
              ]}
              badges={c.itemSource === 'public' ? [{ label: 'Public', color: 'blue' }] : undefined}
              onEdit={c.itemSource === 'my' ? () => window.open(`/creature-creator?edit=${c.id}`, '_blank') : undefined}
              onDelete={c.itemSource === 'my' ? () => onDelete({ id: c.id, name: c.name } as DisplayItem) : undefined}
              onDuplicate={c.itemSource === 'my' ? () => duplicateCreature.mutate(c.id, { onError: (e) => showToast(e?.message ?? 'Failed to duplicate', 'error') }) : undefined}
              onAddToLibrary={c.itemSource === 'public' ? () => addPublic.mutate(c.raw, { onError: (e) => showToast(e?.message ?? 'Failed to add to library', 'error') }) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
