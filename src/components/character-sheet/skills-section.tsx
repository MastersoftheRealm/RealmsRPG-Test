/**
 * Skills Section
 * ==============
 * Displays all character skills in a flat table format matching vanilla site.
 * 
 * Layout:
 * - Table with columns: Prof (dot), Skill Name, Ability (abbr), Bonus (roll button)
 * - Sub-skills are indented with "└" prefix
 * - Roll buttons have gradient styling matching abilities section
 */

'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import { useRollsOptional } from './roll-context';
import { RollButton, PointStatus, EditSectionToggle, getEditState } from '@/components/shared';
import { Button, IconButton } from '@/components/ui';
import type { Abilities } from '@/types';

interface Skill {
  id: string;
  name: string;
  category?: string;
  skill_val: number;
  prof?: boolean;
  baseSkill?: string;
  ability?: string;
  // Available abilities for this skill (from RTDB)
  availableAbilities?: string[];
}

interface SkillsSectionProps {
  skills: Skill[];
  abilities: Abilities;
  isEditMode?: boolean;
  totalSkillPoints?: number;
  // Species skills are locked and can't have proficiency removed
  speciesSkills?: string[];
  onSkillChange?: (skillId: string, updates: Partial<Skill>) => void;
  onRemoveSkill?: (skillId: string) => void;
  onAddSkill?: () => void;
  onAddSubSkill?: () => void;
}

const ABILITY_ABBR: Record<string, string> = {
  strength: 'STR',
  vitality: 'VIT',
  agility: 'AGI',
  acuity: 'ACU',
  intelligence: 'INT',
  charisma: 'CHA',
};

const ABILITY_OPTIONS = [
  { value: 'strength', label: 'STR' },
  { value: 'vitality', label: 'VIT' },
  { value: 'agility', label: 'AGI' },
  { value: 'acuity', label: 'ACU' },
  { value: 'intelligence', label: 'INT' },
  { value: 'charisma', label: 'CHA' },
];

