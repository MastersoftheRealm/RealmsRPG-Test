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

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import { useRollsOptional } from './roll-context';
import type { Abilities } from '@/types';

interface Skill {
  id: string;
  name: string;
  category?: string;
  skill_val: number;
  prof?: boolean;
  baseSkill?: string;
  ability?: string;
}

interface SkillsSectionProps {
  skills: Skill[];
  abilities: Abilities;
  isEditMode?: boolean;
  totalSkillPoints?: number;
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

// Roll button styled like vanilla site
function SkillRollButton({ 
  value, 
  onClick, 
  title 
}: { 
  value: string; 
  onClick?: () => void; 
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'px-3 py-1.5 min-w-[52px] text-sm font-bold text-white rounded-md',
        'bg-gradient-to-br from-blue-500 to-blue-700',
        'hover:from-blue-600 hover:to-blue-800 hover:scale-105',
        'active:scale-95 transition-all duration-150 shadow-sm'
      )}
    >
      {value}
    </button>
  );
}

export function SkillsSection({
  skills,
  abilities,
  isEditMode = false,
  totalSkillPoints,
  onSkillChange,
  onRemoveSkill,
  onAddSkill,
  onAddSubSkill,
}: SkillsSectionProps) {
  const rollContext = useRollsOptional();
  
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
  
  // Calculate bonus for a skill
  const getSkillBonus = (skill: Skill): number => {
    const abilityKey = (skill.ability || 'strength').toLowerCase() as keyof Abilities;
    const abilityValue = abilities[abilityKey] ?? 0;
    const skillValue = skill.skill_val || 0;
    
    // Prof bonus for base skills, or parent prof for sub-skills
    let profBonus = 0;
    if (skill.baseSkill) {
      // Sub-skill: check if parent is proficient
      const parent = skills.find(s => s.name === skill.baseSkill);
      profBonus = parent?.prof ? 1 : 0;
    } else {
      profBonus = skill.prof ? 1 : 0;
    }
    
    // Unprof penalty: if ability is negative, double it; otherwise divide by 2
    if (!skill.prof && !skill.baseSkill) {
      const unprofPenalty = abilityValue < 0 ? abilityValue : Math.floor(abilityValue / 2);
      return skillValue + unprofPenalty;
    }
    
    return abilityValue + skillValue + profBonus;
  };
  
  // Get point tracker color classes
  const getPointColorClasses = () => {
    if (remaining === undefined) return 'bg-gray-100 text-gray-600 border-gray-200';
    if (remaining > 0) return 'bg-green-100 text-green-700 border-green-200';
    if (remaining < 0) return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Skills</h2>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <>
              <button
                onClick={onAddSkill}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-sm font-medium transition-colors"
                title="Add Skill"
              >
                <Plus size={14} />
                Skill
              </button>
              <button
                onClick={onAddSubSkill}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-teal-100 hover:bg-teal-200 text-teal-700 text-sm font-medium transition-colors"
                title="Add Sub-Skill"
              >
                <Plus size={14} />
                Sub-Skill
              </button>
            </>
          )}
          {totalSkillPoints !== undefined && (
            <span className={cn(
              'px-3 py-1 rounded-full text-sm font-semibold border',
              getPointColorClasses()
            )}>
              {remaining} / {totalSkillPoints}
            </span>
          )}
        </div>
      </div>
      
      {/* Skills Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase tracking-wider border-b-2 border-gray-200">
              <th className="w-10 py-2 text-center">Prof</th>
              <th className="text-left py-2 pl-2">Skill</th>
              <th className="w-16 py-2 text-center">Ability</th>
              <th className="w-20 py-2 text-center">Bonus</th>
              {isEditMode && <th className="w-24 py-2 text-center">Value</th>}
              {isEditMode && <th className="w-8 py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {orderedSkills.map((skill) => {
              const isSubSkill = Boolean(skill.baseSkill);
              const bonus = getSkillBonus(skill);
              const abilityAbbr = ABILITY_ABBR[(skill.ability || 'strength').toLowerCase()] || 'STR';
              
              return (
                <tr 
                  key={skill.id} 
                  className={cn(
                    'border-b border-gray-100 transition-colors',
                    isSubSkill ? 'bg-gray-50' : 'bg-white',
                    !isEditMode && 'hover:bg-blue-50'
                  )}
                >
                  {/* Proficiency Dot */}
                  <td className="py-2 text-center">
                    {!isSubSkill && (
                      <button
                        onClick={() => isEditMode && onSkillChange?.(skill.id, { prof: !skill.prof })}
                        disabled={!isEditMode}
                        className={cn(
                          'w-4 h-4 rounded-full inline-block transition-all',
                          skill.prof 
                            ? 'bg-blue-600 border-2 border-blue-600' 
                            : 'bg-orange-400 border-2 border-orange-400',
                          isEditMode && 'cursor-pointer hover:scale-110'
                        )}
                        title={skill.prof ? 'Proficient (click to toggle)' : 'Not proficient (click to toggle)'}
                      />
                    )}
                  </td>
                  
                  {/* Skill Name */}
                  <td className={cn(
                    'py-2 pl-2 font-medium',
                    isSubSkill ? 'text-gray-500 italic' : 'text-gray-800'
                  )}>
                    {isSubSkill && <span className="text-gray-400 mr-1">└</span>}
                    {skill.name}
                  </td>
                  
                  {/* Ability */}
                  <td className="py-2 text-center">
                    {isEditMode && onSkillChange ? (
                      <select
                        value={skill.ability || 'strength'}
                        onChange={(e) => onSkillChange(skill.id, { ability: e.target.value })}
                        className="text-xs px-1 py-0.5 rounded border border-gray-300 bg-gray-50 text-gray-600 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ABILITY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-gray-500 font-semibold">
                        {abilityAbbr}
                      </span>
                    )}
                  </td>
                  
                  {/* Bonus Roll Button */}
                  <td className="py-2 text-center">
                    {isEditMode ? (
                      <span className={cn(
                        'inline-block min-w-[40px] font-bold',
                        bonus > 0 ? 'text-green-600' : bonus < 0 ? 'text-red-600' : 'text-gray-600'
                      )}>
                        {formatBonus(bonus)}
                      </span>
                    ) : (
                      <SkillRollButton
                        value={formatBonus(bonus)}
                        onClick={() => rollContext?.rollSkill?.(skill.name, bonus)}
                        title={`Roll ${skill.name}`}
                      />
                    )}
                  </td>
                  
                  {/* Skill Value +/- (edit mode) */}
                  {isEditMode && (
                    <td className="py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSkillChange?.(skill.id, { skill_val: Math.max(0, skill.skill_val - 1) })}
                          disabled={skill.skill_val <= 0}
                          className={cn(
                            'w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-colors',
                            skill.skill_val > 0
                              ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          )}
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-mono text-sm">
                          {skill.skill_val}
                        </span>
                        <button
                          onClick={() => onSkillChange?.(skill.id, { skill_val: skill.skill_val + 1 })}
                          className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-700 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </td>
                  )}
                  
                  {/* Remove button (edit mode) */}
                  {isEditMode && (
                    <td className="py-2 text-center">
                      {onRemoveSkill && (
                        <button
                          onClick={() => onRemoveSkill(skill.id)}
                          className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors"
                          title="Remove skill"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {orderedSkills.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No skills added yet.
            {isEditMode && ' Click "Add Skill" to get started.'}
          </div>
        )}
      </div>
    </div>
  );
}
