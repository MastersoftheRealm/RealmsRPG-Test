/**
 * Creature Creator — feats, powers, techniques, inventory sections (TASK-610)
 */

'use client';

import { useMemo } from 'react';
import { formatEnergyStat } from '@/lib/calculators';
import { publishedTechniqueTrainingPoints } from '@/lib/library/published-training-points';
import { useTechniqueParts } from '@/hooks';
import { calculateArchetypeProgression } from '@/lib/game/formulas';
import {
  INNATE_ENERGY_TOTAL_WARNING,
  INNATE_THRESHOLD_WARNING,
  isInnateEnergyTotalOverBudget,
  isInnatePowerOverThreshold,
} from '@/lib/character/innate-power-capacity';
import { formatListCellLabel } from '@/lib/utils';
import { GridListRow, ListHeader, InnateToggle, ValueStepper } from '@/components/patterns';
import { resolveListRowThumbnail } from '@/lib/list-row-image';
import { Button, IconButton } from '@/components/ui';
import { X } from 'lucide-react';
import { CollapsibleSection } from '@/components/creator';
import { buildFeatLevelChips } from '@/lib/leveled-feats';
import type { CreatureCreatorEditorProps } from './creature-creator-editor';
import { CreatureCreatorEditorInventorySection } from './creature-creator-editor-inventory-section';
import { creaturePowerRowKey } from '@/lib/game/creature-power-instances';

