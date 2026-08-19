/**
 * Archetype Section
 * =================
 * Displays character archetype, proficiencies, attack bonuses, power potency, weapons, and armor
 */

'use client';

import { useState } from 'react';
import { cn, defined } from '@/lib/utils';
import {
  calculateProficiency,
  getArchetypeType,
  getArchetypeMilestoneLevels,
  unproficientBonus,
} from '@/lib/game/formulas';
import { calculateBonuses, calculateScoreFromBonus } from '@/lib/game/calculations';
import { useGameRules } from '@/hooks/use-game-rules';
import { useRollsOptional } from '@/components/rolls';
import {
  EditSectionToggle,
  RollButton,
  SectionHeader,
  PoweredMartialSlider,
  DecrementButton,
  IncrementButton,
} from '@/components/patterns';
import { TableScroll } from '@/components/ui';
import type { Character, Abilities, Item } from '@/types';
import type { EnrichedItem } from '@/lib/data-enrichment';
import {
  QuickArmorTable,
  QuickShieldsTable,
  QuickWeaponsTable,
  QUICK_WEAPON_COL,
  type QuickArmamentItem,
} from '@/components/patterns';
import { Card, DescriptorChip } from '@/components/ui';
import { profPointsDescriptorVariant } from '@/lib/chip/descriptor-chip-variants';

function toQuickArmamentItems(items: Array<EnrichedItem | Item>): QuickArmamentItem[] {
  return items.map((item) => {
    const rawProps = 'properties' in item ? item.properties : undefined;
    const properties = rawProps?.map(
      (prop): QuickArmamentItem['properties'] extends (infer U)[] | undefined ? U : never => {
        if (typeof prop === 'string') return prop;
        const op1 =
          'op_1_lvl' in prop && typeof prop.op_1_lvl === 'number' ? prop.op_1_lvl : undefined;
        return {
          id: typeof prop.id === 'number' ? prop.id : undefined,
          name: prop.name,
          ...(op1 !== undefined ? { op_1_lvl: op1 } : {}),
        };
      },
    );

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      damage: item.damage,
      range: typeof item.range === 'number' ? String(item.range) : item.range,
      properties,
      equipped: item.equipped,
      armorValue: 'armorValue' in item ? item.armorValue : undefined,
      armor: item.armor,
      libraryItem: 'libraryItem' in item ? item.libraryItem : undefined,
    };
  });
}

interface ArchetypeSectionProps {
  character: Character;
  isEditMode?: boolean | undefined;
  onMartialProfChange?: ((value: number) => void) | undefined;
  onPowerProfChange?: ((value: number) => void) | undefined;
  onMilestoneChoiceChange?: ((level: number, choice: 'innate' | 'feat') => void) | undefined;
  // Unarmed Prowess props
  unarmedProwess?: number | undefined; // 0 = not selected, 1-5 = prowess level
  onUnarmedProwessChange?: ((level: number) => void) | undefined;
  // Enriched equipment (from codex/library) — used instead of raw character.equipment
  enrichedWeapons?: EnrichedItem[] | undefined;
  enrichedShields?: EnrichedItem[] | undefined;
  enrichedArmor?: EnrichedItem[] | undefined;
  className?: string | undefined;
}

