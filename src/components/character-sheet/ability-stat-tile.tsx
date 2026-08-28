'use client';

import { cn, formatBonus } from '@/lib/utils';
import { useRollsOptional } from '@/components/rolls';
import { RollButton, DecrementButton, IncrementButton, WordHelpTip } from '@/components/patterns';
import { canIncreaseAbility, getAbilityIncreaseCost } from '@/lib/game/formulas';
import { getAbilityHelp } from '../../../public/tooltip-text';
import {
  applyTempModifier,
  getAbilityTempModifier,
  tempModifierValueClass,
} from '@/lib/character/temp-modifiers';
import type { Abilities, AbilityName, CharacterTempModifiers } from '@/types';
import {
  ABILITY_INFO,
  SHEET_STAT_TIP_CLASS,
  SHEET_STAT_TILE_CLASS,
  canDecreaseAbility,
} from '@/components/patterns';

export function AbilityStatTile({
  ability,
  abilities,
  level,
  powerAbility,
  martialAbility,
  tempModifiers,
  showSpendControls,
  showTempControls,
  showEditControls,
  maxAbility,
  abilityRemaining,
  totalAbilityPoints,
  onAbilityChange,
  onTempModifiersChange,
}: {
  ability: AbilityName;
  abilities: Abilities;
  level: number;
  powerAbility?: AbilityName | undefined;
  martialAbility?: AbilityName | undefined;
  tempModifiers?: CharacterTempModifiers | undefined;
  showSpendControls: boolean;
  showTempControls: boolean;
  showEditControls: boolean;
  maxAbility: number;
  abilityRemaining: number;
  totalAbilityPoints?: number | undefined;
  onAbilityChange?: ((ability: AbilityName, value: number) => void) | undefined;
  onTempModifiersChange?: ((patch: CharacterTempModifiers) => void) | undefined;
}) {
  const rollContext = useRollsOptional();
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
      className={cn(
        SHEET_STAT_TILE_CLASS,
        'bg-gradient-to-b from-surface to-surface-alt transition-all',
        isPower
          ? 'border-2 border-power-border'
          : isMartial
            ? 'border-2 border-martial-border'
            : 'border-border-light',
        !showEditControls && 'hover:shadow-md',
      )}
    >
      <WordHelpTip
        content={getAbilityHelp(ability)}
        label={`About ${info.name}`}
        className={SHEET_STAT_TIP_CLASS}
      >
        <span className="w-full min-w-0 text-center break-normal">{info.name}</span>
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
              'min-w-[2.5rem] text-center text-xl leading-none font-bold tabular-nums',
              valueTint || 'text-text-secondary',
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
              'min-w-[2.5rem] text-center text-xl leading-none font-bold tabular-nums',
              tempModifierValueClass(abilityTemp) || 'text-text-secondary',
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
                'text-[10px] leading-none font-medium',
                tempModifierValueClass(abilityTemp),
              )}
            >
              Temp {formatBonus(abilityTemp)}
            </span>
          )}
        </>
      ) : (
        <span
          className={cn(
            'text-xl leading-none font-bold tabular-nums',
            tempModifierValueClass(abilityTemp) || 'text-text-primary',
          )}
        >
          {formatBonus(displayValue)}
        </span>
      )}

      {showSpendControls && cost > 1 && canIncrease && (
        <span className="text-[10px] leading-none font-medium text-warning-fg">
          Next: {cost} Pts
        </span>
      )}
      {showTempControls && abilityTemp !== 0 && (
        <span className="text-[10px] leading-none font-medium text-text-muted">
          Temp {formatBonus(abilityTemp)}
        </span>
      )}
    </div>
  );
}
