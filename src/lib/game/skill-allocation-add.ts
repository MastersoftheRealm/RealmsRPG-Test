/**
 * Shared apply logic for Add Skill / Add Sub-Skill modals (sheet, creators, guided).
 */

import type { Skill } from '@/hooks';

export function buildExistingSkillIdSet(
  speciesSkillIds: Set<string>,
  allocations: Record<string, number>,
): Set<string> {
  return new Set([...speciesSkillIds, ...Object.keys(allocations)]);
}

export function buildExistingSkillNames(
  codexSkills: Skill[],
  existingSkillIds: Set<string>,
): string[] {
  return codexSkills
    .filter((s) => existingSkillIds.has(String(s.id)))
    .map((s) => s.name)
    .filter((n): n is string => Boolean(n));
}

export interface CharacterSkillForSubModalEntry {
  id?: string | undefined;
  name: string;
  prof?: boolean | undefined;
}

export function buildCharacterSkillsForSubModal(
  codexSkills: Skill[],
  existingSkillIds: Set<string>,
  allocations: Record<string, number>,
): CharacterSkillForSubModalEntry[] {
  return codexSkills
    .filter((s) => s.base_skill_id === undefined && existingSkillIds.has(String(s.id)))
    .map((s) => ({
      id: s.id,
      name: s.name,
      // A base skill you paid proficiency for but put no ranks in is allocated at 0 and
      // is proficient — same predicate as `readProficiency` in formulas.ts.
      prof: (allocations[String(s.id)] ?? 0) >= 0,
    }));
}

/**
 * Drop a skill from allocations. Removing a base skill also drops sub-skills
 * whose codex parent is that base, so they do not stay listed under another skill.
 */
export function removeAllocatedSkill(
  allocations: Record<string, number>,
  skillId: string,
  codexSkills: Array<Pick<Skill, 'id' | 'base_skill_id'>>,
): Record<string, number> {
  if (!(skillId in allocations)) return allocations;
  const next = { ...allocations };
  delete next[skillId];
  const removed = codexSkills.find((skill) => String(skill.id) === skillId);
  if (removed == null || removed.base_skill_id != null) return next;
  for (const skill of codexSkills) {
    if (skill.base_skill_id == null || Number(skill.base_skill_id) === 0) continue;
    if (String(skill.base_skill_id) === skillId) delete next[String(skill.id)];
  }
  return next;
}

export function applyAddedBaseSkills(
  allocations: Record<string, number>,
  skills: Skill[],
): Record<string, number> {
  const next = { ...allocations };
  for (const s of skills) {
    const key = String(s.id);
    if (!(key in next)) next[key] = 0;
  }
  return next;
}

export type SubSkillAddPayload = Skill & {
  selectedBaseSkillId?: string | undefined;
  autoAddBaseSkill?: Skill | undefined;
};

export function applyAddedSubSkills(
  allocations: Record<string, number>,
  skills: SubSkillAddPayload[],
): Record<string, number> {
  const next = { ...allocations };
  for (const s of skills) {
    if (s.autoAddBaseSkill) {
      const baseKey = String(s.autoAddBaseSkill.id);
      if (!(baseKey in next)) next[baseKey] = 0;
    }
    const key = String(s.id);
    if (!(key in next)) next[key] = 1;
  }
  return next;
}
