/**
 * Creature Creator — inventory loadout section (TASK-810, TASK-812, TASK-817)
 * Split from loadout sections so GLR chrome spacing CI scopes ListHeader blocks per file.
 */

'use client';

import { cn } from '@/lib/utils';
import {
  WeaponsListSection,
  ShieldsListSection,
  ArmorListSection,
  EquipmentListSection,
} from '@/components/patterns';
import { CollapsibleSection } from '@/components/creator';
import type { CreatureCreatorEditorProps } from './creature-creator-editor';
import { collectCreatureInventoryItems } from '@/lib/game/creature-inventory';
import { mapCreatureSelectedInventoryRows } from './map-creature-inventory-rows';

const CREATURE_INVENTORY_ROW_CHROME = { delete: true } as const;

type InventorySectionProps = Pick<
  CreatureCreatorEditorProps,
  | 'creature'
  | 'stats'
  | 'armamentsSummary'
  | 'armamentSort'
  | 'onArmamentSort'
  | 'sortedArmaments'
  | 'updateCreature'
  | 'onRemoveArmament'
  | 'onOpenArmamentModal'
>;

export function CreatureCreatorEditorInventorySection({
  creature,
  stats,
  armamentsSummary,
  armamentSort,
  onArmamentSort,
  sortedArmaments,
  updateCreature,
  onRemoveArmament,
  onOpenArmamentModal,
}: InventorySectionProps) {
  const selected = mapCreatureSelectedInventoryRows({
    sortedArmaments,
    creature,
    onRemoveArmament,
  });

  return (
    <CollapsibleSection
      title="Inventory"
      subtitle="Weapons, armor, shields, and equipment"
      collapsedSummary={armamentsSummary}
      icon="🛡️"
      optional
      enabled={creature.enableArmaments}
      onEnabledChange={(enabled) => updateCreature({ enableArmaments: enabled })}
      itemCount={collectCreatureInventoryItems(creature).length}
    >
      <div className="mb-4 flex flex-col gap-3">
        <div className="rounded-lg border border-border-light bg-surface-alt p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-text-secondary">Currency from inventory</span>
            <span
              className={cn(
                'font-semibold',
                stats.currencyRemaining < 0 ? 'text-danger-fg' : 'text-text-primary',
              )}
            >
              {stats.currencyRemaining}c / {stats.currency}c
            </span>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            Spent {stats.currencySpent}c from selected inventory items.
          </p>
        </div>
        <WeaponsListSection
          layout="characterSheet"
          title="Weapons"
          headingLevel={3}
          items={selected.weapons}
          onAdd={() => onOpenArmamentModal('weapon')}
          addLabel="Add weapon"
          sortState={armamentSort}
          onSort={onArmamentSort}
          rowChrome={CREATURE_INVENTORY_ROW_CHROME}
          emptyMessage="No weapons"
        />
        <ShieldsListSection
          layout="characterSheet"
          title="Shields"
          headingLevel={3}
          items={selected.shields}
          onAdd={() => onOpenArmamentModal('shield')}
          addLabel="Add shield"
          sortState={armamentSort}
          onSort={onArmamentSort}
          rowChrome={CREATURE_INVENTORY_ROW_CHROME}
          emptyMessage="No shields"
        />
        <ArmorListSection
          layout="characterSheet"
          title="Armor"
          headingLevel={3}
          items={selected.armor}
          onAdd={() => onOpenArmamentModal('armor')}
          addLabel="Add armor"
          sortState={armamentSort}
          onSort={onArmamentSort}
          rowChrome={CREATURE_INVENTORY_ROW_CHROME}
          emptyMessage="No armor"
        />
        <EquipmentListSection
          layout="characterSheet"
          title="Equipment"
          headingLevel={3}
          items={selected.equipment}
          onAdd={() => onOpenArmamentModal('equipment')}
          addLabel="Add equipment"
          sortState={armamentSort}
          onSort={onArmamentSort}
          rowChrome={CREATURE_INVENTORY_ROW_CHROME}
          emptyMessage="No equipment"
        />
      </div>
    </CollapsibleSection>
  );
}