// Attack Bonuses Table - displays Prof/Unprof bonuses for each ability
function AttackBonusesTable({
  abilities,
  martialProf,
  powerProf,
  powerAbility,
  onRollBonus,
}: {
  abilities: Abilities;
  martialProf: number;
  powerProf: number;
  powerAbility?: string | undefined; // The archetype's power ability (pow_abil)
  onRollBonus?: ((name: string, bonus: number) => void) | undefined;
}) {
  // Prof = Ability + Proficiency; Unprof = half the Ability, doubled if negative.
  const bonuses = calculateBonuses(martialProf, powerProf, abilities, powerAbility);
  const martialBonuses = {
    strength: bonuses.strength,
    agility: bonuses.agility,
    acuity: bonuses.acuity,
  };

  // Power bonus defaults to Charisma when the path has no Power Ability.
  const powAbilDisplayName = powerAbility
    ? powerAbility.charAt(0).toUpperCase() + powerAbility.slice(1).toLowerCase()
    : 'Charisma';

  const powerBonus = bonuses.powerAttack;

  return (
    <div className="mb-4 rounded-lg bg-surface-alt p-3">
      <SectionHeader title="Attack Bonuses" className="mb-2" />
      <TableScroll>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-text-muted">
              <th className="py-1 text-left"></th>
              <th className="py-1 text-center">Prof.</th>
              <th className="py-1 text-center">Unprof.</th>
            </tr>
          </thead>
          <tbody>
            {/* Martial rows - always show for unproficient attacks */}
            {(['strength', 'agility', 'acuity'] as const).map((key) => (
              <tr key={key}>
                <td className="py-1 font-medium text-text-secondary capitalize">⚔️ {key}</td>
                <td className="py-1 text-center">
                  {onRollBonus ? (
                    <RollButton
                      value={martialBonuses[key].prof}
                      onClick={() =>
                        onRollBonus(
                          `${key.charAt(0).toUpperCase() + key.slice(1)} Attack`,
                          martialBonuses[key].prof,
                        )
                      }
                      size="sm"
                      title={`Roll ${key} (proficient)`}
                    />
                  ) : (
                    <span className="text-sm font-medium text-text-muted">
                      {martialBonuses[key].prof >= 0 ? '+' : ''}
                      {martialBonuses[key].prof}
                    </span>
                  )}
                </td>
                <td className="py-1 text-center">
                  {onRollBonus ? (
                    <RollButton
                      value={martialBonuses[key].unprof}
                      variant="unproficient"
                      onClick={() =>
                        onRollBonus(
                          `${key.charAt(0).toUpperCase() + key.slice(1)} Attack`,
                          martialBonuses[key].unprof,
                        )
                      }
                      size="sm"
                      title={`Roll ${key} (unproficient)`}
                    />
                  ) : (
                    <span className="text-sm font-medium text-text-muted">
                      {martialBonuses[key].unprof >= 0 ? '+' : ''}
                      {martialBonuses[key].unprof}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>

      {/* Power Attack Bonus - separate section, full width, no unprof */}
      {powerProf > 0 && (
        <div className="mt-3 border-t border-border-light pt-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-text-secondary">
              ✨ Power Attack ({powAbilDisplayName})
            </span>
            {onRollBonus ? (
              <RollButton
                value={powerBonus.prof}
                onClick={() => onRollBonus(`${powAbilDisplayName} Attack`, powerBonus.prof)}
                size="sm"
                title={`Roll power attack - ${powAbilDisplayName}`}
              />
            ) : (
              <span className="text-sm font-medium text-text-muted">
                {powerBonus.prof >= 0 ? '+' : ''}
                {powerBonus.prof}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Unarmed Prowess damage: proficient = Ability + Martial Proficiency + dice (dice only at prowess 2+)
// Level 1: full Attack Bonus (no dice). Level 2+: dice + Attack Bonus.
const UNARMED_PROWESS_DAMAGE: { level: number; damage: string | null }[] = [
  { level: 0, damage: null }, // Unproficient - half ability, no bonus
  { level: 1, damage: null }, // Prowess I — damage = Attack Bonus (no dice)
  { level: 2, damage: '1d2' }, // Prowess II (Lv 4)
  { level: 3, damage: '1d4' }, // Prowess III (Lv 8)
  { level: 4, damage: '1d6' }, // Prowess IV (Lv 12)
  { level: 5, damage: '1d8' }, // Prowess V (Lv 16+)
];

// Weapons Section - displays equipped weapons with attack/damage rolls
function WeaponsSection({
  character,
  martialProf,
  unarmedProwess = 0,
  onRollAttack,
  onRollDamage,
  enrichedWeapons,
}: {
  character: Character;
  martialProf: number;
  unarmedProwess?: number | undefined;
  onRollAttack?: ((name: string, bonus: number) => void) | undefined;
  onRollDamage?: ((damageStr: string, bonus: number) => void) | undefined;
  enrichedWeapons?: EnrichedItem[] | undefined;
}) {
  const abilities = character.abilities || {};

  // Use enriched weapons if available, fallback to raw character equipment
  const weapons = enrichedWeapons || ((character.equipment?.weapons || []) as Item[]);
  const equippedWeapons = weapons.filter((w) => w.equipped);

  // Unarmed prowess uses STR or AGI (whichever is higher)
  const str = abilities.strength ?? 0;
  const agi = abilities.agility ?? 0;
  const unarmedAbility = Math.max(str, agi);

  // Attack Bonus: proficient = Ability + Martial Proficiency; unproficient =
  // unproficientBonus (T2 / formulas.test.ts). Do not hand-roll floor() or max(1,…).
  const hasProwess = unarmedProwess > 0;
  const unarmedAttackBonus = hasProwess
    ? unarmedAbility + martialProf
    : unproficientBonus(unarmedAbility);

  // Damage equals the Attack Bonus, plus dice from Prowess II upward.
  const prowessData = defined(UNARMED_PROWESS_DAMAGE[unarmedProwess] ?? UNARMED_PROWESS_DAMAGE[0]);
  const unarmedDamageDisplay = hasProwess
    ? prowessData.damage
      ? `${prowessData.damage} + ${unarmedAttackBonus}`
      : String(unarmedAttackBonus) // Prowess I: full Attack Bonus, no dice
    : String(unarmedAttackBonus);

  // Same QUICK_WEAPON_COL cells as weapon rows so Name/Range/Attack/Damage stay aligned.
  const unarmedRow = (
    <tr className="border-t border-border-light align-top">
      <td className={QUICK_WEAPON_COL.nameTd}>
        <div className="break-words">Unarmed Prowess</div>
      </td>
      <td className={QUICK_WEAPON_COL.rangeTd}>Melee</td>
      <td className={QUICK_WEAPON_COL.attackTd}>
        {onRollAttack ? (
          <RollButton
            value={unarmedAttackBonus}
            variant={hasProwess ? 'primary' : 'unproficient'}
            onClick={() => onRollAttack('Unarmed Prowess', unarmedAttackBonus)}
            size="sm"
            title={`Roll unarmed attack (${hasProwess ? 'proficient' : 'unproficient'})`}
          />
        ) : (
          <span className="text-sm font-medium text-text-muted">
            {unarmedAttackBonus >= 0 ? '+' : ''}
            {unarmedAttackBonus}
          </span>
        )}
      </td>
      <td className={QUICK_WEAPON_COL.damageTd}>
        <div className="flex flex-col items-center gap-0.5">
          {onRollDamage ? (
            <RollButton
              value={0}
              displayValue={unarmedDamageDisplay}
              variant={hasProwess ? 'danger' : 'unproficient'}
              onClick={() => {
                // Roll expects dice pattern; at prowess 1 damage is Attack Bonus only (no dice)
                const rollStr =
                  hasProwess && !prowessData.damage
                    ? `0d4 Bludgeoning`
                    : `${unarmedDamageDisplay} Bludgeoning`;
                onRollDamage(rollStr, unarmedAttackBonus);
              }}
              size="sm"
              title="Roll unarmed damage"
            />
          ) : (
            <span className="text-sm font-medium text-text-muted">{unarmedDamageDisplay}</span>
          )}
          <span className="text-[10px] text-text-muted">Bludgeoning</span>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="mb-4 rounded-lg bg-surface-alt p-3">
      <QuickWeaponsTable
        items={toQuickArmamentItems(equippedWeapons)}
        abilities={abilities}
        martialProf={martialProf}
        filterEquipped={false}
        className="mb-0 bg-transparent p-0"
        trailingRows={unarmedRow}
      />
    </div>
  );
}

// Shields Section - displays equipped shields: Name, Block, Damage, Attack (same horizontal layout as weapons)
function ShieldsSection({
  character,
  martialProf,
  enrichedShields,
}: {
  character: Character;
  martialProf: number;
  onRollAttack?: ((name: string, bonus: number) => void) | undefined;
  onRollDamage?: ((damageStr: string, bonus: number) => void) | undefined;
  enrichedShields?: EnrichedItem[] | undefined;
}) {
  const abilities = character.abilities || {};
  const shields = enrichedShields || ((character.equipment?.shields || []) as Item[]);
  const equippedShields = shields.filter((s) => s.equipped);

  return (
    <QuickShieldsTable
      items={toQuickArmamentItems(equippedShields)}
      abilities={abilities}
      martialProf={martialProf}
      filterEquipped={false}
    />
  );
}

// Armor Section - displays equipped armor with stats
function ArmorSection({
  character,
  enrichedArmor,
}: {
  character: Character;
  enrichedArmor?: EnrichedItem[] | undefined;
}) {
  const abilities = character.abilities || {};

  // Use enriched armor if available, fallback to raw character equipment
  const armor = enrichedArmor || ((character.equipment?.armor || character.armor || []) as Item[]);
  const armorArray = Array.isArray(armor) ? armor : [armor].filter(Boolean);
  const equippedArmor = armorArray.filter(
    (a): a is Item => a !== null && a !== undefined && (a as Item).equipped === true,
  );

  return (
    <QuickArmorTable
      items={toQuickArmamentItems(equippedArmor)}
      abilities={abilities}
      filterEquipped={false}
    />
  );
}

export function ArchetypeSection({
  character,
  isEditMode = false,
  onMartialProfChange,
  onPowerProfChange,
  onMilestoneChoiceChange,
  unarmedProwess,
  enrichedWeapons,
  enrichedShields,
  enrichedArmor,
  className,
}: ArchetypeSectionProps) {
  const martialProf = character.mart_prof ?? character.martialProficiency ?? 0;
  const powerProf = character.pow_prof ?? character.powerProficiency ?? 0;
  const rollContext = useRollsOptional();
  const { rules } = useGameRules();

  // Local state for whether this section is actively being edited
  const [isSectionEditing, setIsSectionEditing] = useState(false);
  // Optional manual max above level-derived total (homebrew); floor is always level-based
  const [maxProfOverride, setMaxProfOverride] = useState<number | null>(null);

  // Calculate proficiency points (effective max = level-based, or higher if manually raised)
  const level = character.level || 1;
  const levelBasedMax = calculateProficiency(level, false, rules);
  // Ignore stale overrides at/below level max (derive — no sync effect)
  const effectiveMaxProfOverride =
    maxProfOverride !== null && maxProfOverride > levelBasedMax ? maxProfOverride : null;
  const totalProfPoints = Math.max(levelBasedMax, effectiveMaxProfOverride ?? levelBasedMax);
  const spentProfPoints = martialProf + powerProf;
  const remainingProfPoints = totalProfPoints - spentProfPoints;

  // Derived state: is the section actually editable right now?
  const showEditControls = isEditMode && isSectionEditing;

  // Determine archetype type for milestone UI
  const archetypeType = getArchetypeType(martialProf, powerProf);
  const milestoneLevels = getArchetypeMilestoneLevels(level, rules);
  const archetypeChoices = character.archetypeChoices || {};

  // Three-state color for proficiency points
  const profPointsVariant = profPointsDescriptorVariant(remainingProfPoints);

  // Potency = Bonus + 10 (GAME_RULES "The Score Pattern").
  const powAbilName = character.pow_abil?.toLowerCase() || 'charisma';
  const martAbilName = character.mart_abil?.toLowerCase() || 'strength';
  const powAbilValue = character.abilities?.[powAbilName as keyof Abilities] ?? 0;
  const martAbilValue = character.abilities?.[martAbilName as keyof Abilities] ?? 0;
  const powerPotency = calculateScoreFromBonus(powerProf + powAbilValue, rules);
  const martialPotency = calculateScoreFromBonus(martialProf + martAbilValue, rules);

  // Handle attack bonus roll
  const handleRollBonus = (name: string, bonus: number) => {
    rollContext?.rollAttack(name, bonus);
  };

  // Handle damage roll
  const handleRollDamage = (damageStr: string, bonus: number) => {
    rollContext?.rollDamage?.(damageStr, bonus);
  };

  // Calculate edit state for pencil icon color
  const getEditState = (): 'normal' | 'has-points' | 'over-budget' => {
    if (remainingProfPoints > 0) return 'has-points';
    if (remainingProfPoints < 0) return 'over-budget';
    return 'normal';
  };

  return (
    <Card className={cn('relative p-4 shadow-md md:p-6', className)}>
      {/* Edit Mode Indicator - Blue Pencil Icon in top-right */}
      {isEditMode && (
        <div className="absolute top-3 right-3">
          <EditSectionToggle
            state={getEditState()}
            isActive={isSectionEditing}
            onClick={() => setIsSectionEditing((prev) => !prev)}
            title={
              isSectionEditing
                ? 'Click to close editing'
                : getEditState() === 'has-points'
                  ? 'Click to edit - you have proficiency points to spend'
                  : getEditState() === 'over-budget'
                    ? 'Click to edit - over budget, remove proficiency points'
                    : 'Click to edit archetype'
            }
          />
        </div>
      )}

      {/* Archetype Header - no subtext (Power/Martial implied) */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-text-primary">Archetype & Attacks</h2>
      </div>

      {/* Proficiencies - show slider only when editing; simple values otherwise */}
      {showEditControls ? (
        <>
          <div className="mb-4">
            <PoweredMartialSlider
              powerValue={powerProf}
              martialValue={martialProf}
              maxPoints={totalProfPoints}
              onChange={(power, martial) => {
                onPowerProfChange?.(power);
                onMartialProfChange?.(martial);
              }}
              compact
              allowZeroEnds
            />
          </div>
          {/* Proficiency Points Display - steppers change max only; three-state coloring for pencil */}
          <div className="mb-4 flex items-center justify-center gap-2">
            <DecrementButton
              onClick={() => {
                if (totalProfPoints <= levelBasedMax) return;
                const next = totalProfPoints - 1;
                setMaxProfOverride(next <= levelBasedMax ? null : next);
              }}
              disabled={totalProfPoints <= levelBasedMax}
              size="sm"
              title="Decrease max prof points (cannot go below level-based total)"
            />
            <DescriptorChip variant={profPointsVariant} size="md" className="font-medium">
              {remainingProfPoints} / {totalProfPoints} prof. points
            </DescriptorChip>
            <IncrementButton
              onClick={() => setMaxProfOverride(Math.min(12, totalProfPoints + 1))}
              size="sm"
              title="Increase max prof points above level-based total"
            />
          </div>
        </>
      ) : null}

      {/* Archetype stats: one row per type (Power, Martial) — Prof and Potency on same line, same style/size */}
      {(powerProf > 0 || martialProf > 0) && !showEditControls && (
        <div className="mb-4 flex gap-3">
          {powerProf > 0 && (
            <div
              className={cn(
                'flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg px-3 py-2',
                'bg-power-light',
              )}
            >
              <span className="text-sm font-medium text-power-fg">Power</span>
              <span
                className="text-sm text-power-fg"
                title="Prof: proficiency bonus · Potency: 10 + Prof + Ability"
              >
                Prof +{powerProf} · Potency {powerPotency}
              </span>
            </div>
          )}
          {martialProf > 0 && (
            <div
              className={cn(
                'flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg px-3 py-2',
                'bg-martial-light',
              )}
            >
              <span className="text-sm font-medium text-martial-fg">Martial</span>
              <span
                className="text-sm text-martial-fg"
                title="Prof: proficiency bonus · Potency: 10 + Prof + Ability"
              >
                Prof +{martialProf} · Potency {martialPotency}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mixed Archetype Milestone Choices — edit mode only */}
      {archetypeType === 'powered-martial' && milestoneLevels.length > 0 && showEditControls && (
        <div className="mb-4 rounded-lg border border-warning-border bg-gradient-to-r from-warning-light to-power-light p-3">
          <SectionHeader title="Milestone Choices" className="mb-2" />
          <div className="flex flex-wrap gap-2">
            {milestoneLevels.map((milestoneLevel) => {
              const currentChoice = archetypeChoices[milestoneLevel];
              return (
                <div key={milestoneLevel} className="flex items-center gap-1">
                  <span className="min-w-[32px] text-xs text-text-muted">Lv.{milestoneLevel}:</span>
                  {onMilestoneChoiceChange ? (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => onMilestoneChoiceChange(milestoneLevel, 'innate')}
                        className={cn(
                          'rounded px-2 py-0.5 text-xs transition-colors',
                          currentChoice === 'innate'
                            ? 'bg-power-dark text-text-on-dark'
                            : 'bg-power-light text-power-fg hover:bg-power-border/30',
                        )}
                        title="Increase Innate Power: Threshold 6→8 (then +1), and +1 Innate Pool"
                      >
                        ✨ Innate
                      </button>
                      <button
                        type="button"
                        onClick={() => onMilestoneChoiceChange(milestoneLevel, 'feat')}
                        className={cn(
                          'rounded px-2 py-0.5 text-xs transition-colors',
                          currentChoice === 'feat'
                            ? 'bg-martial-dark text-text-on-dark'
                            : 'bg-martial-light text-martial-fg hover:bg-martial-border/30',
                        )}
                        title="Gain +1 Bonus Archetype Feat"
                      >
                        🎯 Feat
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-text-muted">
            Mixed archetypes choose at levels 4, 7, 10, etc.: Increase Innate Power (6→8, then +1;
            +1 Pool) OR Additional Feat
          </p>
        </div>
      )}

      {/* Unarmed Prowess Display - show if character has unarmed prowess */}
      {/* Attack Bonuses Table */}
      {character.abilities && (
        <AttackBonusesTable
          abilities={character.abilities}
          martialProf={martialProf}
          powerProf={powerProf}
          powerAbility={character.pow_abil}
          onRollBonus={rollContext?.canRoll !== false ? handleRollBonus : undefined}
        />
      )}

      {/* Weapons Section */}
      <WeaponsSection
        character={character}
        martialProf={martialProf}
        unarmedProwess={unarmedProwess}
        onRollAttack={rollContext?.canRoll !== false ? handleRollBonus : undefined}
        onRollDamage={rollContext?.canRoll !== false ? handleRollDamage : undefined}
        enrichedWeapons={enrichedWeapons}
      />

      {/* Shields Section */}
      <ShieldsSection
        character={character}
        martialProf={martialProf}
        onRollAttack={rollContext?.canRoll !== false ? handleRollBonus : undefined}
        onRollDamage={rollContext?.canRoll !== false ? handleRollDamage : undefined}
        enrichedShields={enrichedShields}
      />

      {/* Armor Section */}
      <ArmorSection character={character} enrichedArmor={enrichedArmor} />
    </Card>
  );
}
