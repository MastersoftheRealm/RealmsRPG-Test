/**
 * Skills Section
 * ==============
 * Catalog-all Codex base skills (TASK-584) with proficiency / sub-skill filters.
 * Sub-skills: proficient always shown; unproficient only when user-added.
 * Spend − clears value → proficiency (and removes sub-skill when applicable); no per-row X.
 */

'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useRollsOptional } from '@/components/rolls';
import {
  PointStatus,
  getEditState,
  SkillRow,
  SectionDualModeToggles,
  SegmentedControl,
  type SectionEditMode,
} from '@/components/shared';
import { ABILITY_ABBR } from '@/lib/constants/skills';
import { Button, Card, TableScroll } from '@/components/ui';
import {
  calculateSkillBonusWithProficiency,
  calculateSubSkillBonusWithProficiency,
} from '@/lib/game/formulas';
import {
  calculateCharacterSkillPointsSpent,
  getSkillValueIncreaseCost,
  resolveSkillAllocationRules,
  buildSpeciesSkillIdSet,
} from '@/lib/game/skill-allocation';
import {
  applyTempModifier,
  getEffectiveAbilities,
  getSkillTempModifier,
  sectionHasTempModifiers,
  tempModifierValueClass,
} from '@/lib/character/temp-modifiers';
import {
  filterSheetSkillsDisplay,
  mergeSheetSkillsWithCatalog,
  type SkillProficiencyFilter,
  type SheetDisplaySkill,
} from '@/lib/character/sheet-skills-display';
import { useCodexSkills, useGameRules } from '@/hooks';
import type { Abilities, CharacterTempModifiers } from '@/types';

type Skill = SheetDisplaySkill;

interface SkillsSectionProps {
  skills: Skill[];
  abilities: Abilities;
  isEditMode?: boolean;
  totalSkillPoints?: number;
  /** When provided, used for PointStatus and pencil state (includes defense spending). Enables red pencil when overspent. */
  spentSkillPoints?: number;
  // Species skills are locked and can't have proficiency removed
  speciesSkills?: string[];
  tempModifiers?: CharacterTempModifiers;
  onTempModifiersChange?: (patch: CharacterTempModifiers) => void;
  onSkillChange?: (skillId: string, updates: Partial<Skill>) => void;
  onRemoveSkill?: (skillId: string) => void;
  onAddSubSkill?: () => void;
  className?: string;
}

