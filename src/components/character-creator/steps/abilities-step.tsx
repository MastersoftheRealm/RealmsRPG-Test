/**
 * Abilities Step
 * ==============
 * Allocate ability points during character creation
 */

'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { calculateAbilityPoints, getAbilityIncreaseCost, canIncreaseAbility, canDecreaseAbility } from '@/lib/game/formulas';
import { ABILITY_LIMITS } from '@/lib/game/constants';
import type { AbilityName } from '@/types';

const ABILITY_INFO: Record<AbilityName, { name: string; description: string; defenseLink: string }> = {
  strength: { 
    name: 'Strength', 
    description: 'Physical power, melee damage, and carrying capacity',
    defenseLink: 'Might'
  },
  vitality: { 
    name: 'Vitality', 
    description: 'Health, endurance, and resistance to physical effects',
    defenseLink: 'Fortitude'
  },
  agility: { 
    name: 'Agility', 
    description: 'Speed, dexterity, reflexes, and finesse attacks',
    defenseLink: 'Reflex'
  },
  acuity: { 
    name: 'Acuity', 
    description: 'Perception, awareness, and ranged accuracy',
    defenseLink: 'Discernment'
  },
  intelligence: { 
    name: 'Intelligence', 
    description: 'Knowledge, reasoning, and mental power',
    defenseLink: 'Mental Fortitude'
  },
  charisma: { 
    name: 'Charisma', 
    description: 'Force of personality, leadership, and social influence',
    defenseLink: 'Resolve'
  },
};

const ABILITY_ORDER: AbilityName[] = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];

export function AbilitiesStep() {
  const { draft, updateAbility, nextStep, prevStep } = useCharacterCreatorStore();
  const level = draft.level || 1;
  const abilities = draft.abilities || {
    strength: 0,
    vitality: 0,
    agility: 0,
    acuity: 0,
    intelligence: 0,
    charisma: 0,
  };
  
  // Calculate total points and spent
  const totalPoints = useMemo(() => calculateAbilityPoints(level), [level]);
  const spentPoints = useMemo(() => {
    return ABILITY_ORDER.reduce((sum, ability) => {
      const value = abilities[ability] || 0;
      let cost = 0;
      
      // Calculate cost for positive values
      for (let i = 1; i <= value; i++) {
        cost += i > ABILITY_LIMITS.COST_INCREASE_THRESHOLD ? 2 : 1;
      }
      
      // Negative values give points back (1 per negative)
      if (value < 0) {
        cost = value; // Negative number = negative cost
      }
      
      return sum + cost;
    }, 0);
  }, [abilities]);
  
  const remainingPoints = totalPoints - spentPoints;

  const handleIncrease = (ability: AbilityName) => {
    const current = abilities[ability] || 0;
    const cost = getAbilityIncreaseCost(current);
    
    if (canIncreaseAbility(current, remainingPoints, true)) {
      updateAbility(ability, current + 1);
    }
  };

  const handleDecrease = (ability: AbilityName) => {
    const current = abilities[ability] || 0;
    
    if (canDecreaseAbility(current)) {
      updateAbility(ability, current - 1);
    }
  };

  const canContinue = remainingPoints >= 0;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Assign Ability Scores</h1>
      <p className="text-gray-600 mb-4">
        Distribute your ability points. Higher scores cost more at higher values.
        You can reduce abilities below 0 to gain extra points.
      </p>
      
      {/* Points Display */}
      <div className={cn(
        'flex items-center justify-center gap-4 p-4 rounded-xl mb-6',
        remainingPoints > 0 ? 'bg-green-50 border border-green-200' :
        remainingPoints < 0 ? 'bg-red-50 border border-red-200' :
        'bg-gray-50 border border-gray-200'
      )}>
        <div className="text-center">
          <span className="text-sm text-gray-500">Total Points</span>
          <div className="text-2xl font-bold text-gray-900">{totalPoints}</div>
        </div>
        <div className="text-3xl text-gray-300">−</div>
        <div className="text-center">
          <span className="text-sm text-gray-500">Spent</span>
          <div className="text-2xl font-bold text-gray-900">{spentPoints}</div>
        </div>
        <div className="text-3xl text-gray-300">=</div>
        <div className="text-center">
          <span className="text-sm text-gray-500">Remaining</span>
          <div className={cn(
            'text-2xl font-bold',
            remainingPoints > 0 ? 'text-green-600' :
            remainingPoints < 0 ? 'text-red-600' :
            'text-gray-600'
          )}>
            {remainingPoints}
          </div>
        </div>
      </div>
      
      {/* Ability Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {ABILITY_ORDER.map((ability) => {
          const value = abilities[ability] || 0;
          const info = ABILITY_INFO[ability];
          const cost = getAbilityIncreaseCost(value);
          const isArchetypeAbility = 
            draft.pow_abil === ability || draft.mart_abil === ability;
          
          return (
            <div
              key={ability}
              className={cn(
                'p-4 rounded-xl border-2 bg-white',
                isArchetypeAbility ? 'border-amber-400' : 'border-gray-200'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-gray-900">{info.name}</h3>
                  {isArchetypeAbility && (
                    <span className="text-xs text-amber-600 font-medium">
                      Archetype Ability
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">→ {info.defenseLink}</span>
              </div>
              
              <p className="text-xs text-gray-500 mb-3">{info.description}</p>
              
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleDecrease(ability)}
                  disabled={!canDecreaseAbility(value)}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-colors',
                    canDecreaseAbility(value)
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  )}
                >
                  −
                </button>
                
                <div className="text-center">
                  <div className={cn(
                    'text-3xl font-bold',
                    value > 0 ? 'text-green-600' :
                    value < 0 ? 'text-red-600' :
                    'text-gray-600'
                  )}>
                    {value >= 0 ? `+${value}` : value}
                  </div>
                  <div className="text-xs text-gray-400">
                    Cost: {cost}
                  </div>
                </div>
                
                <button
                  onClick={() => handleIncrease(ability)}
                  disabled={!canIncreaseAbility(value, remainingPoints, true)}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-colors',
                    canIncreaseAbility(value, remainingPoints, true)
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  )}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          ← Back
        </button>
        
        <button
          onClick={nextStep}
          disabled={!canContinue}
          className={cn(
            'px-8 py-3 rounded-xl font-bold transition-colors',
            canContinue
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
