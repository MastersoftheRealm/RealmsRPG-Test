/**
 * Skills Allocation Page
 * =======================
 * Shared component for skill point allocation in character creator and creature creator.
 *
 * Features:
 * - Species skills (permanent, can't remove, tag "(species)", greyed remove)
 * - Add Skill / Add Sub-Skill modals
 * - Skill value allocation with proper point costs
 * - Defense allocation (2 pts per +1, max = level)
 * - Point counter
 * - Styling consistent with character sheet skills section
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useCodexSkills, type Skill } from '@/hooks';
import {
  calculateSkillBonusWithProficiency,
  calculateSubSkillBonusWithProficiency,
  getLinkedAbilityKeys,
  getHighestLinkedAbilityKey,
} from '@/lib/game/formulas';
import {
  getTotalSkillPoints,
  getSkillValueIncreaseCost,
  calculateSimpleSkillPointsSpent,
  canIncreaseDefense,
  resolveSkillAllocationRules,
} from '@/lib/game/skill-allocation';
import {
  applyAddedBaseSkills,
  applyAddedSubSkills,
  buildCharacterSkillsForSubModal,
  buildExistingSkillIdSet,
  buildExistingSkillNames,
} from '@/lib/game/skill-allocation-add';
import { useGameRules } from '@/hooks';
import { formatBonus } from '@/lib/utils';
import { SkillRow } from './skill-row';
import { PointStatus } from '../chrome/point-status';
import { AddSkillModal } from '../select/add-skill-modal';
import { AddSubSkillModal } from '../select/add-sub-skill-modal';
import { ValueStepper } from '../select/value-stepper';
import { WordHelpTip } from '../help/info-tippy';
import { Button, Spinner, Alert, Card, PageHeader, TableScroll } from '@/components/ui';
import { getDefenseHelp } from '../../../../public/tooltip-text';
import type { Abilities, DefenseSkills } from '@/types';

const DEFENSE_KEYS: (keyof DefenseSkills)[] = [
  'might',
  'fortitude',
  'reflex',
  'discernment',
  'mentalFortitude',
  'resolve',
];

const DEFENSE_LABELS: Record<keyof DefenseSkills, string> = {
  might: 'Might',
  fortitude: 'Fortitude',
  reflex: 'Reflex',
  discernment: 'Discernment',
  mentalFortitude: 'Mental Fort.',
  resolve: 'Resolve',
};

export interface DefenseBonusesCardProps {
  defenseSkills: DefenseSkills;
  onDefenseChange: (defense: DefenseSkills) => void;
  level: number;
  remainingPoints: number;
  abilityDefenseBonuses?: Partial<Record<keyof DefenseSkills, number>>;
  skillRules: ReturnType<typeof resolveSkillAllocationRules>;
  className?: string;
}

export function DefenseBonusesCard({
  defenseSkills,
  onDefenseChange,
  level,
  remainingPoints,
  abilityDefenseBonuses = {},
  skillRules,
  className,
}: DefenseBonusesCardProps) {
  const handleDefenseChange = (key: keyof DefenseSkills, delta: number) => {
    const current = defenseSkills[key] ?? 0;
    if (delta > 0) {
      const abilityBonus = abilityDefenseBonuses[key] ?? 0;
      if (current + abilityBonus >= level) return;
      if (remainingPoints < skillRules.defenseIncreaseCost) return;
      onDefenseChange({ ...defenseSkills, [key]: current + 1 });
    } else if (current > 0) {
      onDefenseChange({ ...defenseSkills, [key]: current - 1 });
    }
  };

  return (
    <Card className={cn('p-4 shadow-md', className)}>
      <h2 className="mb-2 text-lg font-semibold tracking-wide text-text-primary uppercase">
        Defense Bonuses
      </h2>
      <p className="mb-4 text-sm text-text-muted">
        Spend {skillRules.defenseIncreaseCost} Skill points to increase a defense bonus by 1.
        Defense bonus from Skill points cannot exceed your level.
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {DEFENSE_KEYS.map((key) => {
          const current = defenseSkills[key] ?? 0;
          const abilityBonus = abilityDefenseBonuses[key] ?? 0;
          const totalBonus = abilityBonus + current;
          const canInc = canIncreaseDefense(
            current,
            level,
            abilityBonus,
            remainingPoints,
            skillRules,
          );
          return (
            <div
              key={key}
              className="flex flex-col rounded-lg border border-border-light bg-surface-alt p-3"
            >
              <WordHelpTip
                content={getDefenseHelp(key)}
                label={`About ${DEFENSE_LABELS[key]}`}
                className="mb-1 font-medium text-text-primary normal-case"
              >
                {DEFENSE_LABELS[key]}
              </WordHelpTip>
              <div className="flex items-center justify-between gap-2">
                <ValueStepper
                  value={current}
                  onChange={(next) => handleDefenseChange(key, next - current)}
                  min={0}
                  max={canInc ? Infinity : current}
                  size="sm"
                  formatValue={() => formatBonus(totalBonus)}
                  decrementTitle={`Decrease ${DEFENSE_LABELS[key]}`}
                  incrementTitle={
                    canInc
                      ? `Increase ${DEFENSE_LABELS[key]} (Cost: ${skillRules.defenseIncreaseCost} Skill points)`
                      : `Increase ${DEFENSE_LABELS[key]} (Max at level ${level})`
                  }
                  className="w-full justify-between"
                />
              </div>
              {current > 0 && (
                <span className="mt-0.5 text-[9px] font-medium text-primary-link-fg">
                  +{current} ({current * skillRules.defenseIncreaseCost}sp)
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export interface SkillsAllocationPageProps {
  /** Character or creature */
  entityType: 'character' | 'creature';
  level: number;
  abilities: Abilities;
  /** Current skill allocations: skillId -> value */
  allocations: Record<string, number>;
  /** Defense bonuses from skill points */
  defenseSkills: DefenseSkills;
  /** Species skill IDs (always proficient, can't remove). Id "0" = "Any" (extra skill point only). */
  speciesSkillIds: Set<string>;
  /** Path-recommended skill IDs (auto-added as proficient, show sourceLabel, can remove). */
  pathSkillIds?: Set<string>;
  /** Label for path skills (e.g. archetype name), shown as "(label)" like species. */
  pathSourceLabel?: string;
  /** Extra skill points (e.g. when species has skill id "0" = Any) */
  extraSkillPoints?: number;
  /** Callback when allocations change */
  onAllocationsChange: (allocations: Record<string, number>) => void;
  /** Callback when defense skills change */
  onDefenseChange: (defense: DefenseSkills) => void;
  /** Optional: ability-derived defense bonuses for cap check */
  abilityDefenseBonuses?: Partial<Record<keyof DefenseSkills, number>>;
  /** Optional: chosen ability per skill (for multi-ability skills). Key = skill ID (base skill for sub-skills). */
  skillAbilities?: Record<string, string>;
  /** Optional: callback when user changes chosen ability for a skill */
  onSkillAbilityChange?: (skillId: string, abilityKey: string) => void;
  /** Optional footer (e.g. Back/Continue buttons) */
  footer?: React.ReactNode;
  /** Optional content rendered after the description (e.g. path help card) */
  afterDescription?: React.ReactNode;
  /** Optional heading-side content (e.g. help icon). */
  headingAddon?: React.ReactNode;
  /** Optional help content next to the "Add Sub-Skill" button. */
  addSubSkillAddon?: React.ReactNode;
  /** When true, hide the Defense Bonuses section (e.g. for choose-a-path creation) */
  hideDefenseBonuses?: boolean;
  /** When true, hide sub-skills and the Add Sub-Skill control (Layer 1 path mode). */
  hideSubSkills?: boolean;
  /** When true, omit the page title/description (parent shell owns the step header). */
  embeddedInShell?: boolean;
  /** Optional className */
  className?: string;
}

