/**
 * Ability Score Editor
 * ====================
 * Shared component for viewing and editing ability scores.
 * Used in character creator, character sheet (edit mode), and creature creator.
 * 
 * Point Costs:
 * - Abilities 1-3: 1 point each
 * - Abilities 4+: 2 points each (so +4 costs 5 total, +5 costs 7, +6 costs 9, etc.)
 * - Negative abilities give points back (1 per point)
 * 
 * Constraints vary by context:
 * - Character Creator: max +3, min -2, max negative sum -3
 * - Character Sheet: higher max based on level, no negative sum constraint
 * - Creature Creator: max +7, min -4, no negative sum constraint
 */

'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { PointStatus, DecrementButton, IncrementButton } from '@/components/shared';
import type { AbilityName, Abilities } from '@/types';

export interface AbilityScoreEditorProps {
  /** Current ability scores */
  abilities: Abilities;
  /** Total points available for allocation */
  totalPoints: number;
  /** Callback when an ability changes */
  onAbilityChange: (ability: AbilityName, value: number) => void;
  /** Maximum value an ability can be (default: 3) */
  maxAbility?: number;
  /** Minimum value an ability can be (default: -2) */
  minAbility?: number;
  /** Maximum total negative sum allowed (default: -3, set to null to disable) */
  maxNegativeSum?: number | null;
  /** Whether the component is in edit mode (default: true) */
  isEditMode?: boolean;
  /** Power archetype ability name (for purple highlight) */
  powerAbility?: AbilityName;
  /** Martial archetype ability name (for red highlight) */
  martialAbility?: AbilityName;
  /** DEPRECATED: Use powerAbility/martialAbility instead */
  highlightedAbilities?: AbilityName[];
  /** Compact layout - 3 columns with short names (default: false) */
  compact?: boolean;
  /** Hide the points status bar for custom header (default: false) */
  hidePointsStatus?: boolean;
  /** Whether high abilities (4+) cost 2 points each (default: true) */
  useHighAbilityCost?: boolean;
}

const ABILITY_ORDER: AbilityName[] = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];

const ABILITY_INFO: Record<AbilityName, { name: string; shortName: string; description: string }> = {
  strength: { name: 'Strength', shortName: 'STR', description: 'Physical power and melee damage' },
  vitality: { name: 'Vitality', shortName: 'VIT', description: 'Health and endurance' },
  agility: { name: 'Agility', shortName: 'AGI', description: 'Speed, reflexes, and finesse' },
  acuity: { name: 'Acuity', shortName: 'ACU', description: 'Perception and ranged accuracy' },
  intelligence: { name: 'Intelligence', shortName: 'INT', description: 'Knowledge and mental power' },
  charisma: { name: 'Charisma', shortName: 'CHA', description: 'Social influence and presence' },
};

