/**
 * Creature Creator — inventory loadout section (TASK-810, TASK-812)
 * Split from loadout sections so GLR chrome spacing CI scopes ListHeader blocks per file.
 */

'use client';

import { cn } from '@/lib/utils';
import {
  WeaponsListSection,
  ShieldsListSection,
  ArmorListSection,
  EquipmentListSection,
} from '@/components/shared';
import { resolveListRowThumbnail } from '@/lib/list-row-image';
import { CollapsibleSection } from '@/components/creator';
import type { CreatureCreatorEditorProps } from './creature-creator-editor';
import {
  collectCreatureInventoryItems,
  formatCreatureEquipmentQuantity,
  normalizeCreatureInventoryType,
} from '@/lib/game/creature-inventory';
import type { CreatureArmamentRow } from './creature-creator-feat-armament-display';

const CREATURE_INVENTORY_ROW_CHROME = { delete: true } as const;

function inventoryThumbnail(armament: CreatureArmamentRow) {
  return resolveListRowThumbnail('equipment', armament, armament.name);
}

function tpCost(armament: CreatureArmamentRow): number | undefined {
  return typeof armament.tp === 'number' && armament.tp > 0 ? armament.tp : undefined;
}

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
            <span className="font-medium text-text-secondary dark:text-text-primary">
              Currency from inventory
            </span>
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
          items={sortedArmaments
            .filter((row) => normalizeCreatureInventoryType(row.type) === 'weapon')
            .map((armament) => ({
              id: armament.id,
              name: armament.name,
              thumbnail: inventoryThumbnail(armament),
              totalTp: tpCost(armament),
              columns: [
                { key: 'range', value: armament.range, align: 'center' as const },
                { key: 'attack', value: armament.attack, align: 'center' as const },
                { key: 'damage', value: armament.damage, align: 'center' as const },
              ],
              onDelete: () => onRemoveArmament(armament.id),
            }))}
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
          items={sortedArmaments
            .filter((row) => normalizeCreatureInventoryType(row.type) === 'shield')
            .map((armament) => ({
              id: armament.id,
              name: armament.name,
              thumbnail: inventoryThumbnail(armament),
              totalTp: tpCost(armament),
              columns: [
                { key: 'range', value: armament.range, align: 'center' as const },
                { key: 'attack', value: armament.attack, align: 'center' as const },
                { key: 'damage', value: armament.damage, align: 'center' as const },
                { key: 'block', value: armament.block, align: 'center' as const },
              ],
              onDelete: () => onRemoveArmament(armament.id),
            }))}
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
          items={sortedArmaments
            .filter((row) => normalizeCreatureInventoryType(row.type) === 'armor')
            .map((armament) => ({
              id: armament.id,
              name: armament.name,
              thumbnail: inventoryThumbnail(armament),
              totalTp: tpCost(armament),
              columns: [
                { key: 'dr', value: armament.damageReduction, align: 'center' as const },
                { key: 'crit', value: armament.criticalRangeIncrease, align: 'center' as const },
              ],
              onDelete: () => onRemoveArmament(armament.id),
            }))}
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
          items={sortedArmaments
            .filter((row) => normalizeCreatureInventoryType(row.type) === 'equipment')
            .map((armament) => ({
              id: armament.id,
              name: armament.name,
              thumbnail: inventoryThumbnail(armament),
              totalTp: tpCost(armament),
              columns: [
                { key: 'type', value: armament.type, align: 'center' as const },
                {
                  key: 'quantity',
                  value: formatCreatureEquipmentQuantity(armament.quantity),
                  align: 'center' as const,
                },
              ],
              onDelete: () => onRemoveArmament(armament.id),
            }))}
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
