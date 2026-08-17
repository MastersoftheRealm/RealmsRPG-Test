/**
 * Creature creator — skill allocation ↔ persisted CreatureSkill[] conversions
 * and load-from-library state mapping (TASK-357).
 */

import type { Skill } from '@/hooks';
import {
  collectCreatureInventoryItems,
  resolveCreatureInventoryBuckets,
} from '@/lib/game/creature-inventory';
import { initialState } from './creature-creator-constants';
import type { CreatureSkill, CreatureState } from './creature-creator-types';
import type { CreatureArmament } from './transformers';

function resolveCodexSkill(skill: CreatureSkill, codexSkills: Skill[]): Skill | undefined {
  if (skill.id != null) {
    const byId = codexSkills.find((s) => String(s.id) === String(skill.id));
    if (byId) return byId;
  }
  const name = String(skill.name ?? '').toLowerCase();
  return codexSkills.find((s) => String(s.name ?? '').toLowerCase() === name);
}

function isSubSkillEntry(skill: CreatureSkill, codex?: Skill): boolean {
  if (skill.isSubSkill === true) return true;
  if (skill.baseSkillId != null && skill.baseSkillId !== '' && Number(skill.baseSkillId) !== 0)
    return true;
  if (codex?.base_skill_id != null && Number(codex.base_skill_id) !== 0) return true;
  return false;
}

/** Map persisted creature skills to SkillsAllocationPage allocations (skill id → value). */
export function creatureSkillsToAllocations(
  skills: CreatureSkill[],
  codexSkills: Skill[],
): Record<string, number> {
  const allocations: Record<string, number> = {};
  for (const skill of skills) {
    const codex = resolveCodexSkill(skill, codexSkills);
    const key = codex ? String(codex.id) : String(skill.name);
    const isSub = isSubSkillEntry(skill, codex);
    if (isSub) {
      allocations[key] = Math.max(1, skill.value);
    } else if (skill.proficient !== false) {
      allocations[key] = skill.value;
    }
  }
  return allocations;
}

/** Map SkillsAllocationPage allocations back to persisted creature skills. */
export function allocationsToCreatureSkills(
  allocations: Record<string, number>,
  codexSkills: Skill[],
): CreatureSkill[] {
  const result: CreatureSkill[] = [];
  for (const [key, value] of Object.entries(allocations)) {
    const codex =
      codexSkills.find((s) => String(s.id) === key) ??
      codexSkills.find((s) => String(s.name ?? '').toLowerCase() === key.toLowerCase());
    if (!codex) continue;
    const isSub = codex.base_skill_id != null && Number(codex.base_skill_id) !== 0;
    result.push({
      id: String(codex.id),
      name: String(codex.name ?? key),
      value: isSub ? Math.max(1, value) : value,
      proficient: true,
      isSubSkill: isSub,
      baseSkillId: isSub ? String(codex.base_skill_id) : undefined,
    });
  }
  return result;
}

/** Normalize API / library row into CreatureState (load modal + ?edit=). */
export function rawRecordToCreatureState(c: Record<string, unknown>): CreatureState {
  const row = c as unknown as CreatureState;
  const inventory = resolveCreatureInventoryBuckets({
    weapons: c.weapons as CreatureArmament[] | undefined,
    armor: c.armor as CreatureArmament[] | undefined,
    shields: c.shields as CreatureArmament[] | undefined,
    equipment: c.equipment as CreatureArmament[] | undefined,
    armaments: c.armaments as CreatureArmament[] | undefined,
  });
  return {
    name: String(c.name ?? ''),
    level: Number(c.level ?? 1),
    type: String(c.type ?? 'Humanoid'),
    size: String(c.size ?? 'medium'),
    description: String(c.description ?? ''),
    imageId: typeof (c.imageId ?? c.image_id) === 'string' ? String(c.imageId ?? c.image_id) : null,
    imageUrl:
      typeof (c.imageUrl ?? c.image_url) === 'string' ? String(c.imageUrl ?? c.image_url) : null,
    archetypeType: row.archetypeType ?? 'power',
    abilities: (c.abilities as CreatureState['abilities']) ?? initialState.abilities,
    defenses: (c.defenses as CreatureState['defenses']) ?? initialState.defenses,
    hitPoints: Number(c.hitPoints ?? 0),
    energyPoints: Number(c.energyPoints ?? 0),
    powerProficiency: Number(c.powerProficiency ?? 0),
    martialProficiency: Number(c.martialProficiency ?? 0),
    enablePowers: (c.enablePowers as boolean) ?? Boolean((c.powers as unknown[])?.length),
    enableTechniques:
      (c.enableTechniques as boolean) ?? Boolean((c.techniques as unknown[])?.length),
    enableArmaments:
      (c.enableArmaments as boolean) ?? collectCreatureInventoryItems(inventory).length > 0,
    resistances: (c.resistances as string[]) ?? [],
    weaknesses: (c.weaknesses as string[]) ?? [],
    immunities: (c.immunities as string[]) ?? [],
    conditionImmunities: (c.conditionImmunities as string[]) ?? [],
    senses: (c.senses as string[]) ?? [],
    movementTypes: (c.movementTypes as string[]) ?? [],
    languages: (c.languages as string[]) ?? [],
    skills: (c.skills as CreatureSkill[]) ?? [],
    powers: (c.powers as CreatureState['powers']) ?? [],
    techniques: (c.techniques as CreatureState['techniques']) ?? [],
    feats: (c.feats as CreatureState['feats']) ?? [],
    weapons: inventory.weapons,
    armor: inventory.armor,
    shields: inventory.shields,
    equipment: inventory.equipment,
  };
}
