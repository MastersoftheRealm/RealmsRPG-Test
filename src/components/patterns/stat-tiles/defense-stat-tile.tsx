'use client';

import { cn, formatBonus } from '@/lib/utils';
import { useRollsOptional } from '@/components/rolls';
import { RollButton } from '../chrome/roll-button';
import { DecrementButton, IncrementButton } from '../select/value-stepper';
import { WordHelpTip } from '../help/info-tippy';
import { DEFENSE_INCREASE_COST } from '@/lib/game/skill-allocation';
import { defenseScoreHelp, getDefenseHelp } from '../../../../public/tooltip-text';
import {
  getAbilityTempModifier,
  getDefenseTempModifier,
  tempModifierValueClass,
} from '@/lib/character/temp-modifiers';
import type { AbilityName, CharacterTempModifiers, DefenseName, DefenseSkills } from '@/types';
import {
  ABILITY_INFO,
  DEFENSE_INFO,
  SHEET_SCORE_TIP_CLASS,
  SHEET_STAT_TIP_CLASS,
  SHEET_STAT_TILE_CLASS,
} from './ability-defense-stat-model';

export function DefenseStatTile({
  ability,
  abilities,
  defenseSkills,
  level,
  tempModifiers,
  showSpendControls,
  showTempControls,
  maxDefenseSkill,
  skillPointsRemaining,
  enforceSkillPointBudget = false,
  defenseIncreaseCost = DEFENSE_INCREASE_COST,
  defenseBonus,
  defenseScore,
  onDefenseChange,
  onTempModifiersChange,
}: {
  ability: AbilityName;
  abilities: { [K in AbilityName]?: number };
  defenseSkills?: DefenseSkills | undefined;
  level: number;
  tempModifiers?: CharacterTempModifiers | undefined;
  showSpendControls: boolean;
  showTempControls: boolean;
  maxDefenseSkill: number;
  skillPointsRemaining: number;
  /** When true, increment requires `skillPointsRemaining >= defenseIncreaseCost`. */
  enforceSkillPointBudget?: boolean | undefined;
  /** Skill points per +1 defense rank (from core rules when available). */
  defenseIncreaseCost?: number | undefined;
  /** Play/temp modes — optional when `showSpendControls` (computed locally). */
  defenseBonus?: number | undefined;
  defenseScore?: number | undefined;
  onDefenseChange?: ((defense: keyof DefenseSkills, value: number) => void) | undefined;
  onTempModifiersChange?: ((patch: CharacterTempModifiers) => void) | undefined;
}) {
  const rollContext = useRollsOptional();
  const info = ABILITY_INFO[ability];
  const defenseKey = info.defenseKey;
  const defenseInfo = DEFENSE_INFO[defenseKey];
  const defenseValue = defenseSkills?.[defenseKey] ?? 0;
  const defenseTemp = getDefenseTempModifier(tempModifiers, defenseKey as DefenseName);
  const abilityTemp = getAbilityTempModifier(tempModifiers, ability);
  const spendDefenseBonus = (abilities[ability] ?? 0) + defenseValue;
  const glanceDefenseScore = showSpendControls ? 10 + spendDefenseBonus : (defenseScore ?? 10);
  const displayDefenseBonus = defenseBonus ?? spendDefenseBonus;
  const netTempDelta = abilityTemp + defenseTemp;
  const canDecreaseDefense = defenseValue > 0;
  const canIncreaseDefense =
    showSpendControls &&
    defenseValue < maxDefenseSkill &&
    (!enforceSkillPointBudget || skillPointsRemaining >= defenseIncreaseCost);

  return (
    <div className={cn(SHEET_STAT_TILE_CLASS, 'border-border-light bg-surface-alt')}>
      <WordHelpTip
        content={getDefenseHelp(defenseKey)}
        label={`About ${defenseInfo.name}`}
        className={SHEET_STAT_TIP_CLASS}
      >
        <span className="w-full min-w-0 text-center break-normal">{defenseInfo.name}</span>
      </WordHelpTip>

      <WordHelpTip
        content={defenseScoreHelp}
        label={`${defenseInfo.name} Defense Score ${glanceDefenseScore}`}
        className={cn(
          SHEET_SCORE_TIP_CLASS,
          showSpendControls
            ? 'text-text-primary'
            : tempModifierValueClass(netTempDelta) || 'text-text-primary',
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
          <span className="min-w-[2rem] text-center text-sm leading-none font-bold text-primary-link-fg tabular-nums">
            {formatBonus(spendDefenseBonus)}
          </span>
          <IncrementButton
            onClick={() => onDefenseChange?.(defenseKey, defenseValue + 1)}
            disabled={!canIncreaseDefense}
            size="sm"
            title={
              canIncreaseDefense
                ? `Cost: ${defenseIncreaseCost} skill points`
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
              'min-w-[2rem] text-center text-sm leading-none font-bold tabular-nums',
              tempModifierValueClass(netTempDelta) || 'text-primary-link-fg',
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
            'text-sm leading-none font-bold tabular-nums',
            tempModifierValueClass(netTempDelta) || 'text-primary-link-fg',
          )}
        >
          {formatBonus(displayDefenseBonus)}
        </span>
      )}

      {showSpendControls && defenseValue > 0 && (
        <span className="text-[10px] leading-none font-medium text-primary-link-fg">
          +{defenseValue} ({defenseValue * defenseIncreaseCost}sp)
        </span>
      )}
      {showTempControls && defenseTemp !== 0 && (
        <span className="text-[10px] leading-none font-medium text-text-muted">
          Temp {formatBonus(defenseTemp)}
        </span>
      )}
    </div>
  );
}
