/**
 * Ability Editor (AbilityScoreEditor)
 * ====================================
 * Shared component for viewing and editing abilities.
 * Used in character creator, character sheet (edit mode), and creature creator.
 *
 * Point Costs:
 * - Increases to +4 and below: 1 point each (0→1 … 3→4)
 * - Increases from +4 to +5 and above: 2 points each (+4 total = 4 pts, +5 = 6, +6 = 8, etc.)
 * - Negative abilities give points back (1 per point)
 *
 * Constraints vary by context:
 * - Character Creator: max +3, min -2, max negative sum -3
 * - Character Sheet: higher max based on level, no negative sum constraint
 * - Creature Creator: max +7, min -4, no negative sum constraint
 */

'use client';

import { useMemo } from 'react';
import { cn, formatBonus } from '@/lib/utils';
import {
  PointStatus,
  DecrementButton,
  IncrementButton,
  AbilityScoreGrid,
  WordHelpTip,
} from '@/components/patterns';
import type { AbilityName, Abilities } from '@/types';
import { calculateAbilityScoreCost, getAbilityIncreaseCost } from '@/lib/game/formulas';
import { getAbilityHelp } from '../../../public/tooltip-text';

export interface AbilityScoreEditorProps {
  /** Current ability values */
  abilities: Abilities;
  /** Total points available for allocation */
  totalPoints: number;
  /** Callback when an ability changes */
  onAbilityChange: (ability: AbilityName, value: number) => void;
  /** Maximum value an ability can be (default: 3) */
  maxAbility?: number | undefined;
  /** Minimum value an ability can be (default: -2) */
  minAbility?: number | undefined;
  /** Maximum total negative sum allowed (default: -3, set to null to disable) */
  maxNegativeSum?: number | null | undefined;
  /** Whether the component is in edit mode (default: true) */
  isEditMode?: boolean | undefined;
  /** Power archetype ability name (for purple highlight) */
  powerAbility?: AbilityName | undefined;
  /** Martial archetype ability name (for red highlight) */
  martialAbility?: AbilityName | undefined;
  /** Path secondary recommended ability (pill when distinct from power/martial) */
  secondaryAbility?: AbilityName | undefined;
  /** DEPRECATED: Use powerAbility/martialAbility instead */
  highlightedAbilities?: AbilityName[] | undefined;
  /** Compact layout - 3 columns with short names (default: false) */
  compact?: boolean | undefined;
  /** Hide the points status bar for custom header (default: false) */
  hidePointsStatus?: boolean | undefined;
  /** Whether high abilities (4+) cost 2 points each (default: true) */
  useHighAbilityCost?: boolean | undefined;
  /** sheet = character-sheet tile row; default = legacy card grid with descriptions */
  variant?: 'default' | 'sheet' | undefined;
}

const ABILITY_ORDER: AbilityName[] = [
  'strength',
  'vitality',
  'agility',
  'acuity',
  'intelligence',
  'charisma',
];

const ABILITY_INFO: Record<AbilityName, { name: string; shortName: string; description: string }> =
  {
    strength: {
      name: 'Strength',
      shortName: 'STR',
      description: 'Physical power and melee damage',
    },
    vitality: { name: 'Vitality', shortName: 'VIT', description: 'Health and endurance' },
    agility: { name: 'Agility', shortName: 'AGI', description: 'Speed, reflexes, and finesse' },
    acuity: { name: 'Acuity', shortName: 'ACU', description: 'Perception and ranged accuracy' },
    intelligence: {
      name: 'Intelligence',
      shortName: 'INT',
      description: 'Knowledge and mental power',
    },
    charisma: { name: 'Charisma', shortName: 'CHA', description: 'Social influence and presence' },
  };

