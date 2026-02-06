/**
 * Abilities Section
 * =================
 * Displays the six core abilities in a row with clickable roll buttons,
 * followed by a separate defenses row with defense scores and roll buttons.
 * 
 * Layout matches vanilla site:
 * - Row 1: 6 abilities with gradient roll buttons showing bonus
 * - Row 2: 6 defenses with score and gradient roll buttons for bonus
 */

'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useRollsOptional } from './roll-context';
import { RollButton, PointStatus, EditSectionToggle, getEditState, DecrementButton, IncrementButton } from '@/components/shared';
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
  totalAbilityPoints?: number;
  spentAbilityPoints?: number;
  totalSkillPoints?: number;
  spentSkillPoints?: number;
  onAbilityChange?: (ability: AbilityName, value: number) => void;
  onDefenseChange?: (defense: keyof DefenseSkills, value: number) => void;
}

// =============================================================================
// Constants
// =============================================================================

const ABILITY_ORDER: AbilityName[] = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];

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
  getMaxDefenseSkill: (level: number): number => level,
};

// =============================================================================
// Helper Functions
// =============================================================================

function formatBonus(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

/** Cost to go from currentValue to currentValue+1 (abilities 4+ cost 2 points) */
function getAbilityIncreaseCost(currentValue: number): number {
  return currentValue >= 3 ? 2 : 1;
}

function canDecreaseAbility(abilities: Abilities, abilityName: AbilityName): boolean {
  const currentValue = abilities[abilityName] ?? 0;
  const newValue = currentValue - 1;
  
  if (newValue < ABILITY_CONSTRAINTS.MIN_ABILITY) return false;
  
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
    
    if (newNegSum < ABILITY_CONSTRAINTS.MAX_NEGATIVE_SUM) return false;
  }
  
  return true;
}

// Note: RollButton and PointStatus are now imported from @/components/shared

