/**
 * Shared codex skill list helpers (Codex skills tab + Admin skills tab).
 */

import type { Skill } from '@/hooks';

export const SKILL_GRID_COLUMNS = '1.5fr 1fr 1fr 40px';

export const SKILL_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'ability', label: 'ABILITIES' },
  { key: 'base_skill', label: 'BASE SKILL' },
  { key: '_actions', label: '', sortable: false as const },
];

export interface SkillFilterOptions {
  abilities: string[];
  baseSkills: string[];
}

export interface SkillListFilters {
  search: string;
  abilities: string[];
  baseSkill: string;
  subSkillMode: 'all' | 'only' | 'hide' | '';
}

export function buildSkillIdToName(skills: Skill[] | undefined): Map<string, string> {
  if (!skills) return new Map();
  return new Map(skills.map((s) => [String(s.id), s.name] as [string, string]));
}

export function buildSkillFilterOptions(
  skills: Skill[] | undefined,
  skillIdToName: Map<string, string>,
  options?: { includeCategoryBaseSkills?: boolean }
): SkillFilterOptions {
  if (!skills) return { abilities: [], baseSkills: [] };

  const abilities = new Set<string>();
  const baseSkills = new Set<string>();

  skills.forEach((s) => {
    if (s.ability && typeof s.ability === 'string') {
      s.ability.split(',').forEach((ab) => {
        const trimmed = ab.trim();
        if (trimmed) abilities.add(trimmed);
      });
    }
    if (options?.includeCategoryBaseSkills) {
      const cat = (s as Skill & { category?: string }).category;
      if (cat && typeof cat === 'string') baseSkills.add(cat);
    }
    if (s.base_skill_id !== undefined) {
      const baseSkillName = skillIdToName.get(String(s.base_skill_id));
      if (typeof baseSkillName === 'string') baseSkills.add(baseSkillName);
    }
  });

  return {
    abilities: Array.from(abilities).sort(),
    baseSkills: Array.from(baseSkills).sort(),
  };
}

export function filterSkills(
  skills: Skill[],
  filters: SkillListFilters,
  skillIdToName: Map<string, string>
): Skill[] {
  return skills.filter((s) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (
        !s.name.toLowerCase().includes(searchLower) &&
        !s.description?.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    if (filters.abilities.length > 0) {
      const skillAbilities = s.ability?.split(',').map((a) => a.trim()) || [];
      if (!filters.abilities.some((filterAb) => skillAbilities.includes(filterAb))) return false;
    }

    if (filters.baseSkill) {
      const isThisBaseSkill = s.name === filters.baseSkill;
      const baseSkillName =
        s.base_skill_id !== undefined ? skillIdToName.get(String(s.base_skill_id)) : undefined;
      const hasThisBaseSkill = baseSkillName === filters.baseSkill;
      if (!isThisBaseSkill && !hasThisBaseSkill) return false;
    }

    const isSubSkill = s.base_skill_id !== undefined;
    if (filters.subSkillMode === 'only' && !isSubSkill) return false;
    if (filters.subSkillMode === 'hide' && isSubSkill) return false;

    return true;
  });
}

export function sortSkillsForBaseFilter(skills: Skill[], baseSkill: string): Skill[] {
  return [...skills].sort((a, b) => {
    const aIsBase = a.name === baseSkill;
    const bIsBase = b.name === baseSkill;
    if (aIsBase && !bIsBase) return -1;
    if (!aIsBase && bIsBase) return 1;
    return a.name.localeCompare(b.name);
  });
}
