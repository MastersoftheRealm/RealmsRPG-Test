'use client';

import { cn } from '@/lib/utils/cn';
import { GridListRow } from './grid-list-row';
import { resolveListRowThumbnail } from '@/lib/list-row-image';
import {
  PowersListSection,
  TechniquesListSection,
  FeatsTraitsListSection,
  WeaponsListSection,
  ShieldsListSection,
  ArmorListSection,
  type EntityFeatRow,
  type EntityPowerRow,
  type EntityTechniqueRow,
} from './entity-library-sections';
import { SectionHeader } from './section-header';
import { ExpandableImage } from './expandable-image';
import { Card } from '@/components/ui';
import { ListHeader } from './list-header';
import { RollButton } from './roll-button';
import type { useRollsOptional } from '@/components/rolls';
import { getWeaponAttackBonusFromProperties } from '@/lib/game/weapon-attack-ability';
import { formatListCellLabel, normalizeRangeDisplay } from '@/lib/utils';
import type { Abilities } from '@/types';
import type { CreatureData } from './creature-stat-block-types';
import { StatBlockSection } from './creature-stat-block-section';
import {
  REALMS_ABILITY_ORDER,
  REALMS_ABILITY_ABBR,
  DEFENSES_BY_ABILITY,
  SENSE_DESCRIPTIONS,
  MOVEMENT_DESCRIPTIONS,
  SIMPLE_LIST_COLUMNS,
  SIMPLE_LIST_GRID,
  formatModifier,
  getAbilityValue,
  propertiesToChips,
  resolveArmamentProperties,
  type CodexProperty,
} from './creature-stat-block-helpers';

type RollContext = ReturnType<typeof useRollsOptional>;

interface CreatureStatBlockExpandedContentProps {
  creature: CreatureData;
  subline: string;
  archetype: string;
  highestAbility: { key: string; value: number; displayName: string };
  speed: number;
  evasion: number;
  maxHpDisplay: number;
  maxEnDisplay: number;
  summaryLines: string[];
  damageReduction: number;
  rollContext: RollContext;
  attackAbilities: Abilities;
  itemPropertiesDb: unknown[];
  senses: string[];
  movement: string[];
  hasSensesOrMovement: boolean;
  skillRows: Array<{
    key: string;
    rowId: string;
    name: string;
    description?: string;
    abilityAbbr: string;
    bonus: number;
  }>;
  hasSkills: boolean;
  hasFeats: boolean;
  hasWeapons: boolean;
  hasShields: boolean;
  hasArmor: boolean;
  hasPowers: boolean;
  hasTechniques: boolean;
  hasEquipment: boolean;
  weapons: NonNullable<CreatureData['armaments']>;
  shields: NonNullable<CreatureData['armaments']>;
  armor: NonNullable<CreatureData['armaments']>;
  equipment: NonNullable<CreatureData['armaments']>;
  powersForDisplay: EntityPowerRow[];
  techniquesForDisplay: EntityTechniqueRow[];
}