// =============================================================================
// Main Component
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
  const rollContext = useRollsOptional();
  
  // Local state for whether this section is actively being edited
  // Only relevant when isEditMode is true - clicking pencil toggles this
  const [isSectionEditing, setIsSectionEditing] = useState(false);
  
  // Derived state: is the section actually editable right now?
  const showEditControls = isEditMode && isSectionEditing;
  
  // Calculate ability points spent
  const calculatedSpentAbilityPoints = useMemo(() => {
    let spent = 0;
    ABILITY_ORDER.forEach(ability => {
      const value = abilities[ability] ?? 0;
      if (value > 0) {
        for (let i = 1; i <= value; i++) {
          spent += i >= 4 ? 2 : 1;
        }
      } else if (value < 0) {
        spent += value;
      }
    });
    return spent;
  }, [abilities]);
  
  // Calculate defense skill points spent (2 per point)
  const calculatedDefenseSpent = useMemo(() => {
    if (!defenseSkills) return 0;
    return Object.values(defenseSkills).reduce((sum, val) => sum + ((val || 0) * 2), 0);
  }, [defenseSkills]);
  
  const getDefenseValue = (defenseKey: keyof DefenseSkills): number => {
    return defenseSkills?.[defenseKey] ?? 0;
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
  
  const maxAbility = ABILITY_CONSTRAINTS.getMaxAbility(level);
  const maxDefenseSkill = ABILITY_CONSTRAINTS.getMaxDefenseSkill(level);
  
  // Calculate edit state for pencil icon color
  const abilityEditState = totalAbilityPoints !== undefined 
    ? getEditState(spentAbilityPoints ?? calculatedSpentAbilityPoints, totalAbilityPoints)
    : 'normal';
  
  return (
    <div className="bg-surface rounded-xl shadow-md p-4 md:p-6 mb-4 relative">
      {/* Edit Mode Indicator - Blue Pencil Icon in top-right */}
      {isEditMode && (
        <div className="absolute top-3 right-3">
          <EditSectionToggle 
            state={abilityEditState}
            isActive={isSectionEditing}
            onClick={() => setIsSectionEditing(prev => !prev)}
            title={
              isSectionEditing
                ? 'Click to close editing'
                : abilityEditState === 'has-points' 
                  ? 'Click to edit - you have ability points to spend' 
                  : abilityEditState === 'over-budget'
                    ? 'Click to edit - over budget, remove points'
                    : 'Click to edit abilities & defenses'
            }
          />
        </div>
      )}
      
      {/* Header with Point Trackers */}
      {showEditControls && (
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
                spent={(spentSkillPoints ?? 0) + calculatedDefenseSpent}
                total={totalSkillPoints}
                variant="inline"
              />
            )}
          </div>
          <div className="text-xs text-text-muted">
            Max ability: +{maxAbility} | Defense skill: 2sp each (max +{maxDefenseSkill})
          </div>
        </div>
      )}
      
      {/* Abilities Row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 md:gap-4 mb-6">
        {ABILITY_ORDER.map((ability) => {
          const value = abilities[ability] ?? 0;
          const info = ABILITY_INFO[ability];
          const isPower = powerAbility?.toLowerCase() === ability;
          const isMartial = martialAbility?.toLowerCase() === ability;
          const isArchetype = isPower || isMartial;
          const cost = getAbilityIncreaseCost(value);
          const canIncrease = value < maxAbility;
          const canDecrease = canDecreaseAbility(abilities, ability);
          
          return (
            <div
              key={ability}
              className={cn(
                'flex flex-col items-center p-3 bg-gradient-to-b from-surface to-surface-alt rounded-xl border-2 transition-all',
                isPower ? 'border-purple-400' : isMartial ? 'border-red-400' : 'border-border-light',
                !showEditControls && 'hover:shadow-md'
              )}
            >
              {/* Ability Name */}
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                {info.name}
              </span>
              
              {/* Ability Value / Roll Button */}
              {showEditControls ? (
                <div className="flex items-center gap-1">
                  <DecrementButton
                    onClick={() => onAbilityChange?.(ability, value - 1)}
                    disabled={!canDecrease}
                    size="sm"
                  />
                  <span className={cn(
                    'text-2xl font-bold min-w-[56px] text-center',
                    value > 0 ? 'text-success-600' : value < 0 ? 'text-danger-600' : 'text-text-secondary'
                  )}>
                    {formatBonus(value)}
                  </span>
                  <IncrementButton
                    onClick={() => onAbilityChange?.(ability, value + 1)}
                    disabled={!canIncrease}
                    size="sm"
                    title={canIncrease ? `Cost: ${cost} point${cost > 1 ? 's' : ''}` : `Max at level ${level}`}
                  />
                </div>
              ) : (
                <RollButton
                  value={value}
                  onClick={() => rollContext?.rollAbility?.(ability, value)}
                  size="lg"
                  title={`Roll ${info.name}`}
                />
              )}
              
              {/* Cost indicator in edit mode - only show if next point costs 2 */}
              {showEditControls && value >= 3 && canIncrease && (
                <span className="text-[10px] text-amber-600 font-medium mt-1">
                  Next: {cost}pt
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Defenses Row - Separate from abilities */}
      <div className="border-t-2 border-border-light pt-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 md:gap-4">
          {ABILITY_ORDER.map((ability) => {
            const info = ABILITY_INFO[ability];
            const defenseKey = info.defenseKey;
            const defenseInfo = DEFENSE_INFO[defenseKey];
            const defenseValue = getDefenseValue(defenseKey);
            const defenseBonus = getDefenseBonus(ability);
            const defenseScore = getDefenseScore(ability);
            const canIncreaseDefense = defenseValue < maxDefenseSkill;
            const canDecreaseDefense = defenseValue > 0;
            
            return (
              <div
                key={defenseKey}
                className="flex flex-col items-center p-3 bg-surface-alt rounded-lg"
              >
                {/* Defense Name */}
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                  {defenseInfo.name}
                </span>
                
                {/* Defense Score */}
                <span className="text-lg font-bold text-text-primary mb-1">
                  {defenseScore}
                </span>
                
                {/* Defense Bonus Roll Button / Edit Controls */}
                {showEditControls ? (
                  <div className="flex items-center gap-1">
                    <DecrementButton
                      onClick={() => onDefenseChange?.(defenseKey, Math.max(0, defenseValue - 1))}
                      disabled={!canDecreaseDefense}
                      size="sm"
                    />
                    <span className="text-sm font-bold min-w-[36px] text-center text-blue-600">
                      {formatBonus(defenseBonus)}
                    </span>
                    <IncrementButton
                      onClick={() => onDefenseChange?.(defenseKey, defenseValue + 1)}
                      disabled={!canIncreaseDefense}
                      size="sm"
                      title={canIncreaseDefense ? 'Cost: 2 skill points' : `Max at level ${level}`}
                    />
                  </div>
                ) : (
                  <RollButton
                    value={defenseBonus}
                    variant="primary"
                    onClick={() => rollContext?.rollDefense?.(defenseInfo.name, defenseBonus)}
                    size="sm"
                    title={`Roll ${defenseInfo.name}`}
                  />
                )}
                
                {/* Defense skill allocation indicator */}
                {showEditControls && defenseValue > 0 && (
                  <span className="text-[9px] text-blue-600 font-medium mt-0.5">
                    +{defenseValue} ({defenseValue * 2}sp)
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
