'use client';

import type { CategoryId } from './core-rules-tabs';
import { DamageTypesEditor } from './core-rules-damage-types-editor';
import { ProgressionEditor } from './core-rules-progression-editor';
import { CombatEditor } from './core-rules-combat-editor';
import { ArchetypesEditor } from './core-rules-archetypes-editor';
import { AbilityRulesEditor, SkillsAndDefensesEditor } from './core-rules-ability-skills-editors';
import { ConditionsEditor } from './core-rules-conditions-editor';
import { SizesEditor } from './core-rules-sizes-editor';
import { RaritiesEditor } from './core-rules-rarities-editor';
import { RecoveryEditor, ExperienceEditor } from './core-rules-recovery-experience-editors';
import { ArmamentProficiencyEditor } from './core-rules-armament-editor';
import { CraftingRulesEditor } from './core-rules-crafting-rules-editor';

export function CategoryEditor({
  category,
  data,
  onChange,
  creatureData,
  onCreatureChange,
}: {
  category: CategoryId;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  creatureData?: Record<string, unknown>;
  onCreatureChange?: (data: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) => {
    onChange({ ...data, [key]: value });
  };

  const setNested = (parent: string, key: string, value: unknown) => {
    const parentObj = (data[parent] || {}) as Record<string, unknown>;
    onChange({ ...data, [parent]: { ...parentObj, [key]: value } });
  };

  const setCreature = (key: string, value: unknown) => {
    if (onCreatureChange && creatureData) {
      onCreatureChange({ ...creatureData, [key]: value });
    }
  };

  switch (category) {
    case 'PROGRESSION_PLAYER':
      return (
        <ProgressionEditor
          data={data}
          set={set}
          creatureData={creatureData}
          setCreature={creatureData && onCreatureChange ? setCreature : undefined}
        />
      );
    case 'COMBAT':
      return <CombatEditor data={data} set={set} setNested={setNested} />;
    case 'ARCHETYPES':
      return <ArchetypesEditor data={data} set={set} />;
    case 'ABILITY_RULES':
      return <AbilityRulesEditor data={data} set={set} />;
    case 'SKILLS_AND_DEFENSES':
      return <SkillsAndDefensesEditor data={data} set={set} />;
    case 'CONDITIONS':
      return <ConditionsEditor data={data} set={set} />;
    case 'SIZES':
      return <SizesEditor data={data} set={set} />;
    case 'RARITIES':
      return <RaritiesEditor data={data} set={set} />;
    case 'DAMAGE_TYPES':
      return <DamageTypesEditor data={data} set={set} />;
    case 'RECOVERY':
      return <RecoveryEditor data={data} set={set} setNested={setNested} />;
    case 'EXPERIENCE':
      return <ExperienceEditor data={data} set={set} />;
    case 'ARMAMENT_PROFICIENCY':
      return <ArmamentProficiencyEditor data={data} set={set} />;
    case 'CRAFTING':
      return <CraftingRulesEditor data={data} set={set} />;
    default:
      return <p className="text-text-muted dark:text-text-secondary">No editor available for this category.</p>;
  }
}
