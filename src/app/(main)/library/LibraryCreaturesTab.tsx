/**
 * Library Creatures Tab
 * =====================
 * User's creatures with search and sort. Full CreatureStatBlock display.
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
import { RollLog, RollProvider } from '@/components/character-sheet';
import { useSort } from '@/hooks/use-sort';
import { useUserCreatures, useDuplicateCreature } from '@/hooks';
import { Button, useToast } from '@/components/ui';
import type { DisplayItem } from '@/types';
import { calculateCreatureMaxHealth, calculateCreatureMaxEnergy } from '@/lib/game/encounter-utils';

const CREATURE_GRID_COLUMNS = '1.8fr 0.6fr 0.8fr 1fr 1fr 0.6fr 0.6fr';
const CREATURE_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'level', label: 'LEVEL', align: 'center' as const },
  { key: 'size', label: 'SIZE', align: 'center' as const },
  { key: 'type', label: 'TYPE', align: 'center' as const },
  { key: 'archetype', label: 'ARCHETYPE', align: 'center' as const },
  { key: 'hp', label: 'HP', align: 'center' as const },
  { key: 'en', label: 'EN', align: 'center' as const },
];

interface LibraryCreaturesTabProps {
  onDelete: (item: DisplayItem) => void;
}

export function LibraryCreaturesTab({ onDelete }: LibraryCreaturesTabProps) {
  const { showToast } = useToast();
  const { data: creatures = [], isLoading, error } = useUserCreatures();
  const duplicateCreature = useDuplicateCreature();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

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
    return sortItems(
      filtered.map(c => {
        const power = c.powerProficiency ?? 0;
        const martial = c.martialProficiency ?? 0;
        const archetype = power > 0 && martial > 0 ? 'Powered-Martial' : power > 0 ? 'Power' : martial > 0 ? 'Martial' : 'None';
        const level = c.level ?? 1;
        const abil = c.abilities || {};
        const hpAlloc = c.hitPoints ?? c.hp ?? 0;
        const enAlloc = c.energyPoints ?? 0;
        return {
          ...c,
          name: c.name || '',
          level: c.level ?? 0,
          size: c.size ?? '',
          type: c.type ?? '',
          hp: calculateCreatureMaxHealth(level, abil, hpAlloc),
          en: calculateCreatureMaxEnergy(level, abil, enAlloc),
          archetype,
        };
      })
    );
  }, [creatures, search, sortItems]);

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
    <RollProvider canRoll>
      <div>
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search creatures..." />
        </div>
        <ListHeader
          columns={CREATURE_HEADER_COLUMNS}
          gridColumns={CREATURE_GRID_COLUMNS}
          sortState={sortState}
          onSort={handleSort}
        />
        {isLoading ? (
          <LoadingState />
        ) : myOnlyCreatures.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">No creatures match your search.</div>
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
        <RollLog />
      </div>
    </RollProvider>
  );
}
