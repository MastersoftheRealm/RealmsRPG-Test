/**
 * Abilities Section
 * =================
 * Displays the six core abilities in a row with clickable roll buttons,
 * followed by a separate defenses row with defense scores and roll buttons.
 *
 * // DESIGN_INTENT: Dense like sheet-header LargeStatBlock — label glued to value,
 * content-height tiles (no equal-height empty cards). Ability play = RollButton;
 * defense glance = Score, play = smaller bonus RollButton.
 * Dual affordance: pencil = rules spend; SlidersHorizontal = Temp Modifier (ADR-0006).
 */

'use client';

import { useMemo, useState } from 'react';
import { cn, formatBonus } from '@/lib/utils';
import { useRollsOptional } from '@/components/rolls';
import {
  RollButton,
  PointStatus,
  DecrementButton,
  IncrementButton,
  WordHelpTip,
  SectionDualModeToggles,
  type SectionEditMode,
} from '@/components/shared';
import { Card } from '@/components/ui';
import { DEFENSE_INCREASE_COST } from '@/lib/game/skill-allocation';
import { calculateAbilityScoreCost, canIncreaseAbility, getAbilityIncreaseCost } from '@/lib/game/formulas';
import { defenseScoreHelp, getAbilityHelp, getDefenseHelp } from '../../../public/tooltip-text';
import {
  applyTempModifier,
  getAbilityTempModifier,
  getDefenseTempModifier,
  getEffectiveAbilities,
  sectionHasTempModifiers,
  tempModifierValueClass,
} from '@/lib/character/temp-modifiers';
import type { Abilities, AbilityName, CharacterTempModifiers, DefenseName, DefenseSkills } from '@/types';

// =============================================================================
// Types
// =============================================================================

interface AbilitiesSectionProps {
  abilities: Abilities;
  defenseSkills?: DefenseSkills;
  level: number;
  archetypeAbility?: AbilityName;
  martialAbility?: AbilityName;
  powerAbility?: AbilityName;
  isEditMode?: boolean;
  totalAbilityPoints?: number;
  spentAbilityPoints?: number;
  totalSkillPoints?: number;
  spentSkillPoints?: number;
  tempModifiers?: CharacterTempModifiers;
  onTempModifiersChange?: (patch: CharacterTempModifiers) => void;
  onAbilityChange?: (ability: AbilityName, value: number) => void;
  onDefenseChange?: (defense: keyof DefenseSkills, value: number) => void;
}

// =============================================================================
// Constants
// =============================================================================

const ABILITY_ORDER: AbilityName[] = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];

/** Sheet tip touch: hug on desktop; 44px below md (overrides WordHelpTip default min size). */
const SHEET_TIP_TOUCH_CLASS =
  'min-h-0 min-w-0 max-md:min-h-[var(--touch-target-min,44px)] max-md:min-w-[var(--touch-target-min,44px)]';

/** Sheet tip: defense/ability name labels. */
const SHEET_STAT_TIP_CLASS = cn(
  'text-sm font-semibold uppercase tracking-wide text-text-secondary text-center leading-none px-0.5',
  SHEET_TIP_TOUCH_CLASS
);

/** Defense Score value tip — keep large glance number. */
const SHEET_SCORE_TIP_CLASS = cn(
  'text-2xl font-bold leading-none tabular-nums',
  SHEET_TIP_TOUCH_CLASS
);

/** Shared tile chrome — breathing room without tall empty cards. */
const SHEET_STAT_TILE_CLASS =
  'flex flex-col items-center justify-center gap-2 px-2.5 py-3 rounded-xl border';

const ABILITY_INFO: Record<AbilityName, { name: string; shortName: string; defenseKey: keyof DefenseSkills }> = {
  strength: { name: 'Strength', shortName: 'STR', defenseKey: 'might' },
  vitality: { name: 'Vitality', shortName: 'VIT', defenseKey: 'fortitude' },
  agility: { name: 'Agility', shortName: 'AGI', defenseKey: 'reflex' },
  acuity: { name: 'Acuity', shortName: 'ACU', defenseKey: 'discernment' },
  intelligence: { name: 'Intelligence', shortName: 'INT', defenseKey: 'mentalFortitude' },
  charisma: { name: 'Charisma', shortName: 'CHA', defenseKey: 'resolve' },
};

