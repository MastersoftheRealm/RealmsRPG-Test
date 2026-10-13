/**
 * Skills Section
 * ==============
 * Catalog-all Codex base skills (TASK-584) with compact All/Proficient + Sub-Skills filters (TASK-778).
 * Sub-skills: proficient always shown; unproficient only when user-added.
 * Spend − clears value → proficiency (and removes sub-skill when applicable); no per-row X.
 * Spend/temp steppers sit in the Bonus cell (TASK-800) so the Skills column does not hide mode.
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useRollsOptional } from '@/components/rolls';
import {
  EditSectionToggle,
  getEditState,
  PointStatus,
  SegmentedControl,
  SkillRow,
  TempModifierToggle,
} from '@/components/patterns';
import { ABILITY_ABBR } from '@/lib/constants/skills';
import { Button, Card } from '@/components/ui';
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
  sectionTempModifierTint,
  TEMP_MODIFIER_MAX,
  TEMP_MODIFIER_MIN,
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
import { skillsHeaderPinOffset } from './skills-header-pin';

type Skill = SheetDisplaySkill;

interface SkillsSectionProps {
  skills: Skill[];
  abilities: Abilities;
  isEditMode?: boolean | undefined;
  isTempModifierMode?: boolean | undefined;
  totalSkillPoints?: number | undefined;
  /** When provided, used for PointStatus and pencil state (includes defense spending). Enables red pencil when overspent. */
  spentSkillPoints?: number | undefined;
  // Species skills are locked and can't have proficiency removed
  speciesSkills?: string[] | undefined;
  tempModifiers?: CharacterTempModifiers | undefined;
  onTempModifiersChange?: ((patch: CharacterTempModifiers) => void) | undefined;
  onSkillChange?: ((skillId: string, updates: Partial<Skill>) => void) | undefined;
  onRemoveSkill?: ((skillId: string) => void) | undefined;
  onAddSubSkill?: (() => void) | undefined;
  className?: string | undefined;
}

