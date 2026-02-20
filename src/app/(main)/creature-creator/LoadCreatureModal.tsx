/**
 * Creature Creator - Load Creature Modal
 * Uses ListHeader + GridListRow + SearchInput to match LoadFromLibraryModal and Codex/Library.
 */

'use client';

import { X } from 'lucide-react';
import { useUserCreatures } from '@/hooks';
import { IconButton, Modal, SearchInput, LoadingState, EmptyState } from '@/components/ui';
import { GridListRow, ListHeader } from '@/components/shared';
import { useModalListState } from '@/hooks/use-modal-list-state';
import type { CreatureState } from './creature-creator-types';
import { initialState } from './creature-creator-constants';

export function LoadCreatureModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (creature: CreatureState) => void;
}) {
  const { data: userCreatures = [], isLoading } = useUserCreatures();
  const {
    search,
    setSearch,
    sortedItems: sorted,
    sortState,
    handleSort,
  } = useModalListState({
    items: userCreatures,
    searchFields: ['name', 'description', 'type'],
    initialSortKey: 'name',
    getSearchableString: (c) => [c.name, c.description, c.type, c.level].filter(Boolean).join(' '),
  });

  const handleSelect = (c: (typeof userCreatures)[0]) => {
    const loadedCreature: CreatureState = {
      name: c.name || '',
      level: c.level || 1,
      type: (c as unknown as CreatureState).type || 'Humanoid',
      size: (c as unknown as CreatureState).size || 'medium',
      description: c.description || '',
      archetypeType: (c as unknown as CreatureState).archetypeType || 'power',
      abilities: (c as unknown as CreatureState).abilities || initialState.abilities,
      defenses: (c as unknown as CreatureState).defenses || initialState.defenses,
      hitPoints: (c as unknown as CreatureState).hitPoints || 0,
      energyPoints: (c as unknown as CreatureState).energyPoints || 0,
      powerProficiency: (c as unknown as CreatureState).powerProficiency || 0,
      martialProficiency: (c as unknown as CreatureState).martialProficiency || 0,
      enablePowers: (c as unknown as CreatureState).enablePowers ?? Boolean((c as unknown as CreatureState).powers?.length),
      enableTechniques: (c as unknown as CreatureState).enableTechniques ?? Boolean((c as unknown as CreatureState).techniques?.length),
      enableArmaments: (c as unknown as CreatureState).enableArmaments ?? Boolean((c as unknown as CreatureState).armaments?.length),
      resistances: (c as unknown as CreatureState).resistances || [],
      weaknesses: (c as unknown as CreatureState).weaknesses || [],
      immunities: (c as unknown as CreatureState).immunities || [],
      conditionImmunities: (c as unknown as CreatureState).conditionImmunities || [],
      senses: (c as unknown as CreatureState).senses || [],
      movementTypes: (c as unknown as CreatureState).movementTypes || [],
      languages: (c as unknown as CreatureState).languages || [],
      skills: (c as unknown as CreatureState).skills || [],
      powers: (c as unknown as CreatureState).powers || [],
      techniques: (c as unknown as CreatureState).techniques || [],
      feats: (c as unknown as CreatureState).feats || [],
      armaments: (c as unknown as CreatureState).armaments || [],
    };
    onSelect(loadedCreature);
    onClose();
  };

  const modalHeader = (
    <div className="px-4 py-3 border-b border-border-light flex justify-between items-center bg-surface-alt">
      <h2 className="text-xl font-bold text-text-primary">Load Creature from Library</h2>
      <IconButton variant="ghost" onClick={onClose} label="Close">
        <X className="w-5 h-5" />
      </IconButton>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      header={modalHeader}
      showCloseButton={false}
      flexLayout
      contentClassName=""
      className="max-h-[80vh]"
    >
      <div className="px-4 py-3 border-b border-border-light bg-surface-alt">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search creatures by name, type, or level..."
          size="sm"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <LoadingState message="Loading creatures..." size="md" padding="md" />
        ) : sorted.length === 0 ? (
          <EmptyState
            title={userCreatures.length === 0 ? 'No creatures in your library' : 'No matching creatures'}
            description={userCreatures.length === 0 ? 'Create a creature to load it here.' : undefined}
            size="sm"
          />
        ) : (
          <>
            <ListHeader
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'level', label: 'Level' },
                { key: 'type', label: 'Type' },
              ]}
              gridColumns="1.5fr 0.5fr 1fr"
              sortState={sortState}
              onSort={handleSort}
              className="mx-0 mb-2"
            />
            <div className="space-y-2">
              {sorted.map((c) => (
                <GridListRow
                  key={c.docId}
                  id={c.docId}
                  name={c.name ?? 'Unnamed'}
                  description={c.description}
                  columns={[
                    { key: 'name', value: c.name ?? '—', align: 'left' },
                    { key: 'level', value: String(c.level ?? '—'), align: 'center' as const },
                    { key: 'type', value: (c as unknown as CreatureState).type ?? 'Creature', align: 'center' as const },
                  ]}
                  gridColumns="1.5fr 0.5fr 1fr"
                  compact
                  selectable
                  isSelected={false}
                  onSelect={() => handleSelect(c)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
