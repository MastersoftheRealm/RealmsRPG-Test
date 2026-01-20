/**
 * Abilities Section
 * =================
 * Displays and manages the six core ability scores and defenses
 * - Clicking an ability in view mode rolls a d20 + modifier
 * - Edit mode shows +/- with point costs (2 pts for 4+)
 * - Includes defense value editing with 2 skill points per point
 * - Enforces constraints: min -2, max by level, negative sum limit -3
 */

'use client';

import { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useRollsOptional } from './roll-context';
import type { Abilities, AbilityName, DefenseSkills } from '@/types';

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
  // Point tracking (optional - component can calculate defaults if needed)
  totalAbilityPoints?: number;
  spentAbilityPoints?: number;
  totalSkillPoints?: number;
  spentSkillPoints?: number;
  // Handlers
  onAbilityChange?: (ability: AbilityName, value: number) => void;
  onDefenseChange?: (defense: keyof DefenseSkills, value: number) => void;
}

// =============================================================================
// Constants
// =============================================================================

const ABILITY_INFO: Record<AbilityName, { name: string; shortName: string; defenseKey: keyof DefenseSkills }> = {
  strength: { name: 'Strength', shortName: 'STR', defenseKey: 'might' },
  vitality: { name: 'Vitality', shortName: 'VIT', defenseKey: 'fortitude' },
  agility: { name: 'Agility', shortName: 'AGI', defenseKey: 'reflex' },
  acuity: { name: 'Acuity', shortName: 'ACU', defenseKey: 'discernment' },
  intelligence: { name: 'Intelligence', shortName: 'INT', defenseKey: 'mentalFortitude' },
  charisma: { name: 'Charisma', shortName: 'CHA', defenseKey: 'resolve' },
};

const DEFENSE_INFO: Record<keyof DefenseSkills, { name: string; shortName: string; ability: AbilityName }> = {
  might: { name: 'Might', shortName: 'MGT', ability: 'strength' },
  fortitude: { name: 'Fortitude', shortName: 'FOR', ability: 'vitality' },
  reflex: { name: 'Reflex', shortName: 'REF', ability: 'agility' },
  discernment: { name: 'Discernment', shortName: 'DIS', ability: 'acuity' },
  mentalFortitude: { name: 'Mental Fort', shortName: 'MNT', ability: 'intelligence' },
  resolve: { name: 'Resolve', shortName: 'RES', ability: 'charisma' },
};

const ABILITY_ORDER: AbilityName[] = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];
const DEFENSE_ORDER: (keyof DefenseSkills)[] = ['might', 'fortitude', 'reflex', 'discernment', 'mentalFortitude', 'resolve'];

// Ability constraints matching vanilla site
const ABILITY_CONSTRAINTS = {
  MIN_ABILITY: -2,
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
};

// =============================================================================
// Helper Functions
// =============================================================================

function getAbilityIncreaseCost(currentValue: number): number {
  return currentValue >= 4 ? 2 : 1;
}

function getAbilityDecreaseRefund(currentValue: number): number {
  return currentValue > 4 ? 2 : 1;
}

function canDecreaseAbility(
  abilities: Abilities,
  abilityName: AbilityName
): { canDecrease: boolean; refund: number; reason: string | null } {
  const currentValue = abilities[abilityName] ?? 0;
  const newValue = currentValue - 1;
  const refund = getAbilityDecreaseRefund(currentValue);

  if (newValue < ABILITY_CONSTRAINTS.MIN_ABILITY) {
    return { canDecrease: false, refund: 0, reason: `Cannot go below ${ABILITY_CONSTRAINTS.MIN_ABILITY}` };
  }

  // Check negative sum constraint
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

    if (newNegSum < ABILITY_CONSTRAINTS.MAX_NEGATIVE_SUM) {
      return { canDecrease: false, refund: 0, reason: `Negative sum cannot exceed ${ABILITY_CONSTRAINTS.MAX_NEGATIVE_SUM}` };
    }
  }

  return { canDecrease: true, refund, reason: null };
}

// =============================================================================
// Sub-Components
// =============================================================================