export function AbilityScoreEditor({
  abilities,
  totalPoints,
  onAbilityChange,
  maxAbility = 3,
  minAbility = -2,
  maxNegativeSum = -3,
  isEditMode = true,
  powerAbility,
  martialAbility,
  secondaryAbility,
  highlightedAbilities = [],
  compact = false,
  hidePointsStatus = false,
  useHighAbilityCost = true,
  variant = 'default',
}: AbilityScoreEditorProps) {
  // Calculate points spent (considering high ability cost)
  const spentPoints = useMemo(() => {
    return ABILITY_ORDER.reduce((sum, ability) => {
      const value = abilities[ability] || 0;
      return sum + (useHighAbilityCost ? calculateAbilityScoreCost(value) : value);
    }, 0);
  }, [abilities, useHighAbilityCost]);

  // Calculate negative sum (for constraint checking)
  const negativeSum = useMemo(() => {
    return ABILITY_ORDER.reduce((sum, ability) => {
      const val = abilities[ability] || 0;
      return val < 0 ? sum + val : sum;
    }, 0);
  }, [abilities]);

  const remainingPoints = totalPoints - spentPoints;

  const canIncrease = (ability: AbilityName) => {
    if (!isEditMode) return false;
    const current = abilities[ability] || 0;
    if (current >= maxAbility) return false;
    const cost = useHighAbilityCost ? getAbilityIncreaseCost(current) : 1;
    return remainingPoints >= cost;
  };

  const canDecrease = (ability: AbilityName) => {
    if (!isEditMode) return false;
    const current = abilities[ability] || 0;
    if (current <= minAbility) return false;
    // Check negative sum constraint (if enabled)
    if (maxNegativeSum !== null && current <= 0 && negativeSum <= maxNegativeSum) {
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-4">
      {!hidePointsStatus && (
        <PointStatus total={totalPoints} spent={spentPoints} variant="block" showCalculation />
      )}

      {variant === 'sheet' ? (
        <AbilityScoreGrid
          abilities={abilities}
          powerAbility={powerAbility}
          martialAbility={martialAbility}
          secondaryAbility={secondaryAbility}
          mode={isEditMode ? 'edit' : 'display'}
          onAbilityChange={onAbilityChange}
          canIncrease={canIncrease}
          canDecrease={canDecrease}
          getIncreaseCost={
            isEditMode && useHighAbilityCost
              ? (ability) => getAbilityIncreaseCost(abilities[ability] || 0)
              : undefined
          }
        />
      ) : (
        <div
          className={cn(
            'grid gap-3',
            compact ? 'grid-cols-3 md:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
          )}
        >
          {ABILITY_ORDER.map((ability) => {
            const value = abilities[ability] || 0;
            const info = ABILITY_INFO[ability];
            const isPowerAbility = powerAbility === ability;
            const isMartialAbility = martialAbility === ability;
            const isLegacyHighlight =
              !powerAbility && !martialAbility && highlightedAbilities.includes(ability);
            const increaseCost = useHighAbilityCost ? getAbilityIncreaseCost(value) : 1;
            const canInc = canIncrease(ability);
            const canDec = canDecrease(ability);

            let borderClass = 'border-border-light';
            let bgClass = 'bg-surface';
            if (isPowerAbility) {
              borderClass = 'border-power';
              bgClass = 'bg-power-light/50';
            } else if (isMartialAbility) {
              borderClass = 'border-martial';
              bgClass = 'bg-martial-light/50';
            } else if (isLegacyHighlight) {
              borderClass = 'border-warning-400';
              bgClass = 'bg-warning-50/50 dark:bg-warning-900/20';
            }

            return (
              <div key={ability} className="flex flex-col">
                <div
                  className={cn(
                    'flex-1 rounded-xl border-2 p-3 transition-all',
                    borderClass,
                    bgClass,
                    !isEditMode && 'text-text-muted',
                  )}
                >
                  <div className="mb-2 text-center">
                    <WordHelpTip
                      content={getAbilityHelp(ability)}
                      label={`About ${info.name}`}
                      className="text-sm font-bold text-text-primary capitalize"
                    >
                      {compact ? info.shortName : info.name}
                    </WordHelpTip>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {isEditMode && (
                      <DecrementButton
                        onClick={() => onAbilityChange(ability, value - 1)}
                        disabled={!canDec}
                        size="md"
                      />
                    )}

                    <div
                      className={cn(
                        'min-w-[3rem] text-center text-2xl font-bold',
                        value > 0
                          ? 'text-success-fg'
                          : value < 0
                            ? 'text-danger-fg'
                            : 'text-text-secondary',
                      )}
                    >
                      {formatBonus(value)}
                    </div>

                    {isEditMode && (
                      <IncrementButton
                        onClick={() => onAbilityChange(ability, value + 1)}
                        disabled={!canInc}
                        size="md"
                        title={
                          canInc && increaseCost > 1 ? `Cost: ${increaseCost} points` : undefined
                        }
                      />
                    )}
                  </div>

                  {isEditMode && useHighAbilityCost && (
                    <p
                      className={cn(
                        'mt-1 text-center text-[10px] font-medium',
                        increaseCost > 1 && canInc ? 'text-warning-fg' : 'invisible',
                      )}
                    >
                      Next: {increaseCost} Points
                    </p>
                  )}
                </div>

                {!compact && (
                  <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] px-1 text-center text-xs text-text-muted">
                    {info.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