function formatBonus(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

/**
 * Calculate total point cost for an ability value.
 * 1-3 cost 1 point each, 4+ cost 2 points each.
 * Negative values give points back (1 per point).
 */
function calculateAbilityCost(value: number, useHighCost: boolean): number {
  if (value <= 0) return value; // Negative = gives points back
  if (!useHighCost) return value; // Simple mode: 1 point per value
  
  // 1-3: 1 point each = 1, 2, 3
  // 4+: 2 points each = 3 + 2*(value-3)
  if (value <= 3) return value;
  return 3 + 2 * (value - 3); // 4=5, 5=7, 6=9, 7=11, etc.
}

/**
 * Calculate the cost to increase an ability by 1.
 */
function getIncreaseCost(currentValue: number, useHighCost: boolean): number {
  if (!useHighCost) return 1;
  return currentValue >= 3 ? 2 : 1;
}

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
  highlightedAbilities = [],
  compact = false,
  hidePointsStatus = false,
  useHighAbilityCost = true,
}: AbilityScoreEditorProps) {
  // Calculate points spent (considering high ability cost)
  const spentPoints = useMemo(() => {
    return ABILITY_ORDER.reduce((sum, ability) => {
      const value = abilities[ability] || 0;
      return sum + calculateAbilityCost(value, useHighAbilityCost);
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
  const isOverspent = remainingPoints < 0;
  const isComplete = remainingPoints === 0;

  const canIncrease = (ability: AbilityName) => {
    if (!isEditMode) return false;
    const current = abilities[ability] || 0;
    if (current >= maxAbility) return false;
    const cost = getIncreaseCost(current, useHighAbilityCost);
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
      {/* Points Status - can be hidden for custom headers */}
      {!hidePointsStatus && (
        <PointStatus
          total={totalPoints}
          spent={spentPoints}
          variant="block"
          showCalculation
        />
      )}

      {/* Ability Grid */}
      <div className={cn(
        'grid gap-3',
        compact ? 'grid-cols-3 md:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
      )}>
        {ABILITY_ORDER.map((ability) => {
          const value = abilities[ability] || 0;
          const info = ABILITY_INFO[ability];
          const isPowerAbility = powerAbility === ability;
          const isMartialAbility = martialAbility === ability;
          // Fallback for deprecated highlightedAbilities prop
          const isLegacyHighlight = !powerAbility && !martialAbility && highlightedAbilities.includes(ability);
          const increaseCost = getIncreaseCost(value, useHighAbilityCost);
          const canInc = canIncrease(ability);
          const canDec = canDecrease(ability);

          // Determine border/highlight color
          let borderClass = 'border-border-light';
          let bgClass = 'bg-surface';
          if (isPowerAbility) {
            borderClass = 'border-power';
            bgClass = 'bg-power-light/50';
          } else if (isMartialAbility) {
            borderClass = 'border-martial';
            bgClass = 'bg-martial-light/50';
          } else if (isLegacyHighlight) {
            borderClass = 'border-amber-400';
            bgClass = 'bg-amber-50/50';
          }

          return (
            <div
              key={ability}
              className="flex flex-col"
            >
              {/* Ability Card */}
              <div
                className={cn(
                  'p-3 rounded-xl border-2 transition-all flex-1',
                  borderClass,
                  bgClass,
                  !isEditMode && 'opacity-75'
                )}
              >
                <div className="text-center mb-2">
                  <h4 className="font-bold text-sm text-text-primary capitalize">
                    {compact ? info.shortName : info.name}
                  </h4>
                </div>

                <div className="flex items-center justify-center gap-2">
                  {isEditMode && (
                    <DecrementButton
                      onClick={() => onAbilityChange(ability, value - 1)}
                      disabled={!canDec}
                      size="md"
                      // No enableHoldRepeat - abilities should be clicked individually
                    />
                  )}

                  <div className={cn(
                    'text-2xl font-bold min-w-[3rem] text-center',
                    value > 0 ? 'text-success-600' :
                    value < 0 ? 'text-danger-600' :
                    'text-text-secondary'
                  )}>
                    {formatBonus(value)}
                  </div>

                  {isEditMode && (
                    <IncrementButton
                      onClick={() => onAbilityChange(ability, value + 1)}
                      disabled={!canInc}
                      size="md"
                      title={canInc && increaseCost > 1 ? `Cost: ${increaseCost} points` : undefined}
                      // No enableHoldRepeat - abilities should be clicked individually
                    />
                  )}
                </div>

                {/* Show cost indicator for high values only if more can be added */}
                {isEditMode && useHighAbilityCost && value >= 3 && canInc && (
                  <p className="text-[10px] text-amber-600 font-medium text-center mt-1">
                    Next: {increaseCost + 1}pt
                  </p>
                )}
              </div>
              
              {/* Description below card (not in compact mode) */}
              {!compact && (
                <p className="text-xs text-text-muted text-center mt-1.5 px-1 line-clamp-2">
                  {info.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
