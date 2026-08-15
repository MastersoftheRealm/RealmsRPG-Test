/**
 * Shared codex skill list helpers (Codex skills tab + Admin skills tab).
 */

import type { Skill } from '@/hooks';
import type { Character } from '@/types';
import { normalizeId } from '@/lib/utils';
import { rowMatchesPathRecommendedIds } from '@/lib/game/path-recommendation-index';

/** Data columns only — admin action chrome uses CodexBrowseListShell `rowChrome`. */
export const SKILL_GRID_COLUMNS = '1.5fr 1fr 1fr';

export const SKILL_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'ability', label: 'ABILITIES' },
  { key: 'base_skill', label: 'BASE SKILL' },
];

export interface SkillFilterOptions {
  abilities: string[];
  baseSkills: string[];
}

export type SkillKnownMode = 'all' | 'known' | 'not-known';

export interface SkillListFilters {
  search: string;
  abilities: string[];
  baseSkill: string;
  subSkillMode: 'all' | 'only' | 'hide' | '';
  /** Codex character filter: known vs not known. Ignored without characterKnownIds. */
  knownMode?: SkillKnownMode;
  /** Codex character filter: keep sub-skills whose base the character has. */
  baseSkillOwnedOnly?: boolean;
}

/** Normalized id + name keys for skills on a saved character (TASK-722). */
export function collectCharacterSkillKeys(skills: Character['skills'] | undefined): Set<string> {
  const keys = new Set<string>();
  if (!skills) return keys;
  if (Array.isArray(skills)) {
    for (const row of skills) {
      const id = normalizeId(row.id);
      if (id) keys.add(id);
      const name = normalizeId(row.name);
      if (name) keys.add(name);
    }
    return keys;
  }
  for (const key of Object.keys(skills)) {
    const nk = normalizeId(key);
    if (nk) keys.add(nk);
  }
  return keys;
}

function skillIsKnown(skill: Skill, knownIds: Set<string>): boolean {
  return knownIds.has(normalizeId(skill.id)) || knownIds.has(normalizeId(skill.name));
}

function isSubSkill(skill: Skill): boolean {
  return skill.base_skill_id !== undefined;
}

function characterOwnsBaseSkill(
  skill: Skill,
  knownIds: Set<string>,
  skillIdToName: Map<string, string>,
): boolean {
  if (!isSubSkill(skill) || skill.base_skill_id === 0) return false;
  const baseId = normalizeId(skill.base_skill_id);
  const baseName = skillIdToName.get(String(skill.base_skill_id));
  return (
    (baseId !== '' && knownIds.has(baseId)) ||
    (baseName != null && knownIds.has(normalizeId(baseName)))
  );
}

export function buildSkillIdToName(skills: Skill[] | undefined): Map<string, string> {
  if (!skills) return new Map();
  return new Map(skills.map((s) => [String(s.id), s.name] as [string, string]));
}

export function buildSkillFilterOptions(
  skills: Skill[] | undefined,
  skillIdToName: Map<string, string>,
  options?: { includeCategoryBaseSkills?: boolean },
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
  skillIdToName: Map<string, string>,
  characterKnownIds?: Set<string> | null,
  pathRecommendedIds?: ReadonlySet<string> | null,
): Skill[] {
  const knownMode = filters.knownMode ?? 'all';

  return skills.filter((s) => {
    if (!rowMatchesPathRecommendedIds(s.id, pathRecommendedIds)) return false;
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

    const subSkill = isSubSkill(s);
    if (filters.subSkillMode === 'only' && !subSkill) return false;
    if (filters.subSkillMode === 'hide' && subSkill) return false;

    if (characterKnownIds != null) {
      if (knownMode === 'known' && !skillIsKnown(s, characterKnownIds)) return false;
      if (knownMode === 'not-known' && skillIsKnown(s, characterKnownIds)) return false;
      if (
        filters.baseSkillOwnedOnly &&
        !characterOwnsBaseSkill(s, characterKnownIds, skillIdToName)
      ) {
        return false;
      }
    }

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
