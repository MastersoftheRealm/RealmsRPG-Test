/**
 * Shared apply logic for Add Skill / Add Sub-Skill modals (sheet, creators, guided).
 */

import type { Skill } from '@/hooks';

export function buildExistingSkillIdSet(
  speciesSkillIds: Set<string>,
  allocations: Record<string, number>
): Set<string> {
  return new Set([...speciesSkillIds, ...Object.keys(allocations)]);
}

export function buildExistingSkillNames(
  codexSkills: Skill[],
  existingSkillIds: Set<string>
): string[] {
  return codexSkills
    .filter((s) => existingSkillIds.has(String(s.id)))
    .map((s) => s.name)
    .filter((n): n is string => Boolean(n));
}

export interface CharacterSkillForSubModalEntry {
  id?: string;
  name: string;
  prof?: boolean;
}

export function buildCharacterSkillsForSubModal(
  codexSkills: Skill[],
  existingSkillIds: Set<string>,
  allocations: Record<string, number>
): CharacterSkillForSubModalEntry[] {
  return codexSkills
    .filter((s) => s.base_skill_id === undefined && existingSkillIds.has(String(s.id)))
    .map((s) => ({
      id: s.id,
      name: s.name,
      prof: (allocations[String(s.id)] ?? 0) > 0,
    }));
}

export function applyAddedBaseSkills(
  allocations: Record<string, number>,
  skills: Skill[]
): Record<string, number> {
  const next = { ...allocations };
  for (const s of skills) {
    const key = String(s.id);
    if (!(key in next)) next[key] = 0;
  }
  return next;
}

export type SubSkillAddPayload = Skill & {
  selectedBaseSkillId?: string;
  autoAddBaseSkill?: Skill;
};

export function applyAddedSubSkills(
  allocations: Record<string, number>,
  skills: SubSkillAddPayload[]
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
