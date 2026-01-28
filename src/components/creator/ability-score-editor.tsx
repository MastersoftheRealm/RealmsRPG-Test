/**
 * Ability Score Editor
 * ====================
 * Shared component for viewing and editing ability scores.
 * Used in character creator, character sheet, and creature creator.
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
  /** Maximum value an ability can be (default: 3, scales with level) */
  maxAbility?: number;
  /** Minimum value an ability can be (default: -2) */
  minAbility?: number;
  /** Maximum total negative sum allowed (default: -3) */
  maxNegativeSum?: number;
  /** Whether the component is in edit mode */
  isEditMode?: boolean;
  /** Highlighted abilities (e.g., archetype abilities) */
  highlightedAbilities?: AbilityName[];
  /** Compact layout for smaller spaces */
  compact?: boolean;
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
}: AbilityScoreEditorProps) {
  // Calculate points spent (sum of all ability values)
  const spentPoints = useMemo(() => {
    return ABILITY_ORDER.reduce((sum, ability) => sum + (abilities[ability] || 0), 0);
  }, [abilities]);

  // Calculate negative sum
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
    const current = abilities[ability] || 0;
    return isEditMode && current < maxAbility && remainingPoints > 0;
  };

  const canDecrease = (ability: AbilityName) => {
    const current = abilities[ability] || 0;
    if (!isEditMode) return false;
    if (current <= minAbility) return false;
    // Check negative sum constraint
    if (current <= 0 && negativeSum <= maxNegativeSum) return false;
    return true;
  };

  return (
    <div className="space-y-4">
      {/* Points Status */}
      <div className={cn(
        'flex items-center justify-center gap-4 p-3 rounded-xl',
        isOverspent ? 'bg-danger-light border border-danger-300' :
        isComplete ? 'bg-success-light border border-success-300' :
        'bg-surface-secondary border border-neutral-200'
      )}>
        <div className="text-center">
          <span className="text-xs text-tertiary block">Total</span>
          <span className="text-lg font-bold text-primary">{totalPoints}</span>
        </div>
        <span className="text-2xl text-tertiary">−</span>
        <div className="text-center">
          <span className="text-xs text-tertiary block">Spent</span>
          <span className="text-lg font-bold text-primary">{spentPoints}</span>
        </div>
        <span className="text-2xl text-tertiary">=</span>
        <div className="text-center">
          <span className="text-xs text-tertiary block">Remaining</span>
          <span className={cn(
            'text-lg font-bold',
            isOverspent ? 'text-danger-600' :
            isComplete ? 'text-success-600' :
            'text-info-600'
          )}>
            {remainingPoints}
          </span>
        </div>
      </div>

      {/* Ability Grid */}
      <div className={cn(
        'grid gap-3',
        compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
      )}>
        {ABILITY_ORDER.map((ability) => {
          const value = abilities[ability] || 0;
          const info = ABILITY_INFO[ability];
          const isHighlighted = highlightedAbilities.includes(ability);

          return (
            <div
              key={ability}
              className={cn(
                'p-3 rounded-xl border-2 bg-surface transition-all',
                isHighlighted 
                  ? 'border-warning-400 bg-warning-light/30' 
                  : 'border-neutral-200',
                !isEditMode && 'opacity-75'
              )}
            >
              <div className="text-center mb-2">
                <h4 className="font-bold text-sm text-primary">
                  {compact ? info.shortName : info.name}
                </h4>
                {isHighlighted && (
                  <span className="text-xs text-warning-600 font-medium">Archetype</span>
                )}
              </div>

              {!compact && (
                <p className="text-xs text-tertiary text-center mb-2 line-clamp-1">
                  {info.description}
                </p>
              )}

              <div className="flex items-center justify-center gap-2">
                {isEditMode && (
                  <button
                    onClick={() => onAbilityChange(ability, value - 1)}
                    disabled={!canDecrease(ability)}
                    className="btn-stepper btn-stepper-danger"
                  >
                    −
                  </button>
                )}

                <div className={cn(
                  'text-2xl font-bold min-w-[3rem] text-center',
                  value > 0 ? 'text-success-600' :
                  value < 0 ? 'text-danger-600' :
                  'text-secondary'
                )}>
                  {formatBonus(value)}
                </div>

                {isEditMode && (
                  <button
                    onClick={() => onAbilityChange(ability, value + 1)}
                    disabled={!canIncrease(ability)}
                    className="btn-stepper btn-stepper-success"
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