interface AbilityCardProps {
  ability: AbilityName;
  value: number;
  defenseValue: number;
  defenseBonus: number;
  defenseScore: number;
  isArchetypeAbility?: boolean;
  isMartialAbility?: boolean;
  isPowerAbility?: boolean;
  isEditMode?: boolean;
  level: number;
  availableAbilityPoints: number;
  abilities: Abilities;
  onIncrease?: () => void;
  onDecrease?: () => void;
  onDefenseIncrease?: () => void;
  onDefenseDecrease?: () => void;
  onRollAbility?: () => void;
  onRollDefense?: () => void;
}

function AbilityCard({
  ability,
  value,
  defenseValue,
  defenseBonus,
  defenseScore,
  isArchetypeAbility,
  isMartialAbility,
  isPowerAbility,
  isEditMode,
  level,
  availableAbilityPoints,
  abilities,
  onIncrease,
  onDecrease,
  onDefenseIncrease,
  onDefenseDecrease,
  onRollAbility,
  onRollDefense,
}: AbilityCardProps) {
  const info = ABILITY_INFO[ability];
  const defenseInfo = DEFENSE_INFO[info.defenseKey];
  const formattedValue = value >= 0 ? `+${value}` : `${value}`;
  const formattedDefenseBonus = defenseBonus >= 0 ? `+${defenseBonus}` : `${defenseBonus}`;

  // Check constraints
  const maxAbility = ABILITY_CONSTRAINTS.getMaxAbility(level);
  const cost = getAbilityIncreaseCost(value);
  const canIncrease = value < maxAbility;
  const decreaseInfo = canDecreaseAbility(abilities, ability);

  // Determine styling based on ability role
  let borderClass = 'border-gray-200';
  let badgeText = '';
  let badgeClass = '';

  if (isPowerAbility && isMartialAbility) {
    borderClass = 'border-amber-400 border-2';
    badgeText = 'Archetype';
    badgeClass = 'bg-amber-100 text-amber-700';
  } else if (isPowerAbility) {
    borderClass = 'border-purple-400 border-2';
    badgeText = 'Power';
    badgeClass = 'bg-purple-100 text-purple-700';
  } else if (isMartialAbility) {
    borderClass = 'border-red-400 border-2';
    badgeText = 'Martial';
    badgeClass = 'bg-red-100 text-red-700';
  } else if (isArchetypeAbility) {
    borderClass = 'border-amber-400 border-2';
    badgeText = 'Archetype';
    badgeClass = 'bg-amber-100 text-amber-700';
  }

  return (
    <div className={cn(
      'relative flex flex-col bg-white rounded-xl shadow-sm border overflow-hidden',
      borderClass
    )}>
      {/* Role badge */}
      {badgeText && (
        <div className={cn(
          'absolute -top-0.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-b-lg text-[9px] font-bold uppercase z-10',
          badgeClass
        )}>
          {badgeText}
        </div>
      )}

      {/* Ability Section */}
      <div
        onClick={!isEditMode && onRollAbility ? onRollAbility : undefined}
        className={cn(
          'flex flex-col items-center p-3 pt-4 transition-all',
          !isEditMode && onRollAbility && 'cursor-pointer hover:bg-gray-50 active:scale-[0.98]'
        )}
        role={!isEditMode && onRollAbility ? 'button' : undefined}
        title={!isEditMode ? `Click to roll ${info.name} check` : undefined}
      >
        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
          {info.name}
        </span>

        <div className="flex items-center gap-1 my-1">
          {isEditMode && (
            <button
              onClick={(e) => { e.stopPropagation(); onDecrease?.(); }}
              disabled={!decreaseInfo.canDecrease}
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                decreaseInfo.canDecrease
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
              )}
              title={decreaseInfo.reason || `Refund ${decreaseInfo.refund} point(s)`}
            >
              −
            </button>
          )}
          <span className={cn(
            'text-2xl font-bold min-w-[48px] text-center',
            value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-700'
          )}>
            {formattedValue}
          </span>
          {isEditMode && (
            <button
              onClick={(e) => { e.stopPropagation(); onIncrease?.(); }}
              disabled={!canIncrease}
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                canIncrease
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
              )}
              title={canIncrease ? `Cost: ${cost} point(s)` : `Max at level ${level} is ${maxAbility}`}
            >
              +
            </button>
          )}
        </div>

        {/* Cost indicator in edit mode */}
        {isEditMode && (
          <span className={cn(
            'text-[9px] font-medium',
            cost > 1 ? 'text-amber-600' : 'text-gray-400'
          )}>
            {cost > 1 ? `+${cost}pt` : '+1pt'}
          </span>
        )}
      </div>

      {/* Defense Section */}
      <div
        onClick={!isEditMode && onRollDefense ? onRollDefense : undefined}
        className={cn(
          'flex flex-col items-center p-2 bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200 transition-all',
          !isEditMode && onRollDefense && 'cursor-pointer hover:bg-gray-100 active:scale-[0.98]'
        )}
        role={!isEditMode && onRollDefense ? 'button' : undefined}
        title={!isEditMode ? `Click to roll ${defenseInfo.name} save` : undefined}
      >
        <span className="text-[9px] text-gray-400 uppercase tracking-wider font-medium">
          {defenseInfo.name}
        </span>

        <div className="flex items-center gap-1">
          {isEditMode && (
            <button
              onClick={(e) => { e.stopPropagation(); onDefenseDecrease?.(); }}
              disabled={defenseValue <= 0}
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                defenseValue > 0
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              )}
            >
              −
            </button>
          )}
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-gray-800">{defenseScore}</span>
            <span className="text-[10px] text-gray-500">{formattedDefenseBonus}</span>
          </div>
          {isEditMode && (
            <button
              onClick={(e) => { e.stopPropagation(); onDefenseIncrease?.(); }}
              className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 transition-colors"
              title="Cost: 2 skill points"
            >
              +
            </button>
          )}
        </div>

        {/* Defense skill points in edit mode */}
        {isEditMode && defenseValue > 0 && (
          <span className="text-[9px] text-blue-600 font-medium">
            +{defenseValue} ({defenseValue * 2}sp)
          </span>
        )}
      </div>
    </div>
  );
}

