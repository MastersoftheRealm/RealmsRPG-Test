'use client';

/**
 * SkillRow - Unified Skill Display Component
 * ==========================================
 * A shared component for displaying skills consistently across:
 * - Character Sheet (skills-section.tsx)
 * - Character Creator (skills-step.tsx)
 * - Creature Creator (page.tsx)
 * 
 * This component handles the visual presentation of a single skill row,
 * while the parent components handle state management and data fetching.
 * 
 * Design Patterns:
 * - Consistent proficiency dot styling (blue=proficient, orange=not)
 * - Sub-skill indentation with "└" or "↳" prefix
 * - Ability badge/abbreviation display
 * - Bonus display with +/- coloring
 * - Edit controls (+/- steppers) when in edit mode
 * - Roll button integration (optional)
 * - Species skill highlighting
 */

import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ABILITY_ABBR, ABILITY_OPTIONS } from '@/lib/constants/skills';
import { formatBonus } from '@/lib/utils';
import { IconButton } from '@/components/ui';
import { ValueStepper, RollButton } from '@/components/shared';

// =============================================================================
// Types
// =============================================================================

export interface SkillRowProps {
  /** Unique skill ID */
  id: string;
  /** Skill name */
  name: string;
  /** Is this a sub-skill? */
  isSubSkill?: boolean;
  /** Base skill name (for sub-skills) */
  baseSkillName?: string;
  
  // ----- Proficiency -----
  /** Is the skill proficient? */
  proficient?: boolean;
  /** Can proficiency be toggled? (not for species skills) */
  canToggleProficiency?: boolean;
  /** Callback to toggle proficiency */
  onToggleProficiency?: () => void;
  
  // ----- Skill Values -----
  /** Skill training value (allocated points) */
  value: number;
  /** The calculated bonus (ability + skill value) */
  bonus: number;
  
  // ----- Ability -----
  /** Primary ability for this skill */
  ability?: string;
  /** Available abilities to choose from (for multi-ability skills) */
  availableAbilities?: string[];
  /** Callback when ability selection changes */
  onAbilityChange?: (ability: string) => void;
  
  // ----- Edit Mode -----
  /** Is edit mode active? */
  isEditing?: boolean;
  /** Callback when skill value changes */
  onValueChange?: (delta: number) => void;
  /** Minimum value (usually 0) */
  minValue?: number;
  /** Can the value be increased? (check for available points) */
  canIncrease?: boolean;
  
  // ----- Remove -----
  /** Callback to remove this skill */
  onRemove?: () => void;
  
  // ----- Roll -----
  /** Show roll button? */
  showRollButton?: boolean;
  /** Callback when roll button clicked */
  onRoll?: () => void;
  
  // ----- Special States -----
  /** Is this a species-granted skill? */
  isSpeciesSkill?: boolean;
  /** Is this skill locked (can't be edited)? */
  isLocked?: boolean;
  /** Is the skill unlocked/available? (for sub-skills that require base proficiency) */
  isUnlocked?: boolean;
  /** Lock message (e.g., "Requires base skill") */
  lockMessage?: string;
  
  // ----- Styling -----
  /** Display variant */
  variant?: 'table' | 'card' | 'compact';
  /** Additional className */
  className?: string;
}

// Constants imported from @/lib/constants/skills

// =============================================================================
// Component
// =============================================================================

