/**
 * Abilities Section
 * =================
 * Displays and manages the six core ability scores
 * Clicking an ability in view mode rolls a d20 + modifier
 */

'use client';

import { cn } from '@/lib/utils';
import { useRollsOptional } from './roll-context';
import type { Abilities, AbilityName } from '@/types';

interface AbilitiesSectionProps {
  abilities: Abilities;
  archetypeAbility?: AbilityName;
  martialAbility?: AbilityName;
  powerAbility?: AbilityName;
  isEditMode?: boolean;
  availablePoints?: number;
  onAbilityChange?: (ability: AbilityName, value: number) => void;
}

const ABILITY_INFO: Record<AbilityName, { name: string; description: string; defenseLink: string }> = {
  strength: { 
    name: 'Strength', 
    description: 'Physical power and melee attacks',
    defenseLink: 'Might'
  },
  vitality: { 
    name: 'Vitality', 
    description: 'Health and endurance',
    defenseLink: 'Fortitude'
  },
  agility: { 
    name: 'Agility', 
    description: 'Speed, dexterity, and finesse',
    defenseLink: 'Reflex'
  },
  acuity: { 
    name: 'Acuity', 
    description: 'Perception and awareness',
    defenseLink: 'Discernment'
  },
  intelligence: { 
    name: 'Intelligence', 
    description: 'Knowledge and reasoning',
    defenseLink: 'Mental Fortitude'
  },
  charisma: { 
    name: 'Charisma', 
    description: 'Force of personality',
    defenseLink: 'Resolve'
  },
};

function AbilityCard({
  ability,
  value,
  info,
  isArchetypeAbility,
  isMartialAbility,
  isPowerAbility,
  isEditMode,
  onIncrease,
  onDecrease,
  onRoll,
}: {
  ability: AbilityName;
  value: number;
  info: typeof ABILITY_INFO[AbilityName];
  isArchetypeAbility?: boolean;
  isMartialAbility?: boolean;
  isPowerAbility?: boolean;
  isEditMode?: boolean;
  onIncrease?: () => void;
  onDecrease?: () => void;
  onRoll?: () => void;
}) {
  const formattedValue = value >= 0 ? `+${value}` : `${value}`;
  
  // Determine border color based on ability role
  let borderClass = 'border-gray-200';
  let badgeClass = '';
  
  if (isArchetypeAbility) {
    borderClass = 'border-amber-400 border-2';
    badgeClass = 'bg-amber-100 text-amber-700';
  } else if (isPowerAbility) {
    borderClass = 'border-purple-400 border-2';
    badgeClass = 'bg-purple-100 text-purple-700';
  } else if (isMartialAbility) {
    borderClass = 'border-red-400 border-2';
    badgeClass = 'bg-red-100 text-red-700';
  }

  // Handle click - roll dice when not in edit mode
  const handleClick = () => {
    if (!isEditMode && onRoll) {
      onRoll();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative flex flex-col items-center p-4 bg-white rounded-xl shadow-sm border transition-all',
        borderClass,
        isEditMode && 'hover:shadow-md',
        !isEditMode && onRoll && 'cursor-pointer hover:bg-gray-50 hover:shadow-md active:scale-95'
      )}
      role={!isEditMode && onRoll ? 'button' : undefined}
      title={!isEditMode && onRoll ? `Click to roll ${info.name} check` : undefined}
    >
      {/* Role badge */}
      {(isArchetypeAbility || isMartialAbility || isPowerAbility) && (
        <div className={cn('absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', badgeClass)}>
          {isArchetypeAbility ? 'Archetype' : isPowerAbility ? 'Power' : 'Martial'}
        </div>
      )}
      
      {/* Ability name */}
      <span className="text-xs text-gray-500 uppercase tracking-wider mt-1">
        {info.name}
      </span>
      
      {/* Value */}
      <div className="flex items-center gap-2 my-2">
        {isEditMode && (
          <button
            onClick={onDecrease}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600"
          >
            −
          </button>
        )}
        <span className={cn(
          'text-3xl font-bold',
          value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-700'
        )}>
          {formattedValue}
        </span>
        {isEditMode && (
          <button
            onClick={onIncrease}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600"
          >
            +
          </button>
        )}
      </div>
      
      {/* Defense link */}
      <span className="text-[10px] text-gray-400">
        → {info.defenseLink}
      </span>
    </div>
  );
}

export function AbilitiesSection({
  abilities,
  archetypeAbility,
  martialAbility,
  powerAbility,
  isEditMode = false,
  availablePoints,
  onAbilityChange,
}: AbilitiesSectionProps) {
  const abilityOrder: AbilityName[] = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];
  const rollContext = useRollsOptional();

  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Abilities</h2>
        {isEditMode && availablePoints !== undefined && (
          <span className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            availablePoints > 0 ? 'bg-green-100 text-green-700' : 
            availablePoints < 0 ? 'bg-red-100 text-red-700' : 
            'bg-gray-100 text-gray-600'
          )}>
            {availablePoints} points
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {abilityOrder.map((ability) => (
          <AbilityCard
            key={ability}
            ability={ability}
            value={abilities[ability] ?? 0}
            info={ABILITY_INFO[ability]}
            isArchetypeAbility={archetypeAbility?.toLowerCase() === ability}
            isMartialAbility={martialAbility?.toLowerCase() === ability}
            isPowerAbility={powerAbility?.toLowerCase() === ability}
            isEditMode={isEditMode}
            onIncrease={() => onAbilityChange?.(ability, (abilities[ability] ?? 0) + 1)}
            onDecrease={() => onAbilityChange?.(ability, (abilities[ability] ?? 0) - 1)}
            onRoll={rollContext ? () => rollContext.rollAbility(ability, abilities[ability] ?? 0) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