// Point Tracker Sub-component
interface PointTrackerProps {
  label: string;
  spent: number;
  total: number;
  color: 'amber' | 'blue' | 'green';
}

function PointTracker({ label, spent, total, color }: PointTrackerProps) {
  const remaining = total - spent;
  const percentage = total > 0 ? (spent / total) * 100 : 0;

  const colorClasses = {
    amber: {
      bg: 'bg-amber-100',
      fill: 'bg-amber-500',
      text: remaining >= 0 ? 'text-amber-700' : 'text-red-600',
    },
    blue: {
      bg: 'bg-blue-100',
      fill: 'bg-blue-500',
      text: remaining >= 0 ? 'text-blue-700' : 'text-red-600',
    },
    green: {
      bg: 'bg-green-100',
      fill: 'bg-green-500',
      text: remaining >= 0 ? 'text-green-700' : 'text-red-600',
    },
  };

  const classes = colorClasses[color];

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 font-medium">{label}</span>
        <span className={cn('text-xs font-bold', classes.text)}>
          {remaining} / {total}
        </span>
      </div>
      <div className={cn('h-2 rounded-full overflow-hidden', classes.bg)}>
        <div
          className={cn('h-full transition-all duration-300 rounded-full', classes.fill)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Main Component Export
// =============================================================================

export function AbilitiesSection({
  abilities,
  defenseSkills,
  level,
  archetypeAbility,
  martialAbility,
  powerAbility,
  isEditMode = false,
  totalAbilityPoints,
  spentAbilityPoints,
  totalSkillPoints,
  spentSkillPoints,
  onAbilityChange,
  onDefenseChange,
}: AbilitiesSectionProps) {
  const abilityOrder: AbilityName[] = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];
  const rollContext = useRollsOptional();

  // Calculate defense values
  const getDefenseValue = (defenseKey: string): number => {
    return defenseSkills?.[defenseKey as keyof DefenseSkills] ?? 0;
  };

  const getDefenseBonus = (ability: AbilityName): number => {
    const abilityValue = abilities[ability] ?? 0;
    const defenseKey = ABILITY_INFO[ability].defenseKey;
    const defenseValue = getDefenseValue(defenseKey);
    return abilityValue + defenseValue;
  };

  const getDefenseScore = (ability: AbilityName): number => {
    return 10 + getDefenseBonus(ability);
  };

  // Calculate ability point cost (for display)
  const calculateAbilityPointsSpent = (): number => {
    let spent = 0;
    abilityOrder.forEach(ability => {
      const value = abilities[ability] ?? 0;
      // Points spent = sum of costs for each point above 0, minus refunds for negatives
      if (value > 0) {
        for (let i = 1; i <= value; i++) {
          spent += i >= 4 ? 2 : 1;
        }
      } else if (value < 0) {
        // Negative values give points back (1 per negative, max -2, total sum max -3)
        spent += value; // value is already negative
      }
    });
    return spent;
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-4">
      {/* Header with Point Trackers */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Abilities & Defenses</h2>
        </div>

        {/* Point Trackers - only show in edit mode */}
        {isEditMode && (
          <div className="flex gap-4 p-3 bg-gray-50 rounded-lg">
            {totalAbilityPoints !== undefined && (
              <PointTracker
                label="Ability Points"
                spent={spentAbilityPoints ?? calculateAbilityPointsSpent()}
                total={totalAbilityPoints}
                color="amber"
              />
            )}
            {totalSkillPoints !== undefined && (
              <PointTracker
                label="Skill Points (Defenses)"
                spent={spentSkillPoints ?? 0}
                total={totalSkillPoints}
                color="blue"
              />
            )}
          </div>
        )}
      </div>

      {/* Abilities Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {abilityOrder.map((ability) => {
          const defenseKey = ABILITY_INFO[ability].defenseKey;
          const defenseValue = getDefenseValue(defenseKey);

          return (
            <AbilityCard
              key={ability}
              ability={ability}
              value={abilities[ability] ?? 0}
              defenseValue={defenseValue}
              defenseBonus={getDefenseBonus(ability)}
              defenseScore={getDefenseScore(ability)}
              isArchetypeAbility={archetypeAbility?.toLowerCase() === ability}
              isMartialAbility={martialAbility?.toLowerCase() === ability}
              isPowerAbility={powerAbility?.toLowerCase() === ability}
              isEditMode={isEditMode}
              level={level}
              availableAbilityPoints={(totalAbilityPoints ?? 0) - (spentAbilityPoints ?? 0)}
              abilities={abilities}
              onIncrease={() => onAbilityChange?.(ability, (abilities[ability] ?? 0) + 1)}
              onDecrease={() => onAbilityChange?.(ability, (abilities[ability] ?? 0) - 1)}
              onDefenseIncrease={() => onDefenseChange?.(defenseKey, defenseValue + 1)}
              onDefenseDecrease={() => onDefenseChange?.(defenseKey, Math.max(0, defenseValue - 1))}
              onRollAbility={rollContext ? () => rollContext.rollAbility(ability, abilities[ability] ?? 0) : undefined}
              onRollDefense={rollContext ? () => rollContext.rollDefense?.(defenseKey, getDefenseBonus(ability)) : undefined}
            />
          );
        })}
      </div>

      {/* Constraint hints in edit mode */}
      {isEditMode && (
        <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-gray-500">
          <span className="px-2 py-1 bg-gray-100 rounded">
            Max ability at level {level}: +{ABILITY_CONSTRAINTS.getMaxAbility(level)}
          </span>
          <span className="px-2 py-1 bg-gray-100 rounded">
            Min ability: {ABILITY_CONSTRAINTS.MIN_ABILITY}
          </span>
          <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded">
            Abilities 4+ cost 2 points
          </span>
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
            Defense skills cost 2 skill points each
          </span>
        </div>
      )}
    </div>
  );
}