export function CreatureStatBlockExpandedContent({
  creature,
  subline,
  archetype,
  highestAbility,
  speed,
  evasion,
  maxHpDisplay,
  maxEnDisplay,
  summaryLines,
  damageReduction,
  rollContext,
  attackAbilities,
  itemPropertiesDb,
  senses,
  movement,
  hasSensesOrMovement,
  skillRows,
  hasSkills,
  hasFeats,
  hasWeapons,
  hasShields,
  hasArmor,
  hasPowers,
  hasTechniques,
  hasEquipment,
  weapons,
  shields,
  armor,
  equipment,
  powersForDisplay,
  techniquesForDisplay,
}: CreatureStatBlockExpandedContentProps) {
  return (
    <div className="space-y-4">
      {/* Header (character-sheet style, simplified) */}
      <Card className="shadow-md p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-stretch">
          {creature.imageUrl ? (
            <ExpandableImage
              src={creature.imageUrl}
              alt={`${creature.name} portrait`}
              className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-border-light bg-image-matte"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={creature.imageUrl} alt="" className="h-full w-full object-cover" />
            </ExpandableImage>
          ) : (
            <div className="h-20 w-20 flex-shrink-0 rounded-lg border border-border-light bg-image-matte" />
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-text-primary truncate">{creature.name}</h3>
            <p className="text-sm text-text-secondary">{subline}</p>
            <p className="text-sm font-semibold text-text-primary">
              <span className={archetype === 'Power' ? 'text-power-fg' : archetype === 'Martial' ? 'text-martial-fg' : archetype === 'Powered-Martial' ? 'text-power-fg' : undefined}>
                {archetype}
              </span>
              : <span className="text-text-primary">{highestAbility.displayName}</span>
            </p>
          </div>

          {/* Speed/Evasion/HP/EN to the right - single evenly spaced row on desktop */}
          <div className="w-full md:flex-1 md:max-w-xl md:ml-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex flex-col p-3 rounded-lg border bg-surface-alt dark:bg-surface border-border-light dark:border-border min-w-[92px]">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary dark:text-text-primary">Speed</span>
              <span className="text-lg font-bold text-text-primary">{speed}</span>
              </div>
              <div className="flex flex-col p-3 rounded-lg border bg-surface-alt dark:bg-surface border-border-light dark:border-border min-w-[92px]">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary dark:text-text-primary">Evasion</span>
              <span className="text-lg font-bold text-text-primary">{evasion}</span>
              </div>
              <div className="flex flex-col p-3 rounded-lg border bg-success-50 dark:bg-surface border-success-200 dark:border-success-800/50 min-w-[92px]">
              <span className="text-xs font-semibold uppercase tracking-wide text-success-fg">Health</span>
              <span className="text-lg font-bold text-success-fg">{maxHpDisplay}</span>
              </div>
              <div className="flex flex-col p-3 rounded-lg border bg-info-50 dark:bg-surface border-info-200 dark:border-info-800/50 min-w-[92px]">
              <span className="text-xs font-semibold uppercase tracking-wide text-info-fg">Energy</span>
              <span className="text-lg font-bold text-info-fg">{maxEnDisplay}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Abilities row (mini boxes with roll buttons) */}
        {creature.abilities && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
            {REALMS_ABILITY_ORDER.map((k) => {
              const abbr = REALMS_ABILITY_ABBR[k];
              const val = getAbilityValue(creature.abilities!, k);
              const defenseMeta = DEFENSES_BY_ABILITY.find((d) => d.ability === k);
              const defenseBonus = defenseMeta && creature.defenses && typeof creature.defenses[defenseMeta.defenseKey] === 'number'
                ? (creature.defenses[defenseMeta.defenseKey] as number)
                : 0;
              const showDefense = defenseBonus !== 0 && defenseMeta != null;
              const defenseTotal = val + defenseBonus;
              return (
                <div key={k} className="rounded-lg border border-border-light bg-surface-alt px-2 py-2">
                  <div className={cn('grid gap-1', showDefense ? 'grid-cols-2' : 'grid-cols-1')}>
                    <div className="text-[11px] font-semibold text-text-secondary text-center">{abbr}</div>
                    {showDefense && (
                      <div className="text-[11px] font-semibold text-text-secondary text-center">{defenseMeta!.abbr}</div>
                    )}
                  </div>
                  {rollContext?.canRoll !== false && rollContext ? (
                    <div className={cn('mt-1 grid gap-1', showDefense ? 'grid-cols-2' : 'grid-cols-1')}>
                      <div className="flex justify-center">
                        <RollButton
                          value={val}
                          onClick={() => rollContext.rollAbility(`${creature.name}: ${abbr}`, val)}
                          size="sm"
                          title={`Roll ${abbr}`}
                        />
                      </div>
                      {showDefense && (
                        <div className="flex justify-center">
                          <RollButton
                            value={defenseTotal}
                            onClick={() => rollContext.rollDefense(`${creature.name}: ${defenseMeta!.abbr}`, defenseTotal)}
                            size="sm"
                            title={`Roll ${defenseMeta!.label}`}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={cn('mt-1 grid gap-1 text-sm font-bold text-text-primary tabular-nums', showDefense ? 'grid-cols-2' : 'grid-cols-1')}>
                      <div className="text-center">{formatModifier(val)}</div>
                      {showDefense && <div className="text-center">{formatModifier(defenseTotal)}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Sentence-style lines (kept compact) */}
        <div className="mt-4 space-y-1">
          {summaryLines.map((line) => (
            <p key={line} className="text-sm text-text-primary">{line}</p>
          ))}
          <p className="text-sm text-text-primary"><strong>Damage Reduction</strong> {damageReduction}</p>
        </div>
      </Card>

      {/* Sections start full-width under the header */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          {hasSensesOrMovement && (
            <>
              {senses.length > 0 && (
                <StatBlockSection title="Senses" defaultExpanded>
                  <ListHeader columns={SIMPLE_LIST_COLUMNS} gridColumns={SIMPLE_LIST_GRID} />
                  <div className="space-y-1 mt-2">
                    {senses.map((sense) => (
                      <GridListRow
                        key={`${creature.id}-sense-${sense}`}
                        id={`${creature.id}-sense-${sense}`}
                        name={sense}
                        description={SENSE_DESCRIPTIONS[sense] ?? 'No description available.'}
                        columns={[{ key: 'description', value: SENSE_DESCRIPTIONS[sense] ?? 'No description available.' }]}
                        gridColumns={SIMPLE_LIST_GRID}
                        compact
                      />
                    ))}
                  </div>
                </StatBlockSection>
              )}

              {movement.length > 0 && (
                <StatBlockSection title="Movement" defaultExpanded>
                  <ListHeader columns={SIMPLE_LIST_COLUMNS} gridColumns={SIMPLE_LIST_GRID} />
                  <div className="space-y-1 mt-2">
                    {movement.map((m) => (
                      <GridListRow
                        key={`${creature.id}-move-${m}`}
                        id={`${creature.id}-move-${m}`}
                        name={m}
                        description={MOVEMENT_DESCRIPTIONS[m] ?? 'See movement rules for details.'}
                        columns={[
                          {
                            key: 'description',
                            value: MOVEMENT_DESCRIPTIONS[m] ?? 'See movement rules for details.',
                          },
                        ]}
                        gridColumns={SIMPLE_LIST_GRID}
                        compact
                      />
                    ))}
                  </div>
                </StatBlockSection>
              )}
            </>
          )}

          {hasSkills && (
            <StatBlockSection title="Skills" defaultExpanded>
              <div className="mt-2 grid grid-cols-1 gap-3 xl:grid-cols-2">
                {[skillRows.slice(0, Math.ceil(skillRows.length / 2)), skillRows.slice(Math.ceil(skillRows.length / 2))].map(
                  (columnRows, columnIndex) =>
                    columnRows.length > 0 ? (
                      <div key={`${creature.id}-skills-col-${columnIndex}`}>
                        <ListHeader
                          columns={[
                            { key: 'name', label: 'Name', width: '1.2fr' },
                            { key: 'ability', label: 'Ability', width: '0.7fr', align: 'center' },
                            { key: 'bonus', label: 'Bonus', width: '0.7fr', align: 'center' },
                          ]}
                          gridColumns="1.2fr 0.7fr 0.7fr"
                        />
                        <div className="mt-2 space-y-1">
                          {columnRows.map((row) => (
                            <GridListRow
                              key={row.key}
                              id={row.rowId}
                              name={row.name}
                              description={row.description}
                              gridColumns="1.2fr 0.7fr 0.7fr"
                              columns={[
                                { key: 'ability', value: row.abilityAbbr, align: 'center' },
                                {
                                  key: 'bonus',
                                  value:
                                    rollContext?.canRoll !== false && rollContext ? (
                                      <div className="flex justify-center">
                                        <RollButton
                                          value={row.bonus}
                                          onClick={() =>
                                            rollContext.rollSkill(`${creature.name}: ${row.name}`, row.bonus, row.abilityAbbr)
                                          }
                                          size="sm"
                                          title={`Roll ${row.name}`}
                                        />
                                      </div>
                                    ) : (
                                      formatModifier(row.bonus)
                                    ),
                                  align: 'center',
                                },
                              ]}
                              compact
                            />
                          ))}
                        </div>
                      </div>
                    ) : null
                )}
              </div>
            </StatBlockSection>
          )}

          {hasFeats && (
            <StatBlockSection title="Creature Feats" defaultExpanded>
              <FeatsTraitsListSection
                showListHeader
                compactRows
                showTitle={false}
                items={(creature.feats ?? []).map(
                  (f, idx): EntityFeatRow => ({
                    id: `${creature.id}-feat-${idx}`,
                    name: f.name,
                    description: f.description,
                  })
                )}
              />
            </StatBlockSection>
          )}
        </div>

        <div className="space-y-4">

          {hasWeapons && (
            <StatBlockSection title="Weapons" defaultExpanded>
              <WeaponsListSection
                showTitle={false}
                rollTitlePrefix={creature.name}
                items={weapons.map((w, idx) => ({
                  id: `${creature.id}-w-${idx}`,
                  name: w.name,
                  description: w.description,
                  thumbnail: resolveListRowThumbnail('equipment', w, w.name),
                  damage: w.damage,
                  range: normalizeRangeDisplay(w.range) || 'Melee',
                  attackBonus: getWeaponAttackBonusFromProperties(
                    resolveArmamentProperties(w),
                    attackAbilities,
                    creature.martialProficiency ?? 0,
                    normalizeRangeDisplay(w.range) || 'Melee'
                  ).bonus,
                  chips: propertiesToChips(resolveArmamentProperties(w), itemPropertiesDb as unknown as CodexProperty[]),
                }))}
                showListHeader
                compactRows
              />
            </StatBlockSection>
          )}

          {hasShields && (
            <StatBlockSection title="Shields" defaultExpanded>
              <ShieldsListSection
                showTitle={false}
                items={shields.map((s, idx) => ({
                  id: `${creature.id}-s-${idx}`,
                  name: s.name,
                  description: s.description,
                  thumbnail: resolveListRowThumbnail('equipment', s, s.name),
                  damage: s.damage,
                  properties: s.properties,
                  chips: propertiesToChips(resolveArmamentProperties(s), itemPropertiesDb as unknown as CodexProperty[]),
                }))}
                showListHeader
                compactRows
              />
            </StatBlockSection>
          )}

          {hasArmor && (
            <StatBlockSection title="Armor" defaultExpanded>
              <ArmorListSection
                showTitle={false}
                items={armor.map((a, idx) => ({
                  id: `${creature.id}-a-${idx}`,
                  name: a.name,
                  description: a.description,
                  thumbnail: resolveListRowThumbnail('equipment', a, a.name),
                  damageReduction: a.damageReduction,
                  armorValue: a.armorValue,
                  chips: propertiesToChips(resolveArmamentProperties(a), itemPropertiesDb as unknown as CodexProperty[]),
                }))}
                showListHeader
                compactRows
              />
            </StatBlockSection>
          )}

          {hasPowers && (
            <StatBlockSection title="Powers" defaultExpanded>
              <PowersListSection
                items={powersForDisplay}
                showListHeader
                compactRows
                includeEnergyColumn
                showTitle={false}
              />
            </StatBlockSection>
          )}

          {hasTechniques && (
            <StatBlockSection title="Techniques" defaultExpanded>
              <TechniquesListSection
                items={techniquesForDisplay}
                showListHeader
                compactRows
                showTitle={false}
              />
            </StatBlockSection>
          )}

          {hasEquipment && (
            <StatBlockSection title="Equipment" defaultExpanded>
              <ListHeader
                columns={[
                  { key: 'name', label: 'Name', width: '1fr' },
                  { key: 'type', label: 'Type', width: '0.6fr', align: 'center' },
                  { key: 'quantity', label: 'Qty', width: '4rem', align: 'center' },
                ]}
                gridColumns="1fr 0.6fr 4rem"
                hasThumbnailColumn
              />
              <div className="space-y-1 mt-2">
                {equipment.map((e, idx) => (
                  <GridListRow
                    key={`${creature.id}-equipment-${idx}`}
                    id={`${creature.id}-equipment-${idx}`}
                    name={e.name}
                    description={e.description}
                    thumbnail={resolveListRowThumbnail('equipment', e, e.name)}
                    gridColumns="1fr 0.6fr 4rem"
                    columns={[
                      { key: 'type', value: formatListCellLabel(e.type), align: 'center' },
                      { key: 'quantity', value: (e as { quantity?: number }).quantity ?? 1, align: 'center' },
                    ]}
                    compact
                  />
                ))}
              </div>
            </StatBlockSection>
          )}
        </div>
      </div>

      {/* Full-width Description section below stats + sections */}
      {creature.description && (
        <div className="mt-4">
          <SectionHeader title="Description" size="sm" />
          <div className="mt-1 rounded-lg bg-surface p-3 border border-border-light">
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {creature.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
