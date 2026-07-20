/**
 * Abilities Section
 * =================
 * Displays the six core abilities in a row with clickable roll buttons,
 * followed by a separate defenses row with defense scores and roll buttons.
 *
 * // DESIGN_INTENT: Dense like sheet-header LargeStatBlock — label glued to value,
 * content-height tiles (no equal-height empty cards). Ability play = RollButton;
 * defense glance = Score, play = smaller bonus RollButton.
 */

'use client';

import { useMemo, useState } from 'react';
import { cn, formatBonus } from '@/lib/utils';
import { useRollsOptional } from './roll-context';
import { RollButton, PointStatus, EditSectionToggle, DecrementButton, IncrementButton, WordHelpTip } from '@/components/shared';
import { Card } from '@/components/ui';
import { DEFENSE_INCREASE_COST } from '@/lib/game/skill-allocation';
import { calculateAbilityScoreCost, getAbilityIncreaseCost } from '@/lib/game/formulas';
import { getAbilityHelp, getDefenseHelp } from '../../../public/tooltip-text';
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

/** Sheet tip: hug label on desktop; keep 44px touch below md (overrides WordHelpTip default min size). */
const SHEET_STAT_TIP_CLASS =
  'text-sm font-semibold uppercase tracking-wide text-text-secondary text-center leading-none px-0.5 min-h-0 min-w-0 max-md:min-h-[var(--touch-target-min,44px)] max-md:min-w-[var(--touch-target-min,44px)]';

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

// Note: RollButton and PointStatus are now imported from @/components/shared

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
    return ABILITY_ORDER.reduce(
      (sum, ability) => sum + calculateAbilityScoreCost(abilities[ability] ?? 0),
      0
    );
  }, [abilities]);
  
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
  
  // Calculate edit state for pencil icon: red when over (ability or skill points), green when either has remaining
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

  return (
    <Card className="shadow-md p-4 md:p-6 mb-4 relative">
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
                spent={spentSkillPoints ?? 0}
                total={totalSkillPoints}
                variant="inline"
              />
            )}
          </div>
          <div className="text-xs text-text-muted dark:text-text-secondary">
            Max ability: +{maxAbility} | Defense: {DEFENSE_INCREASE_COST}sp per +1 (max +{maxDefenseSkill}, over allowed)
          </div>
        </div>
      )}
      
      {/* Abilities — label + roll; equal gap + tile padding (not squashed, not empty) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 md:gap-3 mb-4">
        {ABILITY_ORDER.map((ability) => {
          const value = abilities[ability] ?? 0;
          const info = ABILITY_INFO[ability];
          const isPower = powerAbility?.toLowerCase() === ability;
          const isMartial = martialAbility?.toLowerCase() === ability;
          const cost = getAbilityIncreaseCost(value);
          const canIncrease = value < maxAbility;
          const canDecrease = canDecreaseAbility(abilities, ability);
          
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
              
              {showEditControls ? (
                <div className="flex items-center gap-0.5">
                  <DecrementButton
                    onClick={() => onAbilityChange?.(ability, value - 1)}
                    disabled={!canDecrease}
                    size="sm"
                  />
                  <span className={cn(
                    'text-xl font-bold min-w-[2.5rem] text-center tabular-nums leading-none',
                    value > 0 ? 'text-success-fg' : value < 0 ? 'text-danger-fg' : 'text-text-secondary'
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
              ) : rollContext?.canRoll !== false ? (
                <RollButton
                  value={value}
                  onClick={() => rollContext?.rollAbility?.(ability, value)}
                  size="md"
                  title={`Roll ${info.name}`}
                />
              ) : null}
              
              {showEditControls && cost > 1 && canIncrease && (
                <span className="text-[10px] text-warning-fg font-medium leading-none">
                  Next: {cost} Pts
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
            const defenseBonus = getDefenseBonus(ability);
            const defenseScore = getDefenseScore(ability);
            const canDecreaseDefense = defenseValue > 0;
            // Allow override: can increase even over level cap (red pencil indicates overspend)
            const atOrOverLevelCap = defenseValue >= maxDefenseSkill;
            
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
                
                <span className="text-2xl font-bold text-text-primary leading-none tabular-nums">
                  {defenseScore}
                </span>
                
                {showEditControls ? (
                  <div className="flex items-center gap-0.5">
                    <DecrementButton
                      onClick={() => onDefenseChange?.(defenseKey, Math.max(0, defenseValue - 1))}
                      disabled={!canDecreaseDefense}
                      size="sm"
                    />
                    <span className="text-sm font-bold min-w-[2rem] text-center text-primary-link-fg tabular-nums leading-none">
                      {formatBonus(defenseBonus)}
                    </span>
                    <IncrementButton
                      onClick={() => onDefenseChange?.(defenseKey, defenseValue + 1)}
                      size="sm"
                      title={atOrOverLevelCap ? `Cost: ${DEFENSE_INCREASE_COST} skill points (over level cap, allowed)` : `Cost: ${DEFENSE_INCREASE_COST} skill points`}
                    />
                  </div>
                ) : rollContext?.canRoll !== false ? (
                  <RollButton
                    value={defenseBonus}
                    variant="primary"
                    onClick={() => rollContext?.rollDefense?.(defenseInfo.name, defenseBonus)}
                    size="sm"
                    title={`Roll ${defenseInfo.name}`}
                  />
                ) : null}
                
                {showEditControls && defenseValue > 0 && (
                  <span className="text-[10px] text-primary-link-fg font-medium leading-none">
                    +{defenseValue} ({defenseValue * DEFENSE_INCREASE_COST}sp)
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