const DEFENSE_INFO: Record<keyof DefenseSkills, { name: string; shortName: string }> = {
  might: { name: 'Might', shortName: 'MGT' },
  fortitude: { name: 'Fortitude', shortName: 'FOR' },
  reflex: { name: 'Reflex', shortName: 'REF' },
  discernment: { name: 'Discernment', shortName: 'DIS' },
  mentalFortitude: { name: 'Mental Fort.', shortName: 'MNT' },
  resolve: { name: 'Resolve', shortName: 'RES' },
};

// Ability constraints
const ABILITY_CONSTRAINTS = {
  /** Level-1 creation minimum; sheet editing can go lower for effects. */
  MIN_ABILITY: -2,
  /** Floor when editing on character sheet (effects may reduce below -2). */
  MIN_ABILITY_SHEET_EDIT: -10,
  MAX_NEGATIVE_SUM: -3,
  getMaxAbility: (level: number): number => {
    if (level <= 1) return 3;
    if (level <= 3) return 4;
    if (level <= 6) return 5;
    if (level <= 9) return 6;
    if (level <= 12) return 7;
    if (level <= 15) return 8;
    return 9;
  },
  getMaxDefenseSkill: (level: number): number => level,
};

// =============================================================================
// Helper Functions
// =============================================================================

function canDecreaseAbility(abilities: Abilities, abilityName: AbilityName): boolean {
  const currentValue = abilities[abilityName] ?? 0;
  const newValue = currentValue - 1;

  // Sheet editing: allow down to MIN_ABILITY_SHEET_EDIT so effects can reduce below level-1 minimum (-2)
  if (newValue < ABILITY_CONSTRAINTS.MIN_ABILITY_SHEET_EDIT) return false;

  // When going below creation minimum (-2), only enforce the sheet floor; skip negative-sum rule
  if (newValue < ABILITY_CONSTRAINTS.MIN_ABILITY) return true;

  // Check negative sum constraint (creation rule for values >= -2)
  if (newValue < 0) {
    const currentNegSum = Object.values(abilities)
      .filter((v): v is number => typeof v === 'number' && v < 0)
      .reduce((sum, v) => sum + v, 0);

    let newNegSum: number;
    if (currentValue < 0) {
      newNegSum = currentNegSum - 1;
    } else {
      newNegSum = currentNegSum + newValue;
    }

    if (newNegSum < ABILITY_CONSTRAINTS.MAX_NEGATIVE_SUM) return false;
  }

  return true;
}

// =============================================================================
// Main Component
// =============================================================================

