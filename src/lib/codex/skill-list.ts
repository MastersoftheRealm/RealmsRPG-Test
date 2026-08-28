/**
 * Shared codex skill list helpers (Codex skills tab + Admin skills tab).
 */

import type { Skill } from '@/hooks';
import type { Character, AbilityName } from '@/types';
import { normalizeId } from '@/lib/utils';
import { formatAbilityLabel } from '@/lib/constants/ability-effect-blurbs';
import { rowMatchesPathRecommendedIds } from '@/lib/game/path-recommendation-index';

/** Data columns only — admin action chrome uses CodexBrowseListShell `rowChrome`. */
export const SKILL_GRID_COLUMNS = '1.5fr 1fr 1fr';

export const SKILL_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'ability', label: 'ABILITIES' },
  { key: 'base_skill', label: 'BASE SKILL' },
];

/** Add Skill modal: Codex name + Abilities columns (no Base Skill). */
export const ADD_SKILL_HEADER_COLUMNS = SKILL_HEADER_COLUMNS.filter(
  (col) => col.key !== 'base_skill',
);

/** Grid tracks for name + Abilities (first two tracks of SKILL_GRID_COLUMNS). */
export const ADD_SKILL_GRID_COLUMNS = '1.5fr 1fr';

/** Add Sub-Skill modal: Codex name + Abilities + Base columns. */
export const ADD_SUB_SKILL_HEADER_COLUMNS = [
  ...ADD_SKILL_HEADER_COLUMNS,
  { key: 'base', label: 'BASE' },
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
  knownMode?: SkillKnownMode | undefined;
  /** Codex character filter: keep sub-skills whose base the character has. */
  baseSkillOwnedOnly?: boolean | undefined;
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

/** Match a Codex/library skill by id or display name (species grants store ids). */
export function findSkillByIdOrName<T extends { id: string | number; name?: string | undefined }>(
  skills: readonly T[] | undefined,
  lookup: string | number | null | undefined,
): T | undefined {
  const key = normalizeId(lookup);
  if (!key || !skills?.length) return undefined;
  return (
    skills.find((s) => normalizeId(s.id) === key) ?? skills.find((s) => normalizeId(s.name) === key)
  );
}

/** Split a Codex `ability` string (`strength` or `strength,agility`) into lowercase keys. */
export function parseSkillAbilities(abilityString?: string): string[] {
  if (!abilityString) return [];
  return abilityString
    .split(',')
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);
}

/** Full ability names for list columns (Codex, Add Skill, Add Sub-Skill). */
export function formatSkillAbilityList(abilityString?: string): string {
  const keys = parseSkillAbilities(abilityString);
  if (keys.length === 0) return '-';
  return keys.map((key) => formatAbilityLabel(key as AbilityName)).join(', ');
}

export function buildSkillFilterOptions(
  skills: Skill[] | undefined,
  skillIdToName: Map<string, string>,
  options?: { includeCategoryBaseSkills?: boolean | undefined },
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
      const cat = (s as Skill & { category?: string | undefined }).category;
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
