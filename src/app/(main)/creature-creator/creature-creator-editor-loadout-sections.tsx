/**
 * Creature Creator — feats, powers, techniques, inventory sections (TASK-610)
 */

'use client';

import { cn, formatListCellLabel } from '@/lib/utils';
import {
  GridListRow,
  ListHeader,
  InnateToggle,
  ValueStepper,
} from '@/components/shared';
import { resolveListRowThumbnail } from '@/lib/list-row-image';
import { Button, IconButton } from '@/components/ui';
import { X } from 'lucide-react';
import { CollapsibleSection } from '@/components/creator';
import { buildFeatLevelChips } from '@/lib/leveled-feats';
import type { CreatureCreatorEditorProps } from './creature-creator-editor';

const CREATURE_FEAT_LIST_GRID = '1.15fr 0.58fr 0.52fr 0.4fr';
const CREATURE_REMOVE_ROW_CHROME = { rightSlot: true } as const;
const CREATURE_POWER_ROW_CHROME = { leftSlot: true, rightSlot: true } as const;
const CREATURE_ARMAMENT_LIST_GRID =
  'minmax(180px, 0.9fr) minmax(72px, 0.55fr) minmax(88px, 7rem) minmax(60px, 4rem) minmax(110px, 8rem) minmax(56px, 0.45fr) minmax(64px, 0.55fr)';

type LoadoutSectionsProps = Pick<
  CreatureCreatorEditorProps,
  | 'creature'
  | 'stats'
  | 'featsSummary'
  | 'powersSummary'
  | 'techniquesSummary'
  | 'armamentsSummary'
  | 'featSort'
  | 'onFeatSort'
  | 'sortedFeats'
  | 'armamentSort'
  | 'onArmamentSort'
  | 'sortedArmaments'
  | 'updateCreature'
  | 'onCreatureFeatLevelChange'
  | 'onRemoveFeat'
  | 'onTogglePowerInnate'
  | 'onRemovePower'
  | 'onRemoveTechnique'
  | 'onRemoveArmament'
  | 'onOpenFeatModal'
  | 'onOpenPowerModal'
  | 'onOpenTechniqueModal'
  | 'onOpenArmamentModal'
>;

