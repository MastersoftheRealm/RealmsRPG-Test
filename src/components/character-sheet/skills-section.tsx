/**
 * Skills Section
 * ==============
 * Displays all character skills in a flat table format matching vanilla site.
 * 
 * Layout:
 * - Table with columns: Prof (dot), Skill Name, Ability (abbr), Bonus (roll button)
 * - Sub-skills are indented with "└" prefix
 * - Roll buttons have gradient styling matching abilities section
 * 
 * Uses the shared SkillRow component for consistent skill display across the site.
 */

'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useRollsOptional } from './roll-context';
import { PointStatus, EditSectionToggle, getEditState, SkillRow } from '@/components/shared';
import { ABILITY_ABBR } from '@/lib/constants/skills';
import { Button } from '@/components/ui';
import { calculateSkillBonusWithProficiency, calculateSubSkillBonusWithProficiency } from '@/lib/game/formulas';
import type { Abilities } from '@/types';

// Game rule: skill values are capped at 3
const MAX_SKILL_VALUE = 3;

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
  /** When provided, used for PointStatus and pencil state (includes defense spending). Enables red pencil when overspent. */
  spentSkillPoints?: number;
  // Species skills are locked and can't have proficiency removed
  speciesSkills?: string[];
  onSkillChange?: (skillId: string, updates: Partial<Skill>) => void;
  onRemoveSkill?: (skillId: string) => void;
  onAddSkill?: () => void;
  onAddSubSkill?: () => void;
  className?: string;
}

// Note: ABILITY_ABBR, ABILITY_OPTIONS, formatBonus are now in SkillRow component

// Note: RollButton is now imported from @/components/shared

export function SkillsSection({
  skills,
  abilities,
  isEditMode = false,
  totalSkillPoints,
  spentSkillPoints: spentSkillPointsProp,
  speciesSkills = [],
  onSkillChange,
  onRemoveSkill,
  onAddSkill,
  onAddSubSkill,
  className,
}: SkillsSectionProps) {
  const rollContext = useRollsOptional();
  
  // Local state for whether this section is actively being edited
  const [isSectionEditing, setIsSectionEditing] = useState(false);
  
  // Derived state: is the section actually editable right now?
  const showEditControls = isEditMode && isSectionEditing;
  
  // Check if a skill is from species (locked)
  // Species skills may be stored as IDs or names, so check both
  const isSpeciesSkill = (skillName: string, skillId?: string): boolean => {
    return speciesSkills.some(ss => {
      const ssLower = String(ss).toLowerCase();
      return ssLower === skillName.toLowerCase() || 
             (skillId && ssLower === String(skillId).toLowerCase());
    });
  };
  
  // Handle proficiency toggle with proper logic
  const handleProfToggle = (skill: Skill) => {
    if (!onSkillChange) return;
    
    const isFromSpecies = isSpeciesSkill(skill.name, skill.id);
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
    const isFromSpecies = isSpeciesSkill(skill.name, skill.id);
    
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
        // Allow override: can increase past cap (red pencil indicates overspend)
        onSkillChange(skill.id, { skill_val: skill.skill_val + 1 });
      }
    } else {
      // Base skill logic
      if (!skill.prof && !isFromSpecies) {
        // Not proficient: make proficient first; value stays 0 (per GAME_RULES)
        onSkillChange(skill.id, { prof: true, skill_val: 0 });
      } else {
        // Already proficient or species skill: allow override past cap (red pencil when overspent)
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
    base.sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
    
    // Sort sub-skills within each parent
    Object.values(subByParent).forEach(subs => {
      subs.sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
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
  
  // Calculate total skill points spent on skills only (excluding species skill proficiency costs)
  const totalSpentFromSkills = useMemo(() => {
    return skills.reduce((sum, skill) => {
      let cost = skill.skill_val || 0;
      // Proficiency costs 1 for base skills, but species skills are free
      if (skill.prof && !skill.baseSkill) {
        if (!isSpeciesSkill(skill.name, skill.id)) {
          cost += 1;
        }
      }
      return sum + cost;
    }, 0);
  }, [skills]);

  // Use page-provided spent (includes defenses) when available for display and pencil state; else skills-only
  const totalSpent = spentSkillPointsProp ?? totalSpentFromSkills;
  const remaining = totalSkillPoints !== undefined ? totalSkillPoints - totalSpent : undefined;

  // Single source of truth: use shared formulas (GAME_RULES) — same as character creator and creature creator
  const getSkillBonus = (skill: Skill): number => {
    const linkedAbilities = skill.ability || 'strength';
    const skillValue = skill.skill_val ?? 0;
    const isProficient = skill.prof ?? false;
    if (skill.baseSkill) {
      const parent = skills.find((s) => s.name === skill.baseSkill);
      const baseSkillVal = parent?.skill_val ?? 0;
      const baseSkillProf = parent?.prof ?? false;
      return calculateSubSkillBonusWithProficiency(
        linkedAbilities,
        skillValue,
        baseSkillVal,
        baseSkillProf,
        abilities,
        isProficient,
        skill.ability
      );
    }
    return calculateSkillBonusWithProficiency(linkedAbilities, skillValue, abilities, isProficient, skill.ability);
  };

  // Note: PointStatus component handles color states automatically (including overspent = red)

  // Calculate edit state for pencil icon: red when overspent, green when points remaining
  const skillEditState =
    totalSkillPoints !== undefined ? getEditState(totalSpent, totalSkillPoints) : 'normal';
  
  return (
    <div className={cn("bg-surface rounded-xl shadow-md p-4 md:p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-text-primary">Skills</h2>
        <div className="flex items-center gap-2">
          {showEditControls && (
            <>
              <Button
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
          {showEditControls && totalSkillPoints !== undefined && (
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
              const isFromSpecies = isSpeciesSkill(skill.name, skill.id);
              
              return (
                <SkillRow
                  key={skill.id}
                  id={skill.id}
                  name={skill.name}
                  isSubSkill={isSubSkill}
                  baseSkillName={skill.baseSkill}
                  proficient={skill.prof || false}
                  canToggleProficiency={showEditControls && !isFromSpecies}
                  onToggleProficiency={() => handleProfToggle(skill)}
                  value={skill.skill_val}
                  bonus={bonus}
                  ability={skill.ability}
                  availableAbilities={skill.availableAbilities}
                  onAbilityChange={showEditControls && onSkillChange 
                    ? (newAbility) => onSkillChange(skill.id, { ability: newAbility })
                    : undefined
                  }
                  isEditing={showEditControls}
                  onValueChange={(delta) => {
                    if (delta > 0) {
                      handleSkillIncrease(skill);
                    } else if (delta < 0) {
                      handleSkillDecrease(skill);
                    }
                  }}
                  canIncrease={true}
                  onRemove={showEditControls && onRemoveSkill 
                    ? () => onRemoveSkill(skill.id) 
                    : undefined
                  }
                  showRollButton={!showEditControls && rollContext?.canRoll !== false}
                  onRoll={() => rollContext?.rollSkill?.(skill.name, bonus, skill.ability ? ABILITY_ABBR[skill.ability.toLowerCase()] : undefined)}
                  isSpeciesSkill={isFromSpecies}
                  variant="table"
                />
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
