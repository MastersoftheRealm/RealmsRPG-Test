/**
 * Skills Section
 * ==============
 * Displays character skills organized by category
 * Clicking a skill in view mode rolls a d20 + skill bonus
 */

'use client';

import { useState } from 'react';
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
  ability?: string; // Associated ability for this skill
}

const ABILITY_OPTIONS = [
  { value: 'strength', label: 'STR' },
  { value: 'vitality', label: 'VIT' },
  { value: 'agility', label: 'AGI' },
  { value: 'acuity', label: 'ACU' },
  { value: 'intelligence', label: 'INT' },
  { value: 'charisma', label: 'CHA' },
];

interface SkillsSectionProps {
  skills: Skill[];
  abilities: Abilities;
  isEditMode?: boolean;
  totalSkillPoints?: number; // Total available skill points for the character
  onSkillChange?: (skillId: string, updates: Partial<Skill>) => void;
  onRemoveSkill?: (skillId: string) => void;
  onAddSkill?: () => void;
  onAddSubSkill?: () => void;
}

const SKILL_CATEGORIES = [
  { id: 'combat', name: 'Combat', icon: '⚔️' },
  { id: 'physical', name: 'Physical', icon: '🏃' },
  { id: 'knowledge', name: 'Knowledge', icon: '📚' },
  { id: 'social', name: 'Social', icon: '💬' },
  { id: 'other', name: 'Other', icon: '⭐' },
];

function SkillRow({
  skill,
  isEditMode,
  onToggleProf,
  onValueChange,
  onAbilityChange,
  onRemove,
  onRoll,
}: {
  skill: Skill;
  isEditMode?: boolean;
  onToggleProf?: () => void;
  onValueChange?: (value: number) => void;
  onAbilityChange?: (ability: string) => void;
  onRemove?: () => void;
  onRoll?: () => void;
}) {
  const isSubSkill = Boolean(skill.baseSkill);
  const totalBonus = skill.skill_val + (skill.prof ? 1 : 0);
  const formattedBonus = totalBonus >= 0 ? `+${totalBonus}` : `${totalBonus}`;

  // Handle row click for rolling
  const handleRowClick = (e: React.MouseEvent) => {
    // Don't roll if clicking on proficiency toggle or value buttons
    if (isEditMode) return;
    if ((e.target as HTMLElement).closest('button')) return;
    onRoll?.();
  };

  return (
    <div
      onClick={handleRowClick}
      className={cn(
        'flex items-center justify-between py-2 px-3 rounded-lg transition-colors',
        isSubSkill ? 'ml-4 bg-gray-50' : 'bg-white',
        isEditMode && 'hover:bg-gray-100',
        !isEditMode && onRoll && 'cursor-pointer hover:bg-blue-50 active:bg-blue-100'
      )}
      role={!isEditMode && onRoll ? 'button' : undefined}
      title={!isEditMode && onRoll ? `Click to roll ${skill.name}` : undefined}
    >
      <div className="flex items-center gap-2">
        {!isSubSkill && (
          <button
            onClick={onToggleProf}
            disabled={!isEditMode}
            className={cn(
              'w-4 h-4 rounded-full border-2 transition-colors',
              skill.prof 
                ? 'bg-primary-600 border-primary-600' 
                : 'bg-white border-gray-300',
              isEditMode && 'cursor-pointer hover:border-primary-400'
            )}
            title={skill.prof ? 'Proficient' : 'Not proficient'}
          />
        )}
        <span className={cn(
          'text-sm',
          isSubSkill ? 'text-gray-500 italic' : 'text-gray-700 font-medium'
        )}>
          {isSubSkill && '└ '}
          {skill.name}
        </span>
        
        {/* Ability indicator/selector */}
        {isEditMode && onAbilityChange ? (
          <select
            value={skill.ability || 'strength'}
            onChange={(e) => {
              e.stopPropagation();
              onAbilityChange(e.target.value);
            }}
            className="text-xs px-1 py-0.5 rounded border border-gray-300 bg-gray-50 text-gray-600 cursor-pointer"
            title="Select ability for this skill"
            onClick={(e) => e.stopPropagation()}
          >
            {ABILITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : skill.ability && (
          <span className="text-[10px] text-gray-400 uppercase">
            {skill.ability.slice(0, 3)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isEditMode ? (
          <>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onValueChange?.(skill.skill_val - 1)}
                className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm"
                disabled={skill.skill_val <= 0}
              >
                −
              </button>
              <span className="w-8 text-center font-mono">{skill.skill_val}</span>
              <button
                onClick={() => onValueChange?.(skill.skill_val + 1)}
                className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm"
              >
                +
              </button>
            </div>
            {/* Remove skill button */}
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors"
                title="Remove skill"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <span className={cn(
            'font-bold min-w-[40px] text-right',
            totalBonus > 0 ? 'text-green-600' : totalBonus < 0 ? 'text-red-600' : 'text-gray-600'
          )}>
            {formattedBonus}
          </span>
        )}
      </div>
    </div>
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
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const rollContext = useRollsOptional();

  // Group skills by category
  const skillsByCategory = SKILL_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = skills.filter(s => 
      (s.category?.toLowerCase() || 'other') === cat.id
    );
    return acc;
  }, {} as Record<string, Skill[]>);

  // Calculate total skill points spent
  const totalSpent = skills.reduce((sum, skill) => {
    return sum + skill.skill_val + (skill.prof ? 1 : 0);
  }, 0);

  // Calculate remaining points if total is provided
  const remaining = totalSkillPoints !== undefined ? totalSkillPoints - totalSpent : undefined;

  // Three-state color system for point display
  const getPointColorClasses = () => {
    if (remaining === undefined) return 'bg-gray-100 text-gray-600';
    if (remaining > 0) return 'bg-green-100 text-green-700'; // Has points
    if (remaining < 0) return 'bg-red-100 text-red-700'; // Over budget
    return 'bg-blue-100 text-blue-700'; // Perfect
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
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
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getPointColorClasses())}>
                {remaining !== undefined ? `${remaining} / ${totalSkillPoints}` : `${totalSpent} spent`}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {SKILL_CATEGORIES.map((category) => {
          const categorySkills = skillsByCategory[category.id] || [];
          if (categorySkills.length === 0) return null;

          const isExpanded = expandedCategory === category.id || expandedCategory === null;

          return (
            <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedCategory(
                  expandedCategory === category.id ? null : category.id
                )}
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="flex items-center gap-2 font-medium text-gray-700">
                  <span>{category.icon}</span>
                  {category.name}
                  <span className="text-xs text-gray-400">({categorySkills.length})</span>
                </span>
                <span className={cn(
                  'transition-transform',
                  isExpanded ? 'rotate-180' : ''
                )}>
                  ▼
                </span>
              </button>

              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {categorySkills.map((skill) => {
                    const totalBonus = skill.skill_val + (skill.prof ? 1 : 0);
                    return (
                      <SkillRow
                        key={skill.id}
                        skill={skill}
                        isEditMode={isEditMode}
                        onToggleProf={() => onSkillChange?.(skill.id, { prof: !skill.prof })}
                        onValueChange={(val) => onSkillChange?.(skill.id, { skill_val: val })}
                        onAbilityChange={(ability) => onSkillChange?.(skill.id, { ability })}
                        onRemove={isEditMode && onRemoveSkill ? () => onRemoveSkill(skill.id) : undefined}
                        onRoll={rollContext ? () => rollContext.rollSkill(skill.name, totalBonus) : undefined}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
