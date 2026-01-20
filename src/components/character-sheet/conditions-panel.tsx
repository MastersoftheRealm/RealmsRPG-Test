/**
 * Conditions Panel
 * ================
 * Displays and manages character conditions (buffs/debuffs)
 * Supports decaying conditions that reduce by 1 each turn
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, Plus, Minus, ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { CharacterCondition } from '@/types';

// Standard conditions from the vanilla site
const STANDARD_CONDITIONS: Omit<CharacterCondition, 'level'>[] = [
  { name: 'Bleeding', decaying: true, description: 'Bleeding creatures lose 1 Hit Point for each level of bleeding at the beginning of their turn. Any healing received reduces the bleeding condition by the amount healed.' },
  { name: 'Blinded', decaying: false, description: 'All targets are considered completely obscured to a blinded creature that relies on basic vision. Acuity Skill rolls that rely on sight automatically fail.' },
  { name: 'Charmed', decaying: false, description: "Charmed creatures can't attack or perform harmful Actions against the creature that charmed them. All Charisma rolls and potencies against this target from the charmer gain +2." },
  { name: 'Dazed', decaying: false, description: 'Dazed creatures cannot take Reactions.' },
  { name: 'Deafened', decaying: false, description: 'You cannot hear anything in the world around you. You have resistance to sonic damage. Acuity Skill rolls that rely on hearing automatically fail.' },
  { name: 'Dying', decaying: false, description: 'When your Hit Point total is reduced to zero or a negative value, you enter the dying condition. Each turn, at the beginning of your turn, you take 1d4 irreducible damage, doubling each turn.' },
  { name: 'Exhausted', decaying: false, description: 'Exhaustion reduces all bonuses and Evasion by an amount equal to its level. At level 10, the character dies.' },
  { name: 'Exposed', decaying: true, description: 'Exposed creatures decrease their Evasion by 1 for each level of Exposed.' },
  { name: 'Faint', decaying: false, description: 'You have -1 to Evasion, Might, Reflex, and on all D20 rolls requiring balance or poise.' },
  { name: 'Frightened', decaying: false, description: 'Frightened creatures have -2 on all scores and D20 rolls against the source of their fear.' },
  { name: 'Grappled', decaying: false, description: 'Grappled targets have -2 to attack rolls, are +2 to hit, and cannot take movement Actions.' },
  { name: 'Hidden', decaying: false, description: 'While hidden, you have a +2 bonus on attack rolls made against creatures unaware of your location.' },
  { name: 'Immobile', decaying: false, description: 'Immobile creatures cannot take Movement Actions, and their Speed is considered 0.' },
  { name: 'Invisible', decaying: false, description: 'You are considered completely obscured to all creatures relying on basic vision.' },
  { name: 'Prone', decaying: false, description: 'While prone, your movement speed is reduced by ½. You are +2 to hit by others and have -2 to hit others.' },
  { name: 'Resilient', decaying: true, description: 'Resilient creatures take 1 less damage each time they are damaged per Resilient level.' },
  { name: 'Slowed', decaying: true, description: 'Slowed creatures lose 1 or more movement speed depending on the level of Slowed.' },
  { name: 'Stunned', decaying: true, description: 'Stunned creatures lose 1 or more Action Points based on the level of Stun.' },
  { name: 'Susceptible', decaying: true, description: 'Susceptible creatures take 1 extra damage each time they are damaged per Susceptible level.' },
  { name: 'Terminal', decaying: false, description: 'Your current health is at or below ¼ of your maximum health, placing you in the Terminal Range.' },
  { name: 'Weakened', decaying: true, description: 'Weakened creatures decrease all D20 rolls by 1 or more depending on the level of Weakened.' },
].sort((a, b) => a.name.localeCompare(b.name));

// Color coding for condition types
function getConditionColor(condition: CharacterCondition | Omit<CharacterCondition, 'level'>): { bg: string; border: string; text: string } {
  const name = condition.name.toLowerCase();
  
  // Positive conditions (green)
  if (['hidden', 'invisible', 'resilient'].includes(name)) {
    return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' };
  }
  
  // Severe conditions (red)
  if (['dying', 'terminal', 'exhausted', 'stunned'].includes(name)) {
    return { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700' };
  }
  
  // Debilitating conditions (orange)
  if (['bleeding', 'exposed', 'susceptible', 'weakened'].includes(name)) {
    return { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700' };
  }
  
  // Control conditions (purple)
  if (['charmed', 'frightened', 'grappled', 'immobile', 'prone', 'slowed'].includes(name)) {
    return { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700' };
  }
  
  // Sensory conditions (blue)
  if (['blinded', 'deafened', 'dazed'].includes(name)) {
    return { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700' };
  }
  
  // Default (gray)
  return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' };
}

interface ConditionChipProps {
  condition: CharacterCondition;
  isEditMode?: boolean;
  onRemove?: () => void;
  onLevelChange?: (newLevel: number) => void;
}

function ConditionChip({ condition, isEditMode, onRemove, onLevelChange }: ConditionChipProps) {
  const [showDescription, setShowDescription] = useState(false);
  const colors = getConditionColor(condition);
  
  return (
    <div className="relative">
      <div
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded-full border text-sm font-medium transition-all',
          colors.bg,
          colors.border,
          colors.text,
          !isEditMode && 'cursor-pointer hover:opacity-80'
        )}
        onClick={() => !isEditMode && setShowDescription(!showDescription)}
      >
        {/* Decaying indicator */}
        {condition.decaying && (
          <span className="text-[10px] opacity-70" title="Decays by 1 each turn">⏳</span>
        )}
        
        <span>{condition.name}</span>
        
        {/* Level indicator */}
        {condition.level > 1 && (
          <span className="px-1 rounded bg-white/50 text-xs font-bold">{condition.level}</span>
        )}
        
        {/* Edit mode controls */}
        {isEditMode && (
          <div className="flex items-center gap-0.5 ml-1">
            {condition.decaying && (
              <>
                <button
                  onClick={() => onLevelChange?.(condition.level - 1)}
                  disabled={condition.level <= 1}
                  className={cn(
                    'w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                    condition.level > 1
                      ? 'bg-white/70 hover:bg-white text-gray-700'
                      : 'opacity-30 cursor-not-allowed'
                  )}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onLevelChange?.(condition.level + 1)}
                  className="w-4 h-4 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-xs font-bold text-gray-700 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </>
            )}
            <button
              onClick={onRemove}
              className="w-4 h-4 rounded-full bg-white/70 hover:bg-red-100 flex items-center justify-center text-red-600 transition-colors ml-0.5"
              title="Remove condition"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      
      {/* Description tooltip */}
      {showDescription && condition.description && !isEditMode && (
        <div className="absolute z-10 left-0 top-full mt-1 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg max-w-[250px]">
          <p>{condition.description}</p>
          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}
    </div>
  );
}