export function SkillsSection({
  skills,
  abilities,
  isEditMode = false,
  totalSkillPoints,
  spentSkillPoints: spentSkillPointsProp,
  speciesSkills = [],
  tempModifiers,
  onTempModifiersChange,
  onSkillChange,
  onRemoveSkill,
  onAddSubSkill,
  className,
}: SkillsSectionProps) {
  const rollContext = useRollsOptional();
  const { rules } = useGameRules();
  const skillRules = resolveSkillAllocationRules(rules);
  const { data: codexSkills = [] } = useCodexSkills();

  const [sectionMode, setSectionMode] = useState<SectionEditMode>('none');
  const [proficiencyFilter, setProficiencyFilter] = useState<SkillProficiencyFilter>('all');
  const [showSubSkills, setShowSubSkills] = useState(true);
  const showSpendControls = isEditMode && sectionMode === 'spend';
  const showTempControls = isEditMode && sectionMode === 'tempModifier';
  const showEditControls = showSpendControls || showTempControls;

  const effectiveAbilities = useMemo(
    () => getEffectiveAbilities(abilities, tempModifiers),
    [abilities, tempModifiers],
  );

  const displaySkills = useMemo(
    () =>
      filterSheetSkillsDisplay(mergeSheetSkillsWithCatalog(skills, codexSkills), {
        proficiencyFilter,
        showSubSkills,
      }),
    [skills, codexSkills, proficiencyFilter, showSubSkills],
  );

  const findParentSkill = (baseSkillName: string | undefined) =>
    baseSkillName
      ? (displaySkills.find(
          (s) =>
            !s.baseSkill &&
            String(s.name ?? '').toLowerCase() === String(baseSkillName).toLowerCase(),
        ) ??
        skills.find(
          (s) =>
            !s.baseSkill &&
            String(s.name ?? '').toLowerCase() === String(baseSkillName).toLowerCase(),
        ))
      : undefined;

  const isSpeciesSkill = (skillName: string, skillId?: string): boolean => {
    return speciesSkills.some((ss) => {
      const ssLower = String(ss).toLowerCase();
      return (
        ssLower === skillName.toLowerCase() ||
        (skillId && ssLower === String(skillId).toLowerCase())
      );
    });
  };

  /** Identity fields so catalog-only rows upsert in one onSkillChange (TASK-584). */
  const skillSeed = (skill: Skill) => ({
    name: skill.name,
    ability: skill.ability,
    availableAbilities: skill.availableAbilities,
    category: skill.category ?? skill.ability,
    ...(skill.baseSkill ? { baseSkill: skill.baseSkill } : {}),
  });

  const handleProfToggle = (skill: Skill) => {
    if (!onSkillChange) return;

    const isFromSpecies = isSpeciesSkill(skill.name, skill.id);
    if (isFromSpecies) return;

    if (skill.prof) {
      onSkillChange(skill.id, { ...skillSeed(skill), prof: false, skill_val: 0 });
    } else {
      onSkillChange(skill.id, {
        ...skillSeed(skill),
        prof: true,
        skill_val: skill.baseSkill ? Math.max(1, skill.skill_val || 0) : 0,
      });
    }
  };

  const handleSkillIncrease = (skill: Skill) => {
    if (!onSkillChange) return;

    const isSubSkill = Boolean(skill.baseSkill);
    const isFromSpecies = isSpeciesSkill(skill.name, skill.id);

    if (isSubSkill) {
      const parent = findParentSkill(skill.baseSkill);
      if (!skill.prof) {
        if (!parent?.prof) return;
        onSkillChange(skill.id, {
          ...skillSeed(skill),
          prof: true,
          skill_val: 1,
        });
      } else {
        onSkillChange(skill.id, {
          ...skillSeed(skill),
          skill_val: skill.skill_val + 1,
        });
      }
    } else if (!skill.prof && !isFromSpecies) {
      onSkillChange(skill.id, {
        ...skillSeed(skill),
        prof: true,
        skill_val: 0,
      });
    } else {
      onSkillChange(skill.id, {
        ...skillSeed(skill),
        skill_val: skill.skill_val + 1,
      });
    }
  };

  const handleSkillDecrease = (skill: Skill) => {
    if (!onSkillChange) return;

    const isSubSkill = Boolean(skill.baseSkill);
    const isFromSpecies = isSpeciesSkill(skill.name, skill.id);

    if (isSubSkill) {
      if (skill.prof && skill.skill_val > 1) {
        onSkillChange(skill.id, {
          ...skillSeed(skill),
          skill_val: skill.skill_val - 1,
        });
      } else if (skill.prof) {
        // Clear proficiency (value → 0); row stays if user-added unproficient visibility
        onSkillChange(skill.id, { ...skillSeed(skill), prof: false, skill_val: 0 });
      } else {
        // Unproficient added sub-skill: − removes from sheet
        onRemoveSkill?.(skill.id);
      }
      return;
    }

    if (skill.skill_val > 0) {
      onSkillChange(skill.id, {
        ...skillSeed(skill),
        skill_val: skill.skill_val - 1,
      });
      return;
    }
    if (skill.prof && !isFromSpecies) {
      onSkillChange(skill.id, { ...skillSeed(skill), prof: false, skill_val: 0 });
    }
  };

  const speciesSkillIdSet = useMemo(
    () =>
      buildSpeciesSkillIdSet(
        speciesSkills.filter((ss) => ss !== '0'),
        skills,
      ),
    [speciesSkills, skills],
  );

  const totalSpentFromSkills = useMemo(
    () => calculateCharacterSkillPointsSpent(skills, speciesSkillIdSet, undefined, rules),
    [skills, speciesSkillIdSet, rules],
  );

  const totalSpent = spentSkillPointsProp ?? totalSpentFromSkills;
  const remaining = totalSkillPoints !== undefined ? totalSkillPoints - totalSpent : undefined;

  const canIncreaseSkill = (skill: Skill): boolean => {
    if (remaining === undefined || remaining <= 0) return false;
    const isSubSkill = Boolean(skill.baseSkill);
    const isFromSpecies = isSpeciesSkill(skill.name, skill.id);

    if (isSubSkill) {
      if (!skill.prof) {
        const parent = findParentSkill(skill.baseSkill);
        if (!parent?.prof) return false;
        return remaining >= skillRules.gainProficiencyCost;
      }
      return remaining >= getSkillValueIncreaseCost(skill.skill_val, true, skillRules);
    }
    if (!skill.prof && !isFromSpecies) {
      return remaining >= skillRules.gainProficiencyCost;
    }
    return remaining >= getSkillValueIncreaseCost(skill.skill_val, false, skillRules);
  };

  const canDecreaseSkill = (skill: Skill): boolean => {
    if (showTempControls) return true;
    const isSubSkill = Boolean(skill.baseSkill);
    const isFromSpecies = isSpeciesSkill(skill.name, skill.id);
    if (isSubSkill) {
      if (skill.prof || skill.skill_val > 0) return true;
      // Unproficient user-added: − removes
      return Boolean(onRemoveSkill) && !skill.catalogOnly;
    }
    if (skill.skill_val > 0) return true;
    if (skill.prof && !isFromSpecies) return true;
    return false;
  };

  const getSkillBonus = (skill: Skill, abilitySource: Abilities): number => {
    const linkedAbilities = skill.ability || 'strength';
    const skillValue = skill.skill_val ?? 0;
    const isProficient = skill.prof ?? false;
    if (skill.baseSkill) {
      const parent = findParentSkill(skill.baseSkill);
      const baseSkillVal = parent?.skill_val ?? 0;
      const baseSkillProf = parent?.prof ?? false;
      return calculateSubSkillBonusWithProficiency(
        linkedAbilities,
        skillValue,
        baseSkillVal,
        baseSkillProf,
        abilitySource,
        isProficient,
        skill.ability,
      );
    }
    return calculateSkillBonusWithProficiency(
      linkedAbilities,
      skillValue,
      abilitySource,
      isProficient,
      skill.ability,
    );
  };

  const skillEditState =
    totalSkillPoints !== undefined ? getEditState(totalSpent, totalSkillPoints) : 'normal';
  const hasSectionTemps = sectionHasTempModifiers(tempModifiers, 'skills');

  return (
    <Card className={cn('relative p-4 shadow-md md:p-6', className)}>
      {/* DESIGN_INTENT: pencil/Temp float top-right like Abilities (TASK-584); filters below title */}
      {isEditMode && (
        <div className="absolute top-3 right-3 z-10">
          <SectionDualModeToggles
            mode={sectionMode}
            onModeChange={setSectionMode}
            spendState={skillEditState}
            hasTempModifiers={hasSectionTemps}
            spendTitle={
              skillEditState === 'has-points'
                ? 'Edit — spend skill points'
                : skillEditState === 'over-budget'
                  ? 'Edit — over budget, remove skill points'
                  : 'Edit skills'
            }
          />
        </div>
      )}

      <div className={cn('mb-4', isEditMode && 'pr-14')}>
        <h2 className="text-lg font-bold text-text-primary">Skills</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <SegmentedControl<SkillProficiencyFilter>
            aria-label="Skill proficiency filter"
            value={proficiencyFilter}
            onChange={setProficiencyFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'proficient', label: 'Proficient' },
            ]}
          />
          <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-text-secondary select-none">
            <input
              type="checkbox"
              checked={showSubSkills}
              onChange={(e) => setShowSubSkills(e.target.checked)}
              className="rounded border-border-light"
            />
            Show sub-skills
          </label>
        </div>
      </div>

      {showSpendControls && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-secondary p-3">
          {totalSkillPoints !== undefined ? (
            <PointStatus
              label="Skill Points"
              total={totalSkillPoints}
              spent={totalSpent}
              variant="inline"
              className="shrink-0 whitespace-nowrap"
            />
          ) : (
            <span />
          )}
          {onAddSubSkill && (
            <Button size="sm" onClick={onAddSubSkill} className="shrink-0">
              <Plus size={14} />
              Sub-Skill
            </Button>
          )}
        </div>
      )}

      {/* DESIGN_INTENT: narrow lg Skills column must not crush ValueStepper; edit table min-width + TableScroll (TASK-543) */}
      <TableScroll>
        <table className={cn('w-full text-sm', showEditControls && 'min-w-[28rem]')}>
          <thead>
            <tr className="border-b-2 border-border-light text-xs tracking-wider text-text-muted uppercase">
              <th className="w-10 min-w-10 py-2 text-center">Prof</th>
              <th className="py-2 pl-2 text-left">Skill</th>
              <th className="w-16 min-w-16 py-2 text-center">Ability</th>
              <th className="w-20 min-w-20 py-2 text-center">Bonus</th>
              {showEditControls && (
                <th className="w-28 min-w-[7rem] py-2 text-center whitespace-nowrap">
                  {showTempControls ? 'Temp' : 'Value'}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {displaySkills.map((skill) => {
              const isSubSkill = Boolean(skill.baseSkill);
              const skillTemp = getSkillTempModifier(tempModifiers, skill.id);
              const baseBonus = getSkillBonus(skill, abilities);
              const cascadedBonus = getSkillBonus(skill, effectiveAbilities);
              const bonus = applyTempModifier(cascadedBonus, skillTemp);
              const tintDelta = bonus - baseBonus;
              const isFromSpecies = isSpeciesSkill(skill.name, skill.id);
              const allowDecrease = canDecreaseSkill(skill);

              return (
                <SkillRow
                  key={skill.id}
                  id={skill.id}
                  name={skill.name}
                  isSubSkill={isSubSkill}
                  baseSkillName={skill.baseSkill}
                  proficient={skill.prof || false}
                  canToggleProficiency={showSpendControls && !isFromSpecies}
                  onToggleProficiency={() => handleProfToggle(skill)}
                  value={showTempControls ? skillTemp : skill.skill_val}
                  bonus={bonus}
                  bonusClassName={tempModifierValueClass(tintDelta) || undefined}
                  ability={skill.ability}
                  availableAbilities={skill.availableAbilities}
                  onAbilityChange={
                    showSpendControls && onSkillChange
                      ? (newAbility) => {
                          onSkillChange(skill.id, {
                            ...skillSeed(skill),
                            ability: newAbility,
                            skill_val: skill.skill_val ?? 0,
                            prof: skill.prof ?? false,
                          });
                        }
                      : undefined
                  }
                  isEditing={showEditControls}
                  onValueChange={(delta) => {
                    if (showTempControls) {
                      if (skill.catalogOnly && onSkillChange) {
                        onSkillChange(skill.id, {
                          ...skillSeed(skill),
                          skill_val: skill.skill_val ?? 0,
                          prof: skill.prof ?? false,
                        });
                      }
                      onTempModifiersChange?.({
                        skills: { [skill.id]: skillTemp + delta },
                      });
                      return;
                    }
                    if (delta > 0) {
                      handleSkillIncrease(skill);
                    } else if (delta < 0) {
                      handleSkillDecrease(skill);
                    }
                  }}
                  canIncrease={showTempControls ? true : canIncreaseSkill(skill)}
                  minValue={
                    showTempControls ? -99 : allowDecrease && !skill.prof && isSubSkill ? -1 : 0
                  }
                  showRollButton={!showEditControls && rollContext?.canRoll !== false}
                  onRoll={() =>
                    rollContext?.rollSkill?.(
                      skill.name,
                      bonus,
                      skill.ability ? ABILITY_ABBR[skill.ability.toLowerCase()] : undefined,
                    )
                  }
                  isSpeciesSkill={isFromSpecies}
                  variant="table"
                />
              );
            })}
          </tbody>
        </table>

        {displaySkills.length === 0 && (
          <div className="py-8 text-center text-text-muted">
            {proficiencyFilter === 'proficient'
              ? 'No proficient skills to show. Switch filter to All or gain proficiency in spend mode.'
              : 'No skills available.'}
          </div>
        )}
      </TableScroll>
    </Card>
  );
}
