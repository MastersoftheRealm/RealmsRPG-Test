/**
 * Library Creatures Tab
 * =====================
 * User's creatures list with search and sort.
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import {
  CreatureStatBlock,
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay,
  ListEmptyState,
} from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import { useUserCreatures, useDuplicateCreature } from '@/hooks';
import { Button, useToast } from '@/components/ui';
import type { DisplayItem } from '@/types';

import type { SourceFilterValue } from '@/components/shared/filters/source-filter';

interface LibraryCreaturesTabProps {
  source: SourceFilterValue;
  onDelete: (item: DisplayItem) => void;
}

export function LibraryCreaturesTab({ source, onDelete }: LibraryCreaturesTabProps) {
  const { showToast } = useToast();
  const { data: creatures, isLoading, error } = useUserCreatures();
  const duplicateCreature = useDuplicateCreature();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const filteredCreatures = useMemo(() => {
    if (!creatures) return [];

    const filtered = creatures.filter(creature => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        creature.name?.toLowerCase().includes(searchLower) ||
        creature.type?.toLowerCase().includes(searchLower) ||
        creature.description?.toLowerCase().includes(searchLower)
      );
    });
    return sortItems(filtered.map(c => ({ ...c, name: c.name || '', level: c.level ?? 0 })));
  }, [creatures, search, sortItems]);

  if (source !== 'my') {
    return (
      <div className="py-12 text-center text-text-secondary">
        <p className="mb-4">Browse public creatures in the Codex.</p>
        <Button asChild variant="secondary">
          <Link href="/codex">Open Codex → Public Library</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message="Failed to load creatures" subMessage="Please try again later" />;
  }

  if (!isLoading && (!creatures || creatures.length === 0)) {
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
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search creatures..."
        />
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

      {isLoading ? (
        <LoadingState />
      ) : filteredCreatures.length === 0 ? (
        <div className="py-12 text-center text-text-muted">No creatures match your search.</div>
      ) : (
        <div className="space-y-3">
          {filteredCreatures.map(creature => (
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
