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
  /** Highlighted abilities (e.g., archetype abilities) */
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
        <div className={cn(
          'flex items-center justify-center gap-4 p-3 rounded-xl',
          isOverspent ? 'bg-red-50 border border-red-200' :
          isComplete ? 'bg-green-50 border border-green-200' :
          'bg-neutral-50 border border-neutral-200'
        )}>
          <div className="text-center">
            <span className="text-xs text-text-muted block">Total</span>
            <span className="text-lg font-bold text-text-primary">{totalPoints}</span>
          </div>
          <span className="text-2xl text-neutral-300">−</span>
          <div className="text-center">
            <span className="text-xs text-text-muted block">Spent</span>
            <span className="text-lg font-bold text-text-primary">{spentPoints}</span>
          </div>
          <span className="text-2xl text-neutral-300">=</span>
          <div className="text-center">
            <span className="text-xs text-text-muted block">Remaining</span>
            <span className={cn(
              'text-lg font-bold',
              isOverspent ? 'text-red-600' :
              isComplete ? 'text-green-600' :
              'text-blue-600'
            )}>
              {remainingPoints}
            </span>
          </div>
        </div>
      )}

      {/* Ability Grid */}
      <div className={cn(
        'grid gap-3',
        compact ? 'grid-cols-3 md:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
      )}>
        {ABILITY_ORDER.map((ability) => {
          const value = abilities[ability] || 0;
          const info = ABILITY_INFO[ability];
          const isHighlighted = highlightedAbilities.includes(ability);
          const increaseCost = getIncreaseCost(value, useHighAbilityCost);
          const canInc = canIncrease(ability);
          const canDec = canDecrease(ability);

          return (
            <div
              key={ability}
              className={cn(
                'p-3 rounded-xl border-2 bg-white transition-all',
                isHighlighted 
                  ? 'border-amber-400 bg-amber-50/50' 
                  : 'border-neutral-200',
                !isEditMode && 'opacity-75'
              )}
            >
              <div className="text-center mb-2">
                <h4 className="font-bold text-sm text-text-primary capitalize">
                  {compact ? info.shortName : info.name}
                </h4>
                {isHighlighted && (
                  <span className="text-xs text-amber-600 font-medium">Archetype</span>
                )}
              </div>

              {!compact && (
                <p className="text-xs text-text-muted text-center mb-2 line-clamp-1">
                  {info.description}
                </p>
              )}

              <div className="flex items-center justify-center gap-2">
                {isEditMode && (
                  <button
                    onClick={() => onAbilityChange(ability, value - 1)}
                    disabled={!canDec}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-colors',
                      canDec
                        ? 'bg-neutral-100 hover:bg-neutral-200 text-text-secondary'
                        : 'bg-neutral-50 text-neutral-300 cursor-not-allowed'
                    )}
                  >
                    −
                  </button>
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
                  <button
                    onClick={() => onAbilityChange(ability, value + 1)}
                    disabled={!canInc}
                    title={canInc && increaseCost > 1 ? `Cost: ${increaseCost} points` : undefined}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-colors',
                      canInc
                        ? 'bg-neutral-100 hover:bg-neutral-200 text-text-secondary'
                        : 'bg-neutral-50 text-neutral-300 cursor-not-allowed'
                    )}
                  >
                    +
                  </button>
                )}
              </div>

              {/* Show cost indicator for high values */}
              {isEditMode && useHighAbilityCost && value >= 3 && (
                <p className="text-[10px] text-amber-600 font-medium text-center mt-1">
                  Next: {increaseCost + 1}pt
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