interface ConditionsPanelProps {
  conditions: CharacterCondition[];
  isEditMode?: boolean;
  onConditionsChange?: (conditions: CharacterCondition[]) => void;
  compact?: boolean;
}

export function ConditionsPanel({
  conditions = [],
  isEditMode = false,
  onConditionsChange,
  compact = false,
}: ConditionsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [selectedCondition, setSelectedCondition] = useState('');
  const [customConditionName, setCustomConditionName] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  const handleAddCondition = (conditionTemplate: Omit<CharacterCondition, 'level'>) => {
    const existingIndex = conditions.findIndex(c => c.name === conditionTemplate.name);
    
    if (existingIndex >= 0 && conditionTemplate.decaying) {
      // Increase level of existing decaying condition
      const newConditions = [...conditions];
      newConditions[existingIndex] = {
        ...newConditions[existingIndex],
        level: newConditions[existingIndex].level + 1,
      };
      onConditionsChange?.(newConditions);
    } else if (existingIndex < 0) {
      // Add new condition
      onConditionsChange?.([
        ...conditions,
        { ...conditionTemplate, level: 1 } as CharacterCondition,
      ]);
    }
    
    setSelectedCondition('');
    setShowAddMenu(false);
  };
  
  const handleAddCustom = () => {
    if (!customConditionName.trim()) return;
    
    const existingIndex = conditions.findIndex(
      c => c.name.toLowerCase() === customConditionName.trim().toLowerCase()
    );
    
    if (existingIndex < 0) {
      onConditionsChange?.([
        ...conditions,
        {
          name: customConditionName.trim(),
          level: 1,
          decaying: true, // Custom conditions are decaying by default
        },
      ]);
    }
    
    setCustomConditionName('');
    setShowAddMenu(false);
  };
  
  const handleRemoveCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    onConditionsChange?.(newConditions);
  };
  
  const handleLevelChange = (index: number, newLevel: number) => {
    if (newLevel <= 0) {
      handleRemoveCondition(index);
    } else {
      const newConditions = [...conditions];
      newConditions[index] = { ...newConditions[index], level: newLevel };
      onConditionsChange?.(newConditions);
    }
  };
  
  const handleDecayAll = () => {
    if (!confirm('Apply decay to all decaying conditions? (Each reduces by 1)')) return;
    
    const newConditions = conditions
      .map(c => c.decaying ? { ...c, level: c.level - 1 } : c)
      .filter(c => c.level > 0);
    
    onConditionsChange?.(newConditions);
  };
  
  // Filter out conditions already applied
  const availableConditions = STANDARD_CONDITIONS.filter(
    sc => !conditions.some(c => c.name === sc.name) || sc.decaying
  );
  
  if (compact && conditions.length === 0 && !isEditMode) {
    return null;
  }
  
  return (
    <div className={cn(
      'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden',
      compact ? 'p-2' : 'p-4'
    )}>
      {/* Header */}
      <div 
        className={cn(
          'flex items-center justify-between',
          compact && 'cursor-pointer'
        )}
        onClick={() => compact && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <h3 className={cn(
            'font-bold text-gray-800',
            compact ? 'text-sm' : 'text-lg'
          )}>
            Conditions
          </h3>
          {conditions.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
              {conditions.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isEditMode && conditions.some(c => c.decaying) && (
            <button
              onClick={handleDecayAll}
              className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded transition-colors"
              title="Apply decay to all decaying conditions"
            >
              ⏳ Decay All
            </button>
          )}
          {compact && (
            isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>
      
      {/* Content */}
      {(!compact || isExpanded) && (
        <div className={cn('mt-3', compact && 'mt-2')}>
          {/* Condition chips */}
          {conditions.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-3">
              {conditions.map((condition, index) => (
                <ConditionChip
                  key={`${condition.name}-${index}`}
                  condition={condition}
                  isEditMode={isEditMode}
                  onRemove={() => handleRemoveCondition(index)}
                  onLevelChange={(level) => handleLevelChange(index, level)}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm italic mb-3">No active conditions</p>
          )}
          
          {/* Add condition UI (edit mode only) */}
          {isEditMode && (
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Condition
              </button>
              
              {showAddMenu && (
                <div className="absolute z-20 left-0 top-full mt-1 w-72 p-3 bg-white border border-gray-200 rounded-lg shadow-xl">
                  <div className="space-y-3">
                    {/* Standard conditions dropdown */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Standard Condition
                      </label>
                      <select
                        value={selectedCondition}
                        onChange={(e) => {
                          const cond = STANDARD_CONDITIONS.find(c => c.name === e.target.value);
                          if (cond) handleAddCondition(cond);
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select condition...</option>
                        {availableConditions.map(c => (
                          <option key={c.name} value={c.name}>
                            {c.decaying ? '⏳ ' : ''}{c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Custom condition input */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Custom Condition
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={customConditionName}
                          onChange={(e) => setCustomConditionName(e.target.value)}
                          placeholder="Enter condition name..."
                          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                        />
                        <button
                          onClick={handleAddCustom}
                          disabled={!customConditionName.trim()}
                          className={cn(
                            'px-2 py-1 text-sm font-medium rounded transition-colors',
                            customConditionName.trim()
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          )}
                        >
                          Add
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Custom conditions are decaying by default
                      </p>
                    </div>
                  </div>
                  
                  {/* Close button */}
                  <button
                    onClick={() => setShowAddMenu(false)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Legend */}
          {!compact && conditions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <span>⏳</span> Decaying (reduces by 1 each turn)
              </span>
              <span className="flex items-center gap-1">
                <Info className="w-3 h-3" /> Click for description
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
