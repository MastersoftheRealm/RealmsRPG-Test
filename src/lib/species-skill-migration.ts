/**
 * Species skill migration
 * When character changes species, adjust skills: remove 1 point from each old species skill,
 * add 1 point to each new species skill. Handles proficiency vs value, soft cap, and refunds.
 */

import type { Character, CharacterAncestry } from '@/types';
import { findSkillByIdOrName, parseSkillAbilities } from '@/lib/codex/skill-list';
import { normalizeId } from '@/lib/utils';

type SpeciesLike = {
  id: string;
  name?: string | undefined;
  skills?: (string | number)[] | undefined;
};

type SkillCatalogEntry = {
  id: string | number;
  name?: string | undefined;
  ability?: string | undefined;
};

type SkillEntry = {
  id: string;
  name?: string | undefined;
  skill_val?: number | undefined;
  prof?: boolean | undefined;
  baseSkill?: string | undefined;
  ability?: string | undefined;
  availableAbilities?: string[] | undefined;
  [key: string]: unknown;
};

function getSpeciesSkillIds(
  ancestry: CharacterAncestry | undefined,
  allSpecies: SpeciesLike[],
): string[] {
  if (!ancestry) return [];
  if (ancestry.mixed && ancestry.speciesIds?.length === 2) {
    if (ancestry.selectedSpeciesSkillIds?.length === 2) return ancestry.selectedSpeciesSkillIds;
    const a = allSpecies.find((s) => String(s.id) === String(ancestry.speciesIds![0]));
    const b = allSpecies.find((s) => String(s.id) === String(ancestry.speciesIds![1]));
    const set = new Set<string>();
    (a?.skills || []).forEach((id: string | number) => set.add(String(id)));
    (b?.skills || []).forEach((id: string | number) => set.add(String(id)));
    return Array.from(set);
  }
  const species =
    allSpecies.find((s) => String(s.id) === String(ancestry.id)) ??
    (ancestry.name
      ? allSpecies.find(
          (s) => String(s.name ?? '').toLowerCase() === String(ancestry.name ?? '').toLowerCase(),
        )
      : null);
  return (species?.skills || []).map((id: string | number) => String(id));
}

function matchSkillId(skill: SkillEntry, id: string): boolean {
  const key = normalizeId(id);
  return normalizeId(skill.id) === key || normalizeId(skill.name) === key;
}

function applyCatalogIdentity(skill: SkillEntry, catalog: SkillCatalogEntry | undefined): void {
  if (!catalog) return;
  const catalogName = String(catalog.name ?? '').trim();
  if (catalogName && (!skill.name || normalizeId(skill.name) === normalizeId(skill.id))) {
    skill.name = catalogName;
  }
  if (!skill.ability && catalog.ability) {
    const abilities = parseSkillAbilities(catalog.ability);
    if (abilities[0]) skill.ability = abilities[0];
    if (abilities.length > 1) skill.availableAbilities = abilities;
  }
}

function newSpeciesSkillRow(id: string, catalog: SkillCatalogEntry | undefined): SkillEntry {
  const abilities = parseSkillAbilities(catalog?.ability);
  const name = String(catalog?.name ?? '').trim();
  return {
    id: catalog ? String(catalog.id) : id,
    name: name || id,
    skill_val: 0,
    prof: true,
    ...(abilities[0] ? { ability: abilities[0] } : {}),
    ...(abilities.length > 0 ? { availableAbilities: abilities } : {}),
  };
}

/** Cost to increase skill value from val to val+1 (1 for 0->1,1->2,2->3; 3 for 3->4+) */
function costForNextValue(currentVal: number): number {
  return currentVal >= 3 ? 3 : 1;
}

/**
 * Migrate skills after species change.
 * - For each old species skill not in new: remove 1 point (reduce value or remove proficiency).
 * - For each new species skill not in old: add 1 point (add proficiency at 0, or +1 value if already proficient; if at soft cap, refund 1).
 */
export function migrateSkillsAfterSpeciesChange(
  character: Character,
  newAncestry: CharacterAncestry,
  allSpecies: SpeciesLike[],
  allSkills: SkillCatalogEntry[] = [],
): SkillEntry[] {
  const oldIds = getSpeciesSkillIds(character.ancestry, allSpecies);
  const newIds = getSpeciesSkillIds(newAncestry, allSpecies);
  const oldSet = new Set(oldIds);
  const newSet = new Set(newIds);

  const skills = (character.skills || []) as SkillEntry[];
  const result = skills.map((s) => ({ ...s }));

  const catalogFor = (id: string) => findSkillByIdOrName(allSkills, id);

  const skillById = (id: string) => {
    const byIdOrName = result.find((s) => matchSkillId(s, id));
    if (byIdOrName) return byIdOrName;
    const catalog = catalogFor(id);
    const catalogName = String(catalog?.name ?? '').trim();
    if (!catalogName) return undefined;
    return result.find((s) => normalizeId(s.name) === normalizeId(catalogName));
  };

  // Remove 1 point from each old species skill that is not in new
  for (const id of oldIds) {
    if (id === '0' || newSet.has(id)) continue;
    const skill = skillById(id);
    if (!skill) continue;
    const val = skill.skill_val ?? 0;
    const prof = skill.prof ?? false;
    if (val > 0) {
      skill.skill_val = val - 1;
    } else if (prof) {
      skill.prof = false;
    }
  }

  // Add 1 point to each new species skill that is not in old
  for (const id of newIds) {
    if (id === '0' || oldSet.has(id)) continue;
    const catalog = catalogFor(id);
    const skill = skillById(id);
    if (!skill) {
      result.push(newSpeciesSkillRow(id, catalog));
      continue;
    }
    applyCatalogIdentity(skill, catalog);
    const val = skill.skill_val ?? 0;
    const prof = skill.prof ?? false;
    if (!prof) {
      skill.prof = true;
      skill.skill_val = 0;
    } else {
      const cost = costForNextValue(val);
      if (cost <= 1) {
        skill.skill_val = val + 1;
      }
    }
  }

  for (const skill of result) {
    applyCatalogIdentity(
      skill,
      catalogFor(String(skill.id)) ?? catalogFor(String(skill.name ?? '')),
    );
  }

  return result;
}