function formatBonus(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

// Note: RollButton is now imported from @/components/shared

export function SkillsSection({
  skills,
  abilities,
  isEditMode = false,
  totalSkillPoints,
  speciesSkills = [],
  onSkillChange,
  onRemoveSkill,
  onAddSkill,
  onAddSubSkill,
}: SkillsSectionProps) {
  const rollContext = useRollsOptional();
  
  // Local state for whether this section is actively being edited
  const [isSectionEditing, setIsSectionEditing] = useState(false);
  
  // Derived state: is the section actually editable right now?
  const showEditControls = isEditMode && isSectionEditing;
  
  // Check if a skill is from species (locked)
  const isSpeciesSkill = (skillName: string): boolean => {
    return speciesSkills.includes(skillName);
  };
  
  // Handle proficiency toggle with proper logic
  const handleProfToggle = (skill: Skill) => {
    if (!onSkillChange) return;
    
    const isFromSpecies = isSpeciesSkill(skill.name);
    if (isFromSpecies) return; // Species skills can't have proficiency toggled
    
    if (skill.prof) {
      // Removing proficiency: also reset skill_val to 0
      onSkillChange(skill.id, { prof: false, skill_val: 0 });
    } else {
      // Adding proficiency
      onSkillChange(skill.id, { prof: true });
    }
  };
  
  // Handle skill value increase with proper logic
  const handleSkillIncrease = (skill: Skill) => {
    if (!onSkillChange) return;
    
    const isSubSkill = Boolean(skill.baseSkill);
    const isFromSpecies = isSpeciesSkill(skill.name);
    
    if (isSubSkill) {
      // Sub-skill logic
      const parent = skills.find(s => s.name === skill.baseSkill);
      if (!skill.prof) {
        // Not proficient: check base skill proficiency first
        if (!parent?.prof) {
          // Can't become proficient if parent isn't proficient
          return;
        }
        // Make proficient and set skill_val to 1
        onSkillChange(skill.id, { prof: true, skill_val: 1 });
      } else {
        // Already proficient: increase skill_val
        onSkillChange(skill.id, { skill_val: skill.skill_val + 1 });
      }
    } else {
      // Base skill logic
      if (!skill.prof && !isFromSpecies) {
        // Not proficient: make proficient first (don't increase value)
        onSkillChange(skill.id, { prof: true });
      } else {
        // Already proficient or species skill: increase skill_val
        onSkillChange(skill.id, { skill_val: skill.skill_val + 1 });
      }
    }
  };
  
  // Handle skill value decrease
  const handleSkillDecrease = (skill: Skill) => {
    if (!onSkillChange) return;
    
    const isSubSkill = Boolean(skill.baseSkill);
    
    if (isSubSkill) {
      if (skill.prof && skill.skill_val <= 1) {
        // Can't go below 1 if proficient: remove proficiency
        onSkillChange(skill.id, { prof: false, skill_val: 0 });
      } else if (skill.skill_val > 0) {
        onSkillChange(skill.id, { skill_val: skill.skill_val - 1 });
      }
    } else {
      if (skill.skill_val > 0) {
        onSkillChange(skill.id, { skill_val: skill.skill_val - 1 });
      }
    }
  };
  
  // Separate base skills and sub-skills, then sort for display
  const { baseSkills, subSkillsByParent } = useMemo(() => {
    const base: Skill[] = [];
    const subByParent: Record<string, Skill[]> = {};
    
    skills.forEach(skill => {
      if (skill.baseSkill) {
        if (!subByParent[skill.baseSkill]) {
          subByParent[skill.baseSkill] = [];
        }
        subByParent[skill.baseSkill].push(skill);
      } else {
        base.push(skill);
      }
    });
    
    // Sort base skills alphabetically
    base.sort((a, b) => a.name.localeCompare(b.name));
    
    // Sort sub-skills within each parent
    Object.values(subByParent).forEach(subs => {
      subs.sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return { baseSkills: base, subSkillsByParent: subByParent };
  }, [skills]);
  
  // Build ordered list: base skill followed by its sub-skills
  const orderedSkills = useMemo(() => {
    const result: Skill[] = [];
    baseSkills.forEach(skill => {
      result.push(skill);
      const subs = subSkillsByParent[skill.name];
      if (subs) {
        result.push(...subs);
      }
    });
    return result;
  }, [baseSkills, subSkillsByParent]);
  
  // Calculate total skill points spent
  const totalSpent = useMemo(() => {
    return skills.reduce((sum, skill) => {
      let cost = skill.skill_val || 0;
      // Proficiency costs 1 for base skills only
      if (skill.prof && !skill.baseSkill) {
        cost += 1;
      }
      return sum + cost;
    }, 0);
  }, [skills]);
  
  const remaining = totalSkillPoints !== undefined ? totalSkillPoints - totalSpent : undefined;
  
  // Calculate bonus for a skill - matches vanilla site logic
  const getSkillBonus = (skill: Skill): number => {
    const abilityKey = (skill.ability || 'strength').toLowerCase() as keyof Abilities;
    const abilityValue = abilities[abilityKey] ?? 0;
    const skillValue = skill.skill_val || 0;
    
    // Helper: calculate unproficient bonus
    // If ability is negative, double it; otherwise divide by 2 (rounded down)
    const unprofBonus = (aVal: number): number => {
      return aVal < 0 ? aVal * 2 : Math.floor(aVal / 2);
    };
    
    if (skill.baseSkill) {
      // Sub-skill logic
      const parent = skills.find(s => s.name === skill.baseSkill);
      const baseSkillVal = parent?.skill_val || 0;
      const baseSkillProf = parent?.prof || false;
      
      if (!baseSkillProf) {
        // Base skill not proficient: use unproficient calculation
        return unprofBonus(abilityValue) + baseSkillVal;
      } else if (skill.prof) {
        // Both proficient: ability + skill_val + baseSkillVal
        return abilityValue + skillValue + baseSkillVal;
      } else {
        // Base proficient, sub-skill not: ability + baseSkillVal
        return abilityValue + baseSkillVal;
      }
    } else {
      // Base skill logic
      if (skill.prof) {
        // Proficient: ability + skill_val
        return abilityValue + skillValue;
      } else {
        // Unproficient: unprofBonus(ability)
        return unprofBonus(abilityValue);
      }
    }
  };
  
  // Note: PointStatus component handles color states automatically
  
  // Calculate edit state for pencil icon color
  const skillEditState = totalSkillPoints !== undefined 
    ? getEditState(totalSpent, totalSkillPoints)
    : 'normal';
  
  return (
    <div className="bg-surface rounded-xl shadow-md p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-text-primary">Skills</h2>
        <div className="flex items-center gap-2">
          {showEditControls && (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={onAddSkill}
              >
                <Plus size={14} />
                Skill
              </Button>
              <Button
                size="sm"
                onClick={onAddSubSkill}
                className="bg-teal-100 hover:bg-teal-200 text-teal-700"
              >
                <Plus size={14} />
                Sub-Skill
              </Button>
            </>
          )}
          {totalSkillPoints !== undefined && (
            <PointStatus
              total={totalSkillPoints}
              spent={totalSpent}
              variant="compact"
            />
          )}
          {/* Edit Mode Indicator - Pencil Icon after skill points */}
          {isEditMode && (
            <EditSectionToggle 
              state={skillEditState}
              isActive={isSectionEditing}
              onClick={() => setIsSectionEditing(prev => !prev)}
              title={
                isSectionEditing
                  ? 'Click to close editing'
                  : skillEditState === 'has-points' 
                    ? 'Click to edit - you have skill points to spend' 
                    : skillEditState === 'over-budget'
                      ? 'Click to edit - over budget, remove skill points'
                      : 'Click to edit skills'
              }
            />
          )}
        </div>
      </div>
      
      {/* Skills Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-text-muted uppercase tracking-wider border-b-2 border-border-light">
              <th className="w-10 py-2 text-center">Prof</th>
              <th className="text-left py-2 pl-2">Skill</th>
              <th className="w-16 py-2 text-center">Ability</th>
              <th className="w-20 py-2 text-center">Bonus</th>
              {showEditControls && <th className="w-24 py-2 text-center">Value</th>}
              {showEditControls && <th className="w-8 py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {orderedSkills.map((skill) => {
              const isSubSkill = Boolean(skill.baseSkill);
              const bonus = getSkillBonus(skill);
              const abilityAbbr = ABILITY_ABBR[(skill.ability || 'strength').toLowerCase()] || 'STR';
              const isFromSpecies = isSpeciesSkill(skill.name);
              
              // Get available abilities for this skill (from RTDB data or fallback to all)
              const skillAbilityOptions = skill.availableAbilities && skill.availableAbilities.length > 0
                ? ABILITY_OPTIONS.filter(opt => 
                    skill.availableAbilities!.some(a => a.toLowerCase() === opt.value)
                  )
                : ABILITY_OPTIONS;
              
              return (
                <tr 
                  key={skill.id} 
                  className={cn(
                    'border-b border-border-subtle transition-colors',
                    isSubSkill ? 'bg-surface-alt' : 'bg-surface',
                    !showEditControls && 'hover:bg-blue-50'
                  )}
                >
                  {/* Proficiency Dot */}
                  <td className="py-2 text-center">
                    {!isSubSkill && (
                      <button
                        onClick={() => showEditControls && handleProfToggle(skill)}
                        disabled={!showEditControls || isFromSpecies}
                        className={cn(
                          'w-4 h-4 rounded-full inline-block transition-all',
                          skill.prof 
                            ? 'bg-blue-600 border-2 border-blue-600' 
                            : 'bg-orange-400 border-2 border-orange-400',
                          showEditControls && !isFromSpecies && 'cursor-pointer hover:scale-110',
                          isFromSpecies && 'opacity-70'
                        )}
                        title={isFromSpecies 
                          ? 'Species skill (locked)' 
                          : skill.prof 
                            ? 'Proficient (click to toggle)' 
                            : 'Not proficient (click to toggle)'
                        }
                      />
                    )}
                  </td>
                  
                  {/* Skill Name */}
                  <td className={cn(
                    'py-2 pl-2 font-medium',
                    isSubSkill ? 'text-text-muted italic' : 'text-text-primary'
                  )}>
                    {isSubSkill && <span className="text-text-muted mr-1">└</span>}
                    {skill.name}
                    {isFromSpecies && (
                      <span className="ml-1 text-xs text-text-muted">(Species)</span>
                    )}
                  </td>
                  
                  {/* Ability */}
                  <td className="py-2 text-center">
                    {showEditControls && onSkillChange && skillAbilityOptions.length > 1 ? (
                      <select
                        value={skill.ability || skillAbilityOptions[0]?.value || 'strength'}
                        onChange={(e) => onSkillChange(skill.id, { ability: e.target.value })}
                        className="text-xs px-1 py-0.5 rounded border border-border-light bg-surface-alt text-text-secondary cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {skillAbilityOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-text-muted font-semibold">
                        {abilityAbbr}
                      </span>
                    )}
                  </td>
                  
                  {/* Bonus Roll Button */}
                  <td className="py-2 text-center">
                    {showEditControls ? (
                      <span className={cn(
                        'inline-block min-w-[40px] font-bold',
                        bonus > 0 ? 'text-green-600' : bonus < 0 ? 'text-red-600' : 'text-text-secondary'
                      )}>
                        {formatBonus(bonus)}
                      </span>
                    ) : (
                      <RollButton
                        value={bonus}
                        onClick={() => rollContext?.rollSkill?.(skill.name, bonus)}
                        size="sm"
                        title={`Roll ${skill.name}`}
                      />
                    )}
                  </td>
                  
                  {/* Skill Value +/- (edit mode) */}
                  {showEditControls && (
                    <td className="py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleSkillDecrease(skill)}
                          disabled={skill.skill_val <= 0 && !skill.prof}
                          className={cn(
                            'w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-colors',
                            (skill.skill_val > 0 || skill.prof)
                              ? 'bg-surface hover:bg-surface-alt text-text-secondary'
                              : 'bg-surface text-border-light cursor-not-allowed'
                          )}
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-mono text-sm">
                          {skill.skill_val}
                        </span>
                        <button
                          onClick={() => handleSkillIncrease(skill)}
                          className="w-6 h-6 rounded bg-surface hover:bg-surface-alt flex items-center justify-center text-sm font-bold text-text-secondary transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </td>
                  )}
                  
                  {/* Remove button (edit mode) */}
                  {showEditControls && (
                    <td className="py-2 text-center">
                      {onRemoveSkill && (
                        <IconButton
                          variant="danger"
                          size="sm"
                          onClick={() => onRemoveSkill(skill.id)}
                          label="Remove skill"
                        >
                          <X className="w-4 h-4" />
                        </IconButton>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {orderedSkills.length === 0 && (
          <div className="text-center py-8 text-text-muted">
            No skills added yet.
            {showEditControls && ' Click "Add Skill" to get started.'}
          </div>
        )}
      </div>
    </div>
  );
}
