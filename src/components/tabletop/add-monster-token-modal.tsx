'use client';

import { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui';
import { SourceFilter, UnifiedSelectionModal, ValueStepper, type SelectableItem, type SourceFilterValue } from '@/components/shared';
import { calculateCreatureMaxEnergy, calculateCreatureMaxHealth } from '@/lib/game/encounter-utils';
import type { LibraryCreature } from '@/types/library';
import type { AddVttCreatureTokensRequest, VttCreatureTokenSource } from '@/types/tabletop';
import { useOfficialLibrary, useUserCreatures } from '@/hooks';

interface AddMonsterTokenModalProps {
  isOpen: boolean;
  isAdding?: boolean;
  onClose: () => void;
  onAdd: (request: AddVttCreatureTokensRequest) => void;
}

interface CreatureSelectionData {
  source: VttCreatureTokenSource;
  creatureId: string;
}

function levelLabel(level: number | undefined): string {
  const value = Number(level || 1);
  return Number.isFinite(value) ? String(value) : '1';
}

function creatureTypeLabel(creature: LibraryCreature): string {
  return [creature.type, creature.size].filter(Boolean).join(' / ') || 'Creature';
}

function creatureResources(creature: LibraryCreature): string {
  const level = Number(creature.level || 1);
  const safeLevel = Number.isFinite(level) ? level : 1;
  const abilities = creature.abilities || {};
  const hp = calculateCreatureMaxHealth(safeLevel, abilities, creature.hitPoints ?? creature.hp ?? 0);
  const en = calculateCreatureMaxEnergy(safeLevel, abilities, creature.energyPoints ?? 0);
  return `HP ${hp} / EN ${en}`;
}

function toSelectableCreature(creature: LibraryCreature, source: VttCreatureTokenSource): SelectableItem {
  const sourceLabel = source === 'official' ? 'Realms Library' : 'My Library';
  return {
    id: `${source}:${creature.id}`,
    name: creature.name,
    description: creature.description,
    columns: [
      { key: 'level', value: levelLabel(creature.level), align: 'center', highlight: true },
      { key: 'type', value: creatureTypeLabel(creature), align: 'center' },
      { key: 'resources', value: creatureResources(creature), align: 'center', hideOnMobile: true },
    ],
    badges: [{ label: sourceLabel, color: source === 'official' ? 'blue' : 'green' }],
    data: {
      source,
      creatureId: String(creature.id),
    } satisfies CreatureSelectionData,
  };
}

function readSelectionData(item: SelectableItem | undefined): CreatureSelectionData | null {
  const data = item?.data as CreatureSelectionData | undefined;
  return data?.source && data.creatureId ? data : null;
}

export function AddMonsterTokenModal({ isOpen, isAdding = false, onClose, onAdd }: AddMonsterTokenModalProps) {
  const [source, setSource] = useState<SourceFilterValue>('all');
  const [quantity, setQuantity] = useState(1);
  const [visible, setVisible] = useState(false);
  const { data: officialCreatures = [], isLoading: officialLoading } = useOfficialLibrary('creatures', { enabled: isOpen });
  const { data: userCreatures = [], isLoading: userLoading } = useUserCreatures({ enabled: isOpen });

  const reset = () => {
    setSource('all');
    setQuantity(1);
    setVisible(false);
  };

  const closeAndReset = () => {
    reset();
    onClose();
  };

  const items = useMemo(
    () => [
      ...officialCreatures.map((creature) => toSelectableCreature(creature, 'official')),
      ...userCreatures.map((creature) => toSelectableCreature(creature, 'user')),
    ],
    [officialCreatures, userCreatures]
  );

  const isLoading =
    source === 'public'
      ? officialLoading
      : source === 'my'
        ? userLoading
        : officialLoading || userLoading;

  const handleConfirm = (selected: SelectableItem[]) => {
    const data = readSelectionData(selected[0]);
    if (!data) return;
    onAdd({
      source: data.source,
      creatureId: data.creatureId,
      quantity,
      visible,
    });
  };

  return (
    <UnifiedSelectionModal
      isOpen={isOpen}
      onClose={closeAndReset}
      title="Add Monster Token"
      description="Choose a creature to place on the tabletop."
      headerExtra={<SourceFilter value={source} onChange={setSource} />}
      displayFilter={(item) => {
        const data = readSelectionData(item);
        if (!data || source === 'all') return true;
        return source === 'public' ? data.source === 'official' : data.source === 'user';
      }}
      items={items}
      isLoading={isLoading}
      onConfirm={handleConfirm}
      maxSelections={1}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'level', label: 'Level', align: 'center' },
        { key: 'type', label: 'Type / Size', align: 'center' },
        { key: 'resources', label: 'Resources', align: 'center' },
      ]}
      gridColumns="minmax(0,1.4fr) 0.55fr 0.9fr 0.9fr"
      itemLabel="monster"
      emptyMessage="No monsters found"
      emptySubMessage="Create a creature or add one from the Realms Library first."
      searchPlaceholder="Search monsters by name or description..."
      searchFields={['name', 'description']}
      footerExtra={(selected) =>
        selected.length > 0 ? (
          <div className="flex flex-col gap-3 rounded-lg border border-border-light bg-surface-alt p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-text-primary">Quantity</span>
              <ValueStepper value={quantity} onChange={setQuantity} min={1} max={26} size="sm" />
            </div>
            <Checkbox
              checked={visible}
              onChange={(event) => setVisible(event.target.checked)}
              label="Visible to players"
            />
          </div>
        ) : null
      }
      confirmDisabled={() => isAdding}
      size="xl"
      className="max-h-[75vh]"
    />
  );
}

export default AddMonsterTokenModal;