export function CreatureCreatorEditorLoadoutSections({
  creature,
  stats,
  featsSummary,
  powersSummary,
  techniquesSummary,
  armamentsSummary,
  featSort,
  onFeatSort,
  sortedFeats,
  armamentSort,
  onArmamentSort,
  sortedArmaments,
  updateCreature,
  onCreatureFeatLevelChange,
  onRemoveFeat,
  onTogglePowerInnate,
  onRemovePower,
  onRemoveTechnique,
  onRemoveArmament,
  onOpenFeatModal,
  onOpenPowerModal,
  onOpenTechniqueModal,
  onOpenArmamentModal,
}: LoadoutSectionsProps) {
  return (
    <>
      <CollapsibleSection
        title="Feats"
        subtitle="Special abilities and traits"
        collapsedSummary={featsSummary}
        icon="⭐"
        itemCount={creature.feats.length}
        points={{ spent: stats.featSpent, total: stats.featPoints }}
        defaultExpanded={true}
      >
        {creature.feats.length === 0 ? (
          <p className="text-sm text-text-muted dark:text-text-secondary italic mb-4">No feats added</p>
        ) : (
          <div className="border border-border-light rounded-lg overflow-hidden mb-4">
            <ListHeader
              columns={[
                { key: 'name', label: 'NAME' },
                { key: 'typeLabel', label: 'TYPE', width: '0.58fr', align: 'center' },
                { key: 'level', label: 'LVL', width: '0.52fr', align: 'center' },
                { key: 'points', label: 'PTS', width: '0.4fr', align: 'center' },
              ]}
              gridColumns={CREATURE_FEAT_LIST_GRID}
              sortState={featSort}
              onSort={onFeatSort}
              rowChrome={CREATURE_REMOVE_ROW_CHROME}
            />
            <div className="flex flex-col gap-1">
              {sortedFeats.map((feat) => {
                const levelChips =
                  feat.levelMeta && feat.levelMeta.family.length > 1
                    ? buildFeatLevelChips(feat.levelMeta.family, feat.id)
                    : [];
                return (
                  <GridListRow
                    key={feat.id}
                    id={feat.id}
                    name={feat.name}
                    description={feat.description}
                    gridColumns={CREATURE_FEAT_LIST_GRID}
                    detailSections={
                      levelChips.length > 0
                        ? [{ label: 'Other feat levels', chips: levelChips }]
                        : undefined
                    }
                    columns={[
                      {
                        key: 'typeLabel',
                        value: formatListCellLabel(feat.typeLabel),
                        align: 'center',
                      },
                      {
                        key: 'level',
                        value: feat.levelMeta ? (
                          <ValueStepper
                            value={feat.levelMeta.currentLevel}
                            onChange={(level) => onCreatureFeatLevelChange(feat.id, level)}
                            min={feat.levelMeta.minLevel}
                            max={feat.levelMeta.maxQualified}
                            size="sm"
                            variant="inline"
                            decrementTitle={`Decrease ${feat.name} level`}
                            incrementTitle={`Increase ${feat.name} level`}
                          />
                        ) : (
                          '-'
                        ),
                        align: 'center',
                      },
                      {
                        key: 'points',
                        value: feat.points != null ? feat.points : '-',
                        align: 'center',
                      },
                    ]}
                    rightSlot={
                      <IconButton
                        variant="danger"
                        size="sm"
                        onClick={() => onRemoveFeat(feat.id)}
                        label="Remove feat"
                      >
                        <X className="w-4 h-4" />
                      </IconButton>
                    }
                    compact
                  />
                );
              })}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onOpenFeatModal()}>Add feat</Button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Powers"
        subtitle="Supernatural abilities and magical effects"
        collapsedSummary={powersSummary}
        icon="✨"
        optional
        enabled={creature.enablePowers}
        onEnabledChange={(enabled) => updateCreature({ enablePowers: enabled })}
        itemCount={creature.powers.length}
        defaultExpanded={true}
      >
        {creature.powers.length === 0 ? (
          <p className="text-sm text-text-muted dark:text-text-secondary italic mb-4">No powers added</p>
        ) : (
          <div className="border border-border-light rounded-lg overflow-hidden mb-4">
            <ListHeader
              columns={[
                { key: 'name', label: 'NAME', width: '1.4fr' },
                { key: 'Energy', label: 'ENERGY', width: '0.6fr', align: 'center' },
                { key: 'Action', label: 'ACTION', width: '0.8fr', align: 'center' },
                { key: 'Damage', label: 'DAMAGE', width: '0.8fr', align: 'center' },
                { key: 'Area', label: 'AREA', width: '0.7fr', align: 'center' },
                { key: 'Duration', label: 'DURATION', width: '0.8fr', align: 'center' },
              ]}
              gridColumns="1.4fr 0.6fr 0.8fr 0.8fr 0.7fr 0.8fr"
              hasThumbnailColumn
              rowChrome={CREATURE_POWER_ROW_CHROME}
            />
            <div className="flex flex-col gap-1">
              {creature.powers.map(
                (power: {
                  id: string;
                  name: string;
                  energy?: number;
                  action?: string;
                  damage?: string;
                  area?: string;
                  duration?: string;
                  innate?: boolean;
                  image_id?: string | null;
                  image_url?: string | null;
                }) => (
                  <GridListRow
                    key={power.id}
                    id={power.id}
                    name={power.name}
                    thumbnail={resolveListRowThumbnail('power', power, power.name)}
                    columns={[
                      { key: 'Energy', value: power.energy ?? '-', align: 'center' as const },
                      { key: 'Action', value: power.action ?? '-', align: 'center' as const },
                      { key: 'Damage', value: power.damage ?? '-', align: 'center' as const },
                      { key: 'Area', value: power.area ?? '-', align: 'center' as const },
                      { key: 'Duration', value: power.duration ?? '-', align: 'center' as const },
                    ]}
                    gridColumns="1.4fr 0.6fr 0.8fr 0.8fr 0.7fr 0.8fr"
                    innate={power.innate === true}
                    leftSlot={
                      <InnateToggle
                        isInnate={power.innate === true}
                        onToggle={() => onTogglePowerInnate(power.id)}
                        size="md"
                      />
                    }
                    rightSlot={
                      <IconButton
                        variant="danger"
                        size="sm"
                        onClick={() => onRemovePower(power.id)}
                        label="Remove power"
                      >
                        <X className="w-4 h-4" />
                      </IconButton>
                    }
                    compact
                  />
                ),
              )}
            </div>
          </div>
        )}
        <Button onClick={() => onOpenPowerModal()}>Add Power</Button>
      </CollapsibleSection>

      <CollapsibleSection
        title="Techniques"
        subtitle="Combat maneuvers and martial skills"
        collapsedSummary={techniquesSummary}
        icon="⚔️"
        optional
        enabled={creature.enableTechniques}
        onEnabledChange={(enabled) => updateCreature({ enableTechniques: enabled })}
        itemCount={creature.techniques.length}
        defaultExpanded={true}
      >
        {creature.techniques.length === 0 ? (
          <p className="text-sm text-text-muted dark:text-text-secondary italic mb-4">No techniques added</p>
        ) : (
          <div className="border border-border-light rounded-lg overflow-hidden mb-4">
            <ListHeader
              columns={[
                { key: 'name', label: 'Name', width: '1.4fr' },
                { key: 'Energy', label: 'Energy', width: '0.7fr', align: 'center' },
                { key: 'Weapon', label: 'Attack', width: '1fr', align: 'center' },
                { key: 'Training Pts', label: 'Training Pts', width: '0.8fr', align: 'center' },
              ]}
              gridColumns="1.4fr 0.7fr 1fr 0.8fr"
              hasThumbnailColumn
              rowChrome={CREATURE_REMOVE_ROW_CHROME}
            />
            <div className="flex flex-col gap-1">
              {creature.techniques.map(
                (tech: {
                  id: string;
                  name: string;
                  energy?: number;
                  weapon?: string;
                  tp?: number;
                  image_id?: string | null;
                  image_url?: string | null;
                }) => (
                  <GridListRow
                    key={tech.id}
                    id={tech.id}
                    name={tech.name}
                    thumbnail={resolveListRowThumbnail('technique', tech, tech.name)}
                    columns={[
                      { key: 'Energy', value: tech.energy ?? '-', align: 'center' as const },
                      { key: 'Weapon', value: tech.weapon ?? '-', align: 'center' as const },
                      { key: 'Training Pts', value: tech.tp ?? '-', align: 'center' as const },
                    ]}
                    gridColumns="1.4fr 0.7fr 1fr 0.8fr"
                    rightSlot={
                      <IconButton
                        variant="danger"
                        size="sm"
                        onClick={() => onRemoveTechnique(tech.id)}
                        label="Remove technique"
                      >
                        <X className="w-4 h-4" />
                      </IconButton>
                    }
                    compact
                  />
                ),
              )}
            </div>
          </div>
        )}
        <Button onClick={() => onOpenTechniqueModal()}>Add Technique</Button>
      </CollapsibleSection>

      <CollapsibleSection
        title="Inventory"
        subtitle="Weapons, armor, shields, and equipment"
        collapsedSummary={armamentsSummary}
        icon="🛡️"
        optional
        enabled={creature.enableArmaments}
        onEnabledChange={(enabled) => updateCreature({ enableArmaments: enabled })}
        itemCount={creature.armaments.length}
        defaultExpanded={true}
      >
        {creature.armaments.length === 0 ? (
          <p className="text-sm text-text-muted dark:text-text-secondary italic mb-4">No inventory items added</p>
        ) : (
          <div className="flex flex-col gap-3 mb-4">
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
              <p className="mt-1 text-xs text-text-muted dark:text-text-secondary">
                Spent {stats.currencySpent}c from selected inventory items.
              </p>
            </div>
            <div className="border border-border-light rounded-lg overflow-hidden">
              <ListHeader
                columns={[
                  { key: 'name', label: 'NAME' },
                  { key: 'type', label: 'TYPE', width: 'minmax(72px, 0.55fr)', align: 'center' },
                  { key: 'range', label: 'RANGE', width: 'minmax(92px, 7.5rem)', align: 'center' },
                  { key: 'attack', label: 'ATTACK', width: 'minmax(64px, 4.25rem)', align: 'center' },
                  { key: 'damage', label: 'DAMAGE', width: 'minmax(92px, 6.75rem)', align: 'center' },
                  { key: 'tp', label: 'TP', width: '0.5fr', align: 'center' },
                  { key: 'currency', label: 'COST', width: '0.6fr', align: 'center' },
                ]}
                gridColumns={CREATURE_ARMAMENT_LIST_GRID}
                sortState={armamentSort}
                onSort={onArmamentSort}
                hasThumbnailColumn
                rowChrome={CREATURE_REMOVE_ROW_CHROME}
              />
              <div className="flex flex-col gap-1">
                {sortedArmaments.map((armament) => (
                  <GridListRow
                    key={armament.id}
                    id={armament.id}
                    name={armament.name}
                    thumbnail={resolveListRowThumbnail('equipment', armament, armament.name)}
                    gridColumns={CREATURE_ARMAMENT_LIST_GRID}
                    columns={[
                      { key: 'type', value: armament.type, align: 'center' },
                      { key: 'range', value: armament.range, align: 'center' },
                      { key: 'attack', value: armament.attack, align: 'center' },
                      { key: 'damage', value: armament.damage, align: 'center' },
                      { key: 'tp', value: armament.tp, align: 'center' },
                      { key: 'currency', value: armament.currency, align: 'center' },
                    ]}
                    rightSlot={
                      <IconButton
                        variant="danger"
                        size="sm"
                        onClick={() => onRemoveArmament(armament.id)}
                        label="Remove inventory item"
                      >
                        <X className="w-4 h-4" />
                      </IconButton>
                    }
                    compact
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <Button onClick={() => onOpenArmamentModal()}>Add Inventory Item</Button>
      </CollapsibleSection>
    </>
  );
}