const CREATURE_FEAT_LIST_GRID = '1.15fr 0.58fr 0.52fr 0.4fr';
const CREATURE_REMOVE_ROW_CHROME = { rightSlot: true } as const;
const CREATURE_POWER_ROW_CHROME = { leftSlot: true, rightSlot: true } as const;

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
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const innateBudget = useMemo(() => {
    const progression = calculateArchetypeProgression(
      creature.level,
      creature.martialProficiency,
      creature.powerProficiency,
    );
    const innateEnergies = creature.powers
      .filter((p) => p.innate === true)
      .map((p) => p.energy ?? 0);
    return {
      innateEnergyMax: progression.innateEnergy,
      innateThreshold: progression.innateThreshold,
      overEnergy: isInnateEnergyTotalOverBudget(progression.innateEnergy, innateEnergies),
      overThreshold: innateEnergies.some((energy) =>
        isInnatePowerOverThreshold(energy, progression.innateThreshold),
      ),
    };
  }, [creature.level, creature.martialProficiency, creature.powerProficiency, creature.powers]);

  return (
    <>
      <CollapsibleSection
        title="Feats"
        subtitle="Special abilities and traits"
        collapsedSummary={featsSummary}
        icon="⭐"
        itemCount={creature.feats.length}
        points={{ spent: stats.featSpent, total: stats.featPoints }}
      >
        {creature.feats.length === 0 ? (
          <p className="mb-4 text-sm text-text-muted italic">No feats added</p>
        ) : (
          <div className="mb-4 overflow-hidden rounded-lg border border-border-light">
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
                        <X className="h-4 w-4" />
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
      >
        {innateBudget.innateEnergyMax > 0 ? (
          <p className="mb-3 text-sm text-text-secondary">
            Innate Energy:{' '}
            {innateBudget.innateEnergyMax -
              creature.powers
                .filter((p) => p.innate === true)
                .reduce((sum, p) => sum + (p.energy ?? 0), 0)}{' '}
            / {innateBudget.innateEnergyMax} · Threshold {innateBudget.innateThreshold}
          </p>
        ) : null}
        {innateBudget.overEnergy ? (
          <p className="mb-3 font-nunito text-sm text-warning-fg" role="status">
            {INNATE_ENERGY_TOTAL_WARNING}
          </p>
        ) : null}
        {innateBudget.overThreshold ? (
          <p className="mb-3 font-nunito text-sm text-warning-fg" role="status">
            {INNATE_THRESHOLD_WARNING}
          </p>
        ) : null}
        {creature.powers.length === 0 ? (
          <p className="mb-4 text-sm text-text-muted italic">No powers added</p>
        ) : (
          <div className="mb-4 overflow-hidden rounded-lg border border-border-light">
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
              {creature.powers.map((power, powerIndex) => (
                <GridListRow
                  key={creaturePowerRowKey(power, powerIndex)}
                  id={creaturePowerRowKey(power, powerIndex)}
                  name={power.name}
                  description={power.description}
                  thumbnail={resolveListRowThumbnail('power', power, power.name)}
                  columns={[
                    {
                      key: 'Energy',
                      value: formatEnergyStat(power.energy ?? 0),
                      align: 'center' as const,
                    },
                    { key: 'Action', value: power.action ?? '-', align: 'center' as const },
                    { key: 'Damage', value: power.damage ?? '-', align: 'center' as const },
                    { key: 'Area', value: power.area ?? '-', align: 'center' as const },
                    { key: 'Duration', value: power.duration ?? '-', align: 'center' as const },
                  ]}
                  gridColumns="1.4fr 0.6fr 0.8fr 0.8fr 0.7fr 0.8fr"
                  detailSections={
                    power.variantChips && power.variantChips.length > 0
                      ? [
                          {
                            label: power.variantLabel ?? 'Variants',
                            chips: power.variantChips.map((chip) => ({
                              name: chip.name,
                              ...(chip.description ? { description: chip.description } : {}),
                              kind: 'descriptor' as const,
                            })),
                            ...(power.variantHelp ? { labelHelp: power.variantHelp } : {}),
                          },
                        ]
                      : undefined
                  }
                  innate={power.innate === true}
                  warningMessage={
                    power.innate === true &&
                    isInnatePowerOverThreshold(power.energy, innateBudget.innateThreshold)
                      ? INNATE_THRESHOLD_WARNING
                      : undefined
                  }
                  leftSlot={
                    <InnateToggle
                      isInnate={power.innate === true}
                      onToggle={() => onTogglePowerInnate(creaturePowerRowKey(power, powerIndex))}
                      size="md"
                    />
                  }
                  rightSlot={
                    <IconButton
                      variant="danger"
                      size="sm"
                      onClick={() => onRemovePower(creaturePowerRowKey(power, powerIndex))}
                      label="Remove power"
                    >
                      <X className="h-4 w-4" />
                    </IconButton>
                  }
                  compact
                />
              ))}
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
      >
        {creature.techniques.length === 0 ? (
          <p className="mb-4 text-sm text-text-muted italic">No techniques added</p>
        ) : (
          <div className="mb-4 overflow-hidden rounded-lg border border-border-light">
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
              {creature.techniques.map((tech) => {
                const published = publishedTechniqueTrainingPoints(tech, techniquePartsDb);
                const trainingPoints = published.priced ? published.tp : (tech.tp ?? '-');
                return (
                  <GridListRow
                    key={tech.id}
                    id={tech.id}
                    name={tech.name}
                    thumbnail={resolveListRowThumbnail('technique', tech, tech.name)}
                    columns={[
                      {
                        key: 'Energy',
                        value: formatEnergyStat(tech.energy ?? 0),
                        align: 'center' as const,
                      },
                      { key: 'Weapon', value: tech.weapon ?? '-', align: 'center' as const },
                      { key: 'Training Pts', value: trainingPoints, align: 'center' as const },
                    ]}
                    gridColumns="1.4fr 0.7fr 1fr 0.8fr"
                    rightSlot={
                      <IconButton
                        variant="danger"
                        size="sm"
                        onClick={() => onRemoveTechnique(tech.id)}
                        label="Remove technique"
                      >
                        <X className="h-4 w-4" />
                      </IconButton>
                    }
                    compact
                  />
                );
              })}
            </div>
          </div>
        )}
        <Button onClick={() => onOpenTechniqueModal()}>Add Technique</Button>
      </CollapsibleSection>

      <CreatureCreatorEditorInventorySection
        creature={creature}
        stats={stats}
        armamentsSummary={armamentsSummary}
        armamentSort={armamentSort}
        onArmamentSort={onArmamentSort}
        sortedArmaments={sortedArmaments}
        updateCreature={updateCreature}
        onRemoveArmament={onRemoveArmament}
        onOpenArmamentModal={onOpenArmamentModal}
      />
    </>
  );
}