export function SkillRow({
  id,
  name,
  isSubSkill = false,
  baseSkillName,
  proficient = false,
  canToggleProficiency = false,
  onToggleProficiency,
  value,
  bonus,
  ability,
  availableAbilities,
  onAbilityChange,
  isEditing = false,
  onValueChange,
  minValue = 0,
  canIncrease = true,
  onRemove,
  showRollButton = false,
  onRoll,
  isSpeciesSkill = false,
  isLocked = false,
  isUnlocked = true,
  lockMessage,
  variant = 'table',
  className,
}: SkillRowProps) {
  const abilityAbbr = ABILITY_ABBR[(ability || 'strength').toLowerCase()] || 'STR';
  
  // Filter available abilities for dropdown
  const abilityOptions = availableAbilities && availableAbilities.length > 0
    ? ABILITY_OPTIONS.filter(opt => 
        availableAbilities.some(a => a.toLowerCase() === opt.value)
      )
    : ABILITY_OPTIONS;
  
  // Render table row variant
  if (variant === 'table') {
    return (
      <tr 
        className={cn(
          'border-b border-border-subtle transition-colors',
          isSubSkill ? 'bg-surface-alt' : 'bg-surface',
          !isEditing && !isLocked && 'hover:bg-blue-50 dark:hover:bg-primary-900/30',
          !isUnlocked && 'opacity-50',
          className
        )}
      >
        {/* Proficiency Dot */}
        <td className="py-2 text-center">
          {!isSubSkill && (
            <button
              onClick={() => canToggleProficiency && onToggleProficiency?.()}
              disabled={!canToggleProficiency || isLocked || isSpeciesSkill}
              className={cn(
                'w-4 h-4 rounded-full inline-block transition-all',
                proficient 
                  ? 'bg-blue-600 border-2 border-blue-600' 
                  : 'bg-orange-400 border-2 border-orange-400',
                canToggleProficiency && !isLocked && !isSpeciesSkill && 'cursor-pointer hover:scale-110',
                (isLocked || isSpeciesSkill) && 'opacity-70'
              )}
              title={isSpeciesSkill 
                ? 'Species skill (locked)' 
                : proficient 
                  ? 'Proficient (click to toggle)' 
                  : 'Not proficient (click to toggle)'
              }
            />
          )}
        </td>
        
        {/* Skill Name */}
        <td className={cn(
          'py-2 pl-2 font-medium',
          isSubSkill ? 'text-text-muted italic' : 'text-text-primary',
          !isUnlocked && 'text-text-muted'
        )}>
          {isSubSkill && <span className="text-text-muted mr-1">└</span>}
          {name}
          {isSpeciesSkill && (
            <span className="ml-1 text-xs text-text-muted">(Species)</span>
          )}
        </td>
        
        {/* Ability */}
        <td className="py-2 text-center">
          {isEditing && onAbilityChange && abilityOptions.length > 1 ? (
            <select
              value={ability || abilityOptions[0]?.value || 'strength'}
              onChange={(e) => onAbilityChange(e.target.value)}
              className="text-xs px-1 py-0.5 rounded border border-border-light bg-surface-alt text-text-secondary cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              {abilityOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-text-muted font-semibold">
              {abilityAbbr}
            </span>
          )}
        </td>
        
        {/* Bonus / Roll Button */}
        <td className="py-2 text-center">
          {isEditing || !showRollButton ? (
            <span className={cn(
              'inline-block min-w-[40px] font-bold',
              bonus > 0 ? 'text-green-600' : bonus < 0 ? 'text-red-600' : 'text-text-secondary'
            )}>
              {formatBonus(bonus)}
            </span>
          ) : (
            <RollButton
              value={bonus}
              onClick={() => onRoll?.()}
              size="sm"
              title={`Roll ${name}`}
            />
          )}
        </td>
        
        {/* Value Stepper (edit mode) */}
        {isEditing && onValueChange && (
          <td className="py-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => onValueChange(-1)}
                disabled={value <= minValue && !proficient}
                className={cn(
                  'w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-colors',
                  (value > minValue || proficient)
                    ? 'bg-surface hover:bg-surface-alt text-text-secondary'
                    : 'bg-surface text-border-light cursor-not-allowed'
                )}
              >
                −
              </button>
              <span className="w-6 text-center font-mono text-sm">
                {value}
              </span>
              <button
                onClick={() => canIncrease && onValueChange(1)}
                disabled={!canIncrease}
                className={cn(
                  'w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-colors',
                  canIncrease
                    ? 'bg-surface hover:bg-surface-alt text-text-secondary'
                    : 'bg-surface text-border-light cursor-not-allowed'
                )}
              >
                +
              </button>
            </div>
          </td>
        )}
        
        {/* Remove button (edit mode) - simple red X matching add button style */}
        {isEditing && onRemove && (
          <td className="py-2 text-center">
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => onRemove()}
              label="Remove skill"
              className="text-danger hover:text-danger-600 hover:bg-transparent"
            >
              <X className="w-4 h-4" />
            </IconButton>
          </td>
        )}
      </tr>
    );
  }
  
  // Render card variant (used in creator step)
  if (variant === 'card') {
    return (
      <div className={cn(
        'p-3 rounded-lg border transition-colors',
        isSpeciesSkill ? 'bg-blue-50 dark:bg-primary-900/30 border-blue-200 dark:border-primary-600/50' : 
          value > 0 ? 'bg-primary-50 border-primary-200' : 'bg-surface-alt border-border-light',
        !isUnlocked && 'opacity-50',
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Remove button for creatures - simple red X matching add button style */}
            {onRemove && (
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => onRemove()}
                label="Remove skill"
                className="text-danger hover:text-danger-600 hover:bg-transparent"
              >
                <X className="w-4 h-4" />
              </IconButton>
            )}
            
            {/* Proficiency dot */}
            <div 
              className={cn(
                'w-4 h-4 rounded-full border-2',
                proficient 
                  ? 'bg-primary-600 border-primary-600' 
                  : 'bg-orange-400 border-orange-400'
              )}
              title={proficient ? 'Proficient' : 'Not proficient'}
            />
            
            {/* Name and ability */}
            <div className="flex flex-col">
              <span className="font-medium text-text-primary">{name}</span>
              {ability && (
                <span className="text-xs text-text-muted capitalize">{ability}</span>
              )}
            </div>
            
            {isSpeciesSkill && (
              <span className="text-xs text-blue-600 font-medium">(Species +1 Free)</span>
            )}
          </div>
          
          {/* Controls on the right */}
          <div className="flex items-center gap-2">
            {isUnlocked ? (
              <>
                {onValueChange && (
                  <ValueStepper
                    value={value}
                    onChange={(newValue) => onValueChange(newValue - value)}
                    min={isSpeciesSkill ? 1 : minValue}
                    max={canIncrease ? undefined : value}
                    size="sm"
                  />
                )}
                {/* Bonus display */}
                <span className={cn(
                  'w-12 text-right font-bold',
                  bonus > 0 ? 'text-green-600' : bonus < 0 ? 'text-red-600' : 'text-text-muted'
                )}>
                  {formatBonus(bonus)}
                </span>
              </>
            ) : (
              <span className="text-xs text-text-muted italic">
                {lockMessage || `Requires ${baseSkillName || 'base skill'}`}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Render compact variant (for sub-skills in creator)
  if (variant === 'compact') {
    return (
      <div className={cn(
        'p-2 rounded-lg border transition-colors text-sm',
        isSpeciesSkill ? 'bg-blue-50 dark:bg-primary-900/30 border-blue-200 dark:border-primary-600/50' :
          !isUnlocked && 'opacity-50 bg-surface border-border-light',
        isUnlocked && value > 0 && 'bg-primary-50 border-primary-200',
        isUnlocked && value === 0 && 'bg-surface-alt border-border-light',
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">↳</span>
            <span className={cn(
              'font-medium',
              isSpeciesSkill ? 'text-blue-700' :
                isUnlocked ? 'text-text-primary' : 'text-text-muted'
            )}>
              {name}
            </span>
            {isSpeciesSkill && (
              <span className="text-xs text-blue-600 font-medium">(+1 Free)</span>
            )}
          </div>
          
          {isUnlocked || isSpeciesSkill ? (
            <div className="flex items-center gap-2">
              {onValueChange && (
                <ValueStepper
                  value={isSpeciesSkill ? Math.max(1, value) : value}
                  onChange={(newValue) => onValueChange(newValue - (isSpeciesSkill ? Math.max(1, value) : value))}
                  min={isSpeciesSkill ? 1 : minValue}
                  max={canIncrease ? undefined : value}
                  size="xs"
                />
              )}
            </div>
          ) : (
            <span className="text-xs text-text-muted italic">
              {lockMessage || `Requires ${baseSkillName || 'base skill'}`}
            </span>
          )}
        </div>
      </div>
    );
  }
  
  return null;
}

export default SkillRow;