export function SkillsAllocationPage({
  entityType,
  level,
  abilities,
  allocations,
  defenseSkills,
  speciesSkillIds,
  pathSkillIds,
  pathSourceLabel,
  extraSkillPoints = 0,
  onAllocationsChange,
  onDefenseChange,
  abilityDefenseBonuses = {},
  skillAbilities = {},
  onSkillAbilityChange,
  footer,
  afterDescription,
  headingAddon,
  addSubSkillAddon,
  hideDefenseBonuses = false,
  hideSubSkills = false,
  embeddedInShell = false,
  className,
}: SkillsAllocationPageProps) {
  const { data: allSkills = [], isLoading } = useCodexSkills();
  const { rules } = useGameRules();
  const skillRules = resolveSkillAllocationRules(rules);
  const [addSkillModalOpen, setAddSkillModalOpen] = useState(false);
  const [addSubSkillModalOpen, setAddSubSkillModalOpen] = useState(false);

  const totalPoints = getTotalSkillPoints(level, entityType) + extraSkillPoints;

  const skillMeta = useMemo(() => {
    const map = new Map<string, { isSubSkill: boolean }>();
    allSkills.forEach((s: Skill) => {
      map.set(s.id, { isSubSkill: s.base_skill_id !== undefined });
    });
    return map;
  }, [allSkills]);

  const spentPoints = useMemo(
    () =>
      calculateSimpleSkillPointsSpent(
        allocations,
        speciesSkillIds,
        skillMeta,
        defenseSkills,
        skillRules,
      ),
    [allocations, speciesSkillIds, skillMeta, defenseSkills, skillRules],
  );

  const remainingPoints = totalPoints - spentPoints;
  const maxAddSkillSelections = Math.floor(remainingPoints / skillRules.gainProficiencyCost);

  const orderedSkills = useMemo(() => {
    const subsByBase: Record<string, Skill[]> = {};
    const inList = (id: string | number) => {
      const key = String(id);
      return (speciesSkillIds.has(key) && key !== '0') || key in allocations;
    };
    if (!allSkills.length) return [] as Skill[];

    allSkills.forEach((s: Skill) => {
      if (s.base_skill_id !== undefined) {
        const baseKey = String(s.base_skill_id);
        if (!subsByBase[baseKey]) subsByBase[baseKey] = [];
        subsByBase[baseKey].push(s);
      }
    });

    const baseSkills = allSkills.filter((s: Skill) => s.base_skill_id === undefined);
    baseSkills.sort((a: Skill, b: Skill) =>
      String(a.name ?? '').localeCompare(String(b.name ?? '')),
    );
    const result: Skill[] = [];
    baseSkills.forEach((base: Skill) => {
      const baseKey = String(base.id);
      const subs = subsByBase[baseKey] || [];
      const subsInList = subs.filter((sub: Skill) => inList(sub.id));
      const baseInList = inList(base.id);
      if (!baseInList && subsInList.length === 0) return;
      if (baseInList) result.push(base);
      subsInList.sort((a: Skill, b: Skill) =>
        String(a.name ?? '').localeCompare(String(b.name ?? '')),
      );
      result.push(...subsInList);
    });
    return result;
  }, [allSkills, speciesSkillIds, allocations]);

  const existingSkillIds = useMemo(
    () => buildExistingSkillIdSet(speciesSkillIds, allocations),
    [speciesSkillIds, allocations],
  );

  const existingSkillNames = useMemo(
    () => buildExistingSkillNames(allSkills, existingSkillIds),
    [allSkills, existingSkillIds],
  );

  const characterSkillsForSubModal = useMemo(
    () => buildCharacterSkillsForSubModal(allSkills, existingSkillIds, allocations),
    [allSkills, existingSkillIds, allocations],
  );

  const handleRemoveSkill = useCallback(
    (skillId: string) => {
      if (speciesSkillIds.has(skillId)) return;
      const next = { ...allocations };
      delete next[skillId];
      onAllocationsChange(next);
    },
    [allocations, speciesSkillIds, onAllocationsChange],
  );

  const handleAllocate = useCallback(
    (skillId: string, delta: number) => {
      const skill = allSkills.find((s: Skill) => String(s.id) === skillId);
      if (!skill) return;

      const current = allocations[skillId] ?? 0;
      const isSubSkill = skill.base_skill_id !== undefined;
      const isSpecies = speciesSkillIds.has(skillId);

      if (delta > 0) {
        const cost = getSkillValueIncreaseCost(current, isSubSkill, skillRules);
        if (remainingPoints < cost) return;
        onAllocationsChange({ ...allocations, [skillId]: current + 1 });
      } else {
        if (isSpecies && current <= 0) return;
        if (current <= 0) return;
        const newVal = current - 1;
        if (isSubSkill && newVal === 0) {
          // Sub-skill at 0 = unproficient; remove it
          handleRemoveSkill(skillId);
        } else {
          onAllocationsChange({ ...allocations, [skillId]: newVal });
        }
      }
    },
    [
      allocations,
      allSkills,
      speciesSkillIds,
      remainingPoints,
      onAllocationsChange,
      handleRemoveSkill,
      skillRules,
    ],
  );

  const handleAddSkills = useCallback(
    (skills: Skill[]) => {
      onAllocationsChange(applyAddedBaseSkills(allocations, skills));
      setAddSkillModalOpen(false);
    },
    [allocations, onAllocationsChange],
  );

  const handleAddSubSkills = useCallback(
    (skills: Array<Skill & { selectedBaseSkillId?: string; autoAddBaseSkill?: Skill }>) => {
      onAllocationsChange(applyAddedSubSkills(allocations, skills));
      setAddSubSkillModalOpen(false);
    },
    [allocations, onAllocationsChange],
  );

  const getSkillBonus = useCallback(
    (skill: Skill, value: number, isProficient: boolean, chosenAbilityKey?: string) => {
      return calculateSkillBonusWithProficiency(
        skill.ability,
        value,
        abilities,
        isProficient,
        chosenAbilityKey,
      );
    },
    [abilities],
  );

  const getSubSkillBonus = useCallback(
    (
      skill: Skill,
      subValue: number,
      baseValue: number,
      baseProficient: boolean,
      isProficient: boolean,
      chosenAbilityKey?: string,
    ) => {
      return calculateSubSkillBonusWithProficiency(
        skill.ability,
        subValue,
        baseValue,
        baseProficient,
        abilities,
        isProficient,
        chosenAbilityKey,
      );
    },
    [abilities],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  const visibleSkills = hideSubSkills
    ? orderedSkills.filter((skill) => skill.base_skill_id === undefined)
    : orderedSkills;

  return (
    <div className={cn('mx-auto max-w-5xl', className)}>
      {embeddedInShell ? (
        <div className="mb-4 flex justify-end">
          <PointStatus total={totalPoints} spent={spentPoints} variant="compact" />
        </div>
      ) : (
        <PageHeader
          title={
            <span className="inline-flex items-center gap-1">
              Allocate Skills
              {headingAddon}
            </span>
          }
          size="sm"
          className="mb-6"
          actions={<PointStatus total={totalPoints} spent={spentPoints} variant="compact" />}
          description={
            <>
              Spend Skill points to gain proficiency, increase Skill values, or boost defenses.
              Species Skills are always proficient and cannot be removed.
              {speciesSkillIds.has('0') && ' Species option "Any" gives one extra Skill point.'}
              {afterDescription != null && <div className="mt-4">{afterDescription}</div>}
            </>
          }
        />
      )}

      {/* Add Skill / Add Sub-Skill — always openable to browse; budget warning lives in the modal */}
      <div className="mb-6 flex gap-3">
        <Button size="sm" onClick={() => setAddSkillModalOpen(true)}>
          <Plus size={14} />
          Add Skill
        </Button>
        {!hideSubSkills && (
          <span className="inline-flex items-center gap-1">
            <Button
              size="sm"
              variant="secondary"
              className="dark:border-border dark:bg-surface dark:text-text-secondary dark:hover:bg-surface-alt"
              onClick={() => setAddSubSkillModalOpen(true)}
              disabled={remainingPoints < 1}
              title={remainingPoints < 1 ? 'No Skill points remaining' : undefined}
            >
              <Plus size={14} />
              Add Sub-Skill
            </Button>
            {addSubSkillAddon}
          </span>
        )}
      </div>

      {/* Single flat Skills table — same layout as character sheet (Prof, Skill, Ability, Bonus, Value) */}
      <Card className="mb-8 overflow-hidden p-0 shadow-md">
        <TableScroll>
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b-2 border-border-light text-xs tracking-wider text-text-muted uppercase">
                <th className="w-10 min-w-10 py-2 text-center">Prof</th>
                <th className="py-2 pl-2 text-left">Skill</th>
                <th className="w-16 min-w-16 py-2 text-center">Ability</th>
                <th className="w-20 min-w-20 py-2 text-center">Bonus</th>
                <th className="w-28 min-w-[7rem] py-2 text-center whitespace-nowrap">Value</th>
                <th className="w-10 min-w-10 py-2">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleSkills.map((skill) => {
                const isSubSkill = skill.base_skill_id !== undefined;
                const baseSkill = isSubSkill
                  ? allSkills.find((s: Skill) => String(s.id) === String(skill.base_skill_id))
                  : null;
                const baseValue = baseSkill ? (allocations[String(baseSkill.id)] ?? 0) : 0;
                const baseProficient = Boolean(
                  baseSkill &&
                  (speciesSkillIds.has(String(baseSkill.id)) ||
                    (allocations[String(baseSkill.id)] ?? -1) >= 0),
                );
                const value = Math.max(0, allocations[String(skill.id)] ?? 0);
                const isSpeciesSkill = speciesSkillIds.has(String(skill.id));
                const isPathSkill =
                  !isSpeciesSkill && (pathSkillIds?.has(String(skill.id)) ?? false);
                const effectiveValue = value; // Species can have value 0 (proficient, 0 value)
                // Base skills: value >= 0 means proficient. Sub-skills: value >= 1 = proficient
                const proficient = isSubSkill ? value >= 1 : value >= 0;
                // Chosen ability: for sub-skills use base skill's choice (same ability for base + sub)
                const skillForAbility = baseSkill ?? skill;
                const linkedKeys = getLinkedAbilityKeys(skillForAbility.ability);
                const chosenAbilityKey =
                  skillAbilities[skillForAbility.id] ??
                  getHighestLinkedAbilityKey(skillForAbility.ability, abilities) ??
                  linkedKeys[0];
                const bonus = isSubSkill
                  ? getSubSkillBonus(
                      skill,
                      effectiveValue,
                      baseValue,
                      baseProficient,
                      proficient,
                      chosenAbilityKey,
                    )
                  : getSkillBonus(skill, effectiveValue, proficient, chosenAbilityKey);
                const canInc = isSubSkill
                  ? baseProficient &&
                    remainingPoints >=
                      (effectiveValue === 0
                        ? skillRules.gainProficiencyCost
                        : getSkillValueIncreaseCost(effectiveValue, true, skillRules))
                  : remainingPoints >=
                    (effectiveValue === 0
                      ? skillRules.gainProficiencyCost
                      : getSkillValueIncreaseCost(effectiveValue, false, skillRules));
                const hasMultipleAbilities = linkedKeys.length > 1;
                return (
                  <SkillRow
                    key={String(skill.id)}
                    id={String(skill.id)}
                    name={skill.name ?? ''}
                    isSubSkill={isSubSkill}
                    baseSkillName={baseSkill?.name}
                    proficient={proficient}
                    canToggleProficiency={false}
                    value={effectiveValue}
                    bonus={bonus}
                    ability={chosenAbilityKey}
                    availableAbilities={hasMultipleAbilities ? (linkedKeys as string[]) : undefined}
                    onAbilityChange={
                      hasMultipleAbilities && onSkillAbilityChange
                        ? (key) => onSkillAbilityChange(skillForAbility.id, key)
                        : undefined
                    }
                    isEditing={true}
                    onValueChange={(d) => handleAllocate(String(skill.id), d)}
                    minValue={isSpeciesSkill ? 0 : 0}
                    canIncrease={canInc}
                    isSpeciesSkill={isSpeciesSkill}
                    sourceLabel={isPathSkill ? pathSourceLabel : undefined}
                    onRemove={
                      isSpeciesSkill ? undefined : () => handleRemoveSkill(String(skill.id))
                    }
                    variant="table"
                  />
                );
              })}
            </tbody>
          </table>
        </TableScroll>
        {visibleSkills.length === 0 && (
          <div className="py-8 text-center text-text-muted">
            No Skills added yet. Use &quot;Add Skill&quot; or &quot;Add Sub-Skill&quot; (need at
            least 1 Skill point).
          </div>
        )}
      </Card>

      {!hideDefenseBonuses && (
        <DefenseBonusesCard
          className="mb-8"
          defenseSkills={defenseSkills}
          onDefenseChange={onDefenseChange}
          level={level}
          remainingPoints={remainingPoints}
          abilityDefenseBonuses={abilityDefenseBonuses}
          skillRules={skillRules}
        />
      )}

      {allSkills.length === 0 && (
        <Alert variant="warning" className="mb-8">
          No Skill data available. Please check Codex connection.
        </Alert>
      )}

      {footer && <div className="mt-6 border-t border-border-light pt-4">{footer}</div>}

      {addSkillModalOpen ? (
        <AddSkillModal
          isOpen
          onClose={() => setAddSkillModalOpen(false)}
          existingSkillNames={existingSkillNames}
          onAdd={handleAddSkills}
          maxSelections={maxAddSkillSelections}
        />
      ) : null}

      {addSubSkillModalOpen ? (
        <AddSubSkillModal
          isOpen
          onClose={() => setAddSubSkillModalOpen(false)}
          characterSkills={characterSkillsForSubModal}
          existingSkillNames={existingSkillNames}
          onAdd={handleAddSubSkills}
        />
      ) : null}
    </div>
  );
}