export function SkillsSection({
  skills,
  abilities,
  isEditMode = false,
  isTempModifierMode = false,
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

  const [proficiencyFilter, setProficiencyFilter] = useState<SkillProficiencyFilter>('all');
  const [showSubSkills, setShowSubSkills] = useState(true);
  const [sectionAdjustOpen, setSectionAdjustOpen] = useState(false);
  const sheetModeKey = `${isEditMode}:${isTempModifierMode}`;
  const [prevSheetModeKey, setPrevSheetModeKey] = useState(sheetModeKey);
  if (sheetModeKey !== prevSheetModeKey) {
    setPrevSheetModeKey(sheetModeKey);
    setSectionAdjustOpen(false);
  }
  const showSpendControls = isEditMode && sectionAdjustOpen;
  const showTempControls = isTempModifierMode && sectionAdjustOpen;
  const showEditControls = showSpendControls || showTempControls;
  const showSectionToggle = isEditMode || isTempModifierMode;
  const cardRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const pinYRef = useRef(0);

  useEffect(() => {
    const card = cardRef.current;
    const header = headerRef.current;
    if (!card || !header) return;

    const column = card.closest<HTMLElement>('[data-sheet-mobile-column]');
    if (!column) return;

    const narrow = window.matchMedia('(max-width: 767px)');
    let frame = 0;

    const apply = () => {
      frame = 0;
      if (!narrow.matches) {
        pinYRef.current = 0;
        header.style.transform = '';
        return;
      }
      const tabs = column.querySelector<HTMLElement>('[data-sheet-section-tabs]');
      if (!tabs) {
        pinYRef.current = 0;
        header.style.transform = '';
        return;
      }
      const headerRect = header.getBoundingClientRect();
      const offset = skillsHeaderPinOffset({
        naturalTop: headerRect.top - pinYRef.current,
        headerHeight: headerRect.height,
        stickLine: tabs.getBoundingClientRect().bottom,
        cardBottom: card.getBoundingClientRect().bottom,
      });
      pinYRef.current = offset;
      header.style.transform = offset > 0 ? `translateY(${offset}px)` : '';
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(apply);
    };

    schedule();
    column.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    narrow.addEventListener('change', schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(card);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      column.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      narrow.removeEventListener('change', schedule);
      observer.disconnect();
      pinYRef.current = 0;
      header.style.transform = '';
    };
  }, []);

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
  const tempTint = sectionTempModifierTint(tempModifiers, 'skills');

  return (
    <Card ref={cardRef} className={cn('relative p-4 shadow-md md:p-6', className)}>
      {showSectionToggle && (
        <div className="absolute top-3 right-3 z-10">
          {isEditMode ? (
            <EditSectionToggle
              state={skillEditState}
              isActive={sectionAdjustOpen}
              onClick={() => setSectionAdjustOpen((open) => !open)}
              title={
                sectionAdjustOpen
                  ? 'Close point spending'
                  : skillEditState === 'has-points'
                    ? 'Edit — spend skill points'
                    : skillEditState === 'over-budget'
                      ? 'Edit — over budget, remove skill points'
                      : 'Edit skills'
              }
            />
          ) : (
            <TempModifierToggle
              isActive={sectionAdjustOpen}
              tint={tempTint}
              onClick={() => setSectionAdjustOpen((open) => !open)}
              title={
                sectionAdjustOpen
                  ? 'Close Temp Modifier'
                  : tempTint === 'none'
                    ? 'Temp Modifier'
                    : 'Temp Modifier (active adjustments)'
              }
            />
          )}
        </div>
      )}

      {/* DESIGN_INTENT: pencil or Temp toggle floats top-right; compact filters below title (not SourceFilter chrome).
          Below md, pin this whole block (title + filters) under the section tabs for the life of the card. */}
      <div
        ref={headerRef}
        data-skills-header-pin
        className={cn(
          'mb-4 max-md:relative max-md:z-[1] max-md:-mx-4 max-md:bg-surface max-md:pl-4',
          showSectionToggle ? 'pr-14' : 'max-md:pr-4',
        )}
      >
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h2 className="text-lg font-bold text-text-primary">Skills</h2>
          {showEditControls && (
            <span
              role="status"
              aria-live="polite"
              className="text-sm font-medium text-text-secondary"
            >
              {showTempControls ? 'Temp' : 'Editing'}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1">
          <SegmentedControl<SkillProficiencyFilter>
            size="compact"
            aria-label="Skill proficiency filter"
            value={proficiencyFilter}
            onChange={setProficiencyFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'proficient', label: 'Proficient' },
            ]}
          />
          <label
            htmlFor="sheet-skills-sub-skills"
            className="hit-area-dense inline-flex cursor-pointer items-center gap-1.5 text-xs text-text-secondary select-none"
          >
            <input
              id="sheet-skills-sub-skills"
              type="checkbox"
              checked={showSubSkills}
              onChange={(e) => setShowSubSkills(e.target.checked)}
              className="hit-area-layout-neutral size-4 shrink-0 rounded border-border-light"
            />
            Sub-Skills
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

      {showTempControls && (
        <div className="mb-4 rounded-lg bg-surface-secondary p-3">
          <p className="text-center text-xs text-text-secondary">
            Temp Modifier — layered Bonus/Penalty (does not spend points). Values tint gold or
            danger.
          </p>
        </div>
      )}

      {/* DESIGN_INTENT: sheet spend/temp steppers stay in the Bonus cell (TASK-800); no fifth column / TableScroll */}
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="border-b-2 border-border-light text-xs tracking-wider text-text-muted uppercase">
            <th className="w-10 min-w-10 py-2 text-center [@media(pointer:coarse)]:py-4">Prof</th>
            <th className="min-w-0 py-2 pl-2 text-left [@media(pointer:coarse)]:py-4">Skill</th>
            <th className="w-16 min-w-16 py-2 text-center [@media(pointer:coarse)]:py-4">
              Ability
            </th>
            <th
              className={cn(
                'py-2 text-center [@media(pointer:coarse)]:py-4',
                showEditControls ? 'min-w-[7.25rem] md:w-20 md:min-w-20' : 'w-20 min-w-20',
              )}
            >
              {showEditControls ? (showTempControls ? 'Temp' : 'Value') : 'Bonus'}
            </th>
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
                description={skill.description}
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
                editControlsPlacement="inline"
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
                  showTempControls
                    ? TEMP_MODIFIER_MIN
                    : allowDecrease && !skill.prof && isSubSkill
                      ? -1
                      : 0
                }
                maxValue={showTempControls ? TEMP_MODIFIER_MAX : undefined}
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
            ? 'No proficient skills to show. Switch filter to All or gain proficiency in Edit mode.'
            : 'No skills available.'}
        </div>
      )}
    </Card>
  );
}