export function AbilitiesSection({
  abilities,
  defenseSkills,
  level,
  martialAbility,
  powerAbility,
  isEditMode = false,
  totalAbilityPoints,
  spentAbilityPoints,
  totalSkillPoints,
  spentSkillPoints,
  tempModifiers,
  onTempModifiersChange,
  onAbilityChange,
  onDefenseChange,
}: AbilitiesSectionProps) {
  const rollContext = useRollsOptional();

  const [sectionMode, setSectionMode] = useState<SectionEditMode>('none');

  const showSpendControls = isEditMode && sectionMode === 'spend';
  const showTempControls = isEditMode && sectionMode === 'tempModifier';
  const showEditControls = showSpendControls || showTempControls;

  const effectiveAbilities = useMemo(
    () => getEffectiveAbilities(abilities, tempModifiers),
    [abilities, tempModifiers]
  );

  // Calculate ability points spent (base allocation only — temps are not spend)
  const calculatedSpentAbilityPoints = useMemo(() => {
    return ABILITY_ORDER.reduce(
      (sum, ability) => sum + calculateAbilityScoreCost(abilities[ability] ?? 0),
      0
    );
  }, [abilities]);

  const getDefenseValue = (defenseKey: keyof DefenseSkills): number => {
    return defenseSkills?.[defenseKey] ?? 0;
  };

  const getDefenseBonus = (ability: AbilityName, useEffective: boolean): number => {
    const abilityValue = (useEffective ? effectiveAbilities : abilities)[ability] ?? 0;
    const defenseKey = ABILITY_INFO[ability].defenseKey;
    const defenseValue = getDefenseValue(defenseKey);
    const defenseTemp = getDefenseTempModifier(tempModifiers, defenseKey as DefenseName);
    return abilityValue + defenseValue + defenseTemp;
  };

  const getDefenseScore = (ability: AbilityName, useEffective: boolean): number => {
    return 10 + getDefenseBonus(ability, useEffective);
  };

  const maxAbility = ABILITY_CONSTRAINTS.getMaxAbility(level);
  const maxDefenseSkill = ABILITY_CONSTRAINTS.getMaxDefenseSkill(level);

  const abilityRemaining = totalAbilityPoints !== undefined
    ? totalAbilityPoints - (spentAbilityPoints ?? calculatedSpentAbilityPoints)
    : 0;
  const skillPointsRemaining = totalSkillPoints !== undefined
    ? totalSkillPoints - (spentSkillPoints ?? 0)
    : 0;
  const abilityEditState =
    totalAbilityPoints !== undefined || totalSkillPoints !== undefined
      ? (abilityRemaining < 0 || skillPointsRemaining < 0
          ? 'over-budget'
          : (abilityRemaining > 0 || skillPointsRemaining > 0 ? 'has-points' : 'normal'))
      : 'normal';

  const hasSectionTemps = sectionHasTempModifiers(tempModifiers, 'abilities');
  const applyToResourceMaxima = tempModifiers?.applyAbilityToResourceMaxima === true;

  return (
    <Card className="shadow-md p-4 md:p-6 mb-4 relative">
      {isEditMode && (
        <div className="absolute top-3 right-3">
          <SectionDualModeToggles
            mode={sectionMode}
            onModeChange={setSectionMode}
            spendState={abilityEditState}
            hasTempModifiers={hasSectionTemps}
            spendTitle={
              abilityEditState === 'has-points'
                ? 'Edit — spend ability/defense points'
                : abilityEditState === 'over-budget'
                  ? 'Edit — over budget, remove points'
                  : 'Edit abilities & defenses'
            }
          />
        </div>
      )}

      {showSpendControls && (
        <div className="flex flex-col items-center gap-2 mb-4 p-3 bg-surface-secondary rounded-lg">
          <div className="flex flex-wrap justify-center gap-4">
            {totalAbilityPoints !== undefined && (
              <PointStatus
                label="Ability Points"
                spent={spentAbilityPoints ?? calculatedSpentAbilityPoints}
                total={totalAbilityPoints}
                variant="inline"
              />
            )}
            {totalSkillPoints !== undefined && (
              <PointStatus
                label="Skill Points (Defenses)"
                spent={spentSkillPoints ?? 0}
                total={totalSkillPoints}
                variant="inline"
              />
            )}
          </div>
          <div className="text-xs text-text-muted dark:text-text-secondary">
            Max ability: +{maxAbility} | Defense: {DEFENSE_INCREASE_COST}sp per +1 (max +{maxDefenseSkill})
          </div>
        </div>
      )}

      {showTempControls && (
        <div className="flex flex-col items-center gap-2 mb-4 p-3 bg-surface-secondary rounded-lg">
          <p className="text-xs text-text-secondary text-center">
            Temp Modifier — layered Bonus/Penalty (does not spend points). Values tint gold or danger.
          </p>
          <label className="inline-flex items-center gap-2 text-xs text-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={applyToResourceMaxima}
              onChange={(e) =>
                onTempModifiersChange?.({
                  applyAbilityToResourceMaxima: e.target.checked,
                })
              }
              className="rounded border-border"
              aria-describedby="ability-temp-resource-maxima-help"
            />
            <span>Apply ability temps to max Health / Energy / TP</span>
          </label>
          <p id="ability-temp-resource-maxima-help" className="text-[10px] text-text-muted dark:text-text-secondary text-center">
            Default off. When on, ability Temp Modifiers also adjust resource maxima.
          </p>
        </div>
      )}

      {/* Abilities — label + roll; equal gap + tile padding (not squashed, not empty) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 md:gap-3 mb-4">
        {ABILITY_ORDER.map((ability) => {
          const baseValue = abilities[ability] ?? 0;
          const abilityTemp = getAbilityTempModifier(tempModifiers, ability);
          const displayValue = applyTempModifier(baseValue, abilityTemp);
          const info = ABILITY_INFO[ability];
          const isPower = powerAbility?.toLowerCase() === ability;
          const isMartial = martialAbility?.toLowerCase() === ability;
          const cost = getAbilityIncreaseCost(baseValue);
          const canIncrease =
            showSpendControls &&
            baseValue < maxAbility &&
            (totalAbilityPoints === undefined ||
              canIncreaseAbility(baseValue, abilityRemaining, false, false));
          const canDecrease = canDecreaseAbility(abilities, ability);
          const valueTint =
            tempModifierValueClass(abilityTemp) ||
            (showSpendControls
              ? baseValue > 0
                ? 'text-success-fg'
                : baseValue < 0
                  ? 'text-danger-fg'
                  : 'text-text-secondary'
              : '');

          return (
            <div
              key={ability}
              className={cn(
                SHEET_STAT_TILE_CLASS,
                'bg-gradient-to-b from-surface to-surface-alt transition-all',
                isPower ? 'border-power-border border-2' : isMartial ? 'border-martial-border border-2' : 'border-border-light',
                !showEditControls && 'hover:shadow-md'
              )}
            >
              <WordHelpTip
                content={getAbilityHelp(ability)}
                label={`About ${info.name}`}
                className={SHEET_STAT_TIP_CLASS}
              >
                {info.name}
              </WordHelpTip>

              {showSpendControls ? (
                <div className="flex items-center gap-0.5">
                  <DecrementButton
                    onClick={() => onAbilityChange?.(ability, baseValue - 1)}
                    disabled={!canDecrease}
                    size="sm"
                  />
                  <span
                    className={cn(
                      'text-xl font-bold min-w-[2.5rem] text-center tabular-nums leading-none',
                      valueTint || 'text-text-secondary'
                    )}
                  >
                    {formatBonus(baseValue)}
                  </span>
                  <IncrementButton
                    onClick={() => onAbilityChange?.(ability, baseValue + 1)}
                    disabled={!canIncrease}
                    size="sm"
                    title={
                      canIncrease
                        ? `Cost: ${cost} point${cost > 1 ? 's' : ''}`
                        : baseValue >= maxAbility
                          ? `Max at level ${level}`
                          : 'Not enough ability points'
                    }
                  />
                </div>
              ) : showTempControls ? (
                <div className="flex items-center gap-0.5">
                  <DecrementButton
                    onClick={() =>
                      onTempModifiersChange?.({
                        abilities: { [ability]: abilityTemp - 1 },
                      })
                    }
                    size="sm"
                    title={`Decrease ${info.name} Temp Modifier`}
                  />
                  <span
                    className={cn(
                      'text-xl font-bold min-w-[2.5rem] text-center tabular-nums leading-none',
                      tempModifierValueClass(abilityTemp) || 'text-text-secondary'
                    )}
                  >
                    {formatBonus(displayValue)}
                  </span>
                  <IncrementButton
                    onClick={() =>
                      onTempModifiersChange?.({
                        abilities: { [ability]: abilityTemp + 1 },
                      })
                    }
                    size="sm"
                    title={`Increase ${info.name} Temp Modifier`}
                  />
                </div>
              ) : rollContext?.canRoll !== false ? (
                <>
                  <RollButton
                    value={displayValue}
                    onClick={() => rollContext?.rollAbility?.(ability, displayValue)}
                    size="md"
                    title={`Roll ${info.name}`}
                  />
                  {abilityTemp !== 0 && (
                    <span
                      className={cn(
                        'text-[10px] font-medium leading-none',
                        tempModifierValueClass(abilityTemp)
                      )}
                    >
                      Temp {formatBonus(abilityTemp)}
                    </span>
                  )}
                </>
              ) : (
                <span
                  className={cn(
                    'text-xl font-bold tabular-nums leading-none',
                    tempModifierValueClass(abilityTemp) || 'text-text-primary'
                  )}
                >
                  {formatBonus(displayValue)}
                </span>
              )}

              {showSpendControls && cost > 1 && canIncrease && (
                <span className="text-[10px] text-warning-fg font-medium leading-none">
                  Next: {cost} Pts
                </span>
              )}
              {showTempControls && abilityTemp !== 0 && (
                <span className="text-[10px] text-text-muted dark:text-text-secondary font-medium leading-none">
                  Temp {formatBonus(abilityTemp)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Defenses — Score glance + roll; same tip/tile rhythm as abilities */}
      <div className="border-t border-border-light pt-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 md:gap-3">
          {ABILITY_ORDER.map((ability) => {
            const info = ABILITY_INFO[ability];
            const defenseKey = info.defenseKey;
            const defenseInfo = DEFENSE_INFO[defenseKey];
            const defenseValue = getDefenseValue(defenseKey);
            const defenseTemp = getDefenseTempModifier(tempModifiers, defenseKey as DefenseName);
            const abilityTemp = getAbilityTempModifier(tempModifiers, ability);
            const displayDefenseBonus = getDefenseBonus(ability, true);
            const displayDefenseScore = getDefenseScore(ability, true);
            const spendDefenseBonus = (abilities[ability] ?? 0) + defenseValue;
            const glanceDefenseScore = showSpendControls
              ? 10 + spendDefenseBonus
              : displayDefenseScore;
            const netTempDelta = abilityTemp + defenseTemp;
            const canDecreaseDefense = defenseValue > 0;
            const canIncreaseDefense =
              showSpendControls &&
              defenseValue < maxDefenseSkill &&
              (totalSkillPoints === undefined || skillPointsRemaining >= DEFENSE_INCREASE_COST);

            return (
              <div
                key={defenseKey}
                className={cn(SHEET_STAT_TILE_CLASS, 'bg-surface-alt border-border-light')}
              >
                <WordHelpTip
                  content={getDefenseHelp(defenseKey)}
                  label={`About ${defenseInfo.name}`}
                  className={SHEET_STAT_TIP_CLASS}
                >
                  {defenseInfo.name}
                </WordHelpTip>

                <WordHelpTip
                  content={defenseScoreHelp}
                  label={`${defenseInfo.name} Defense Score ${glanceDefenseScore}`}
                  className={cn(
                    SHEET_SCORE_TIP_CLASS,
                    showSpendControls
                      ? 'text-text-primary'
                      : tempModifierValueClass(netTempDelta) || 'text-text-primary'
                  )}
                >
                  {glanceDefenseScore}
                </WordHelpTip>

                {showSpendControls ? (
                  <div className="flex items-center gap-0.5">
                    <DecrementButton
                      onClick={() => onDefenseChange?.(defenseKey, Math.max(0, defenseValue - 1))}
                      disabled={!canDecreaseDefense}
                      size="sm"
                    />
                    <span className="text-sm font-bold min-w-[2rem] text-center text-primary-link-fg tabular-nums leading-none">
                      {formatBonus(spendDefenseBonus)}
                    </span>
                    <IncrementButton
                      onClick={() => onDefenseChange?.(defenseKey, defenseValue + 1)}
                      disabled={!canIncreaseDefense}
                      size="sm"
                      title={
                        canIncreaseDefense
                          ? `Cost: ${DEFENSE_INCREASE_COST} skill points`
                          : defenseValue >= maxDefenseSkill
                            ? `Max defense rank at level ${level}`
                            : 'Not enough skill points'
                      }
                    />
                  </div>
                ) : showTempControls ? (
                  <div className="flex items-center gap-0.5">
                    <DecrementButton
                      onClick={() =>
                        onTempModifiersChange?.({
                          defenses: { [defenseKey]: defenseTemp - 1 },
                        })
                      }
                      size="sm"
                      title={`Decrease ${defenseInfo.name} Temp Modifier`}
                    />
                    <span
                      className={cn(
                        'text-sm font-bold min-w-[2rem] text-center tabular-nums leading-none',
                        tempModifierValueClass(netTempDelta) || 'text-primary-link-fg'
                      )}
                    >
                      {formatBonus(displayDefenseBonus)}
                    </span>
                    <IncrementButton
                      onClick={() =>
                        onTempModifiersChange?.({
                          defenses: { [defenseKey]: defenseTemp + 1 },
                        })
                      }
                      size="sm"
                      title={`Increase ${defenseInfo.name} Temp Modifier`}
                    />
                  </div>
                ) : rollContext?.canRoll !== false ? (
                  <RollButton
                    value={displayDefenseBonus}
                    variant="primary"
                    onClick={() => rollContext?.rollDefense?.(defenseInfo.name, displayDefenseBonus)}
                    size="sm"
                    title={`Roll ${defenseInfo.name}`}
                  />
                ) : (
                  <span
                    className={cn(
                      'text-sm font-bold tabular-nums leading-none',
                      tempModifierValueClass(netTempDelta) || 'text-primary-link-fg'
                    )}
                  >
                    {formatBonus(displayDefenseBonus)}
                  </span>
                )}

                {showSpendControls && defenseValue > 0 && (
                  <span className="text-[10px] text-primary-link-fg font-medium leading-none">
                    +{defenseValue} ({defenseValue * DEFENSE_INCREASE_COST}sp)
                  </span>
                )}
                {showTempControls && defenseTemp !== 0 && (
                  <span className="text-[10px] text-text-muted dark:text-text-secondary font-medium leading-none">
                    Temp {formatBonus(defenseTemp)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
