/**
 * Species skill migration
 * When character changes species, adjust skills: remove 1 point from each old species skill,
 * add 1 point to each new species skill. Handles proficiency vs value, soft cap, and refunds.
 */

import type { Character, CharacterAncestry } from '@/types';

type SpeciesLike = { id: string; name?: string; skills?: (string | number)[] };

export type SkillEntry = {
  id: string;
  name?: string;
  skill_val?: number;
  prof?: boolean;
  baseSkill?: string;
  ability?: string;
  [key: string]: unknown;
};

/** Get current species skill IDs (2 for single or mixed) */
function getCurrentSpeciesSkillIds(character: Character, allSpecies: SpeciesLike[]): string[] {
  const ancestry = character.ancestry;
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
  const speciesId = ancestry.id;
  const speciesName = ancestry.name;
  const species = allSpecies.find((s) => String(s.id) === String(speciesId))
    ?? (speciesName ? allSpecies.find((s) => String(s.name ?? '').toLowerCase() === String(speciesName ?? '').toLowerCase()) : null);
  return (species?.skills || []).map((id: string | number) => String(id));
}

/** Get new species skill IDs from new ancestry */
function getNewSpeciesSkillIds(newAncestry: CharacterAncestry, allSpecies: SpeciesLike[]): string[] {
  if (newAncestry.mixed && newAncestry.speciesIds?.length === 2) {
    if (newAncestry.selectedSpeciesSkillIds?.length === 2) return newAncestry.selectedSpeciesSkillIds;
    const a = allSpecies.find((s) => String(s.id) === String(newAncestry.speciesIds![0]));
    const b = allSpecies.find((s) => String(s.id) === String(newAncestry.speciesIds![1]));
    const set = new Set<string>();
    (a?.skills || []).forEach((id: string | number) => set.add(String(id)));
    (b?.skills || []).forEach((id: string | number) => set.add(String(id)));
    return Array.from(set);
  }
  const species = allSpecies.find((s) => String(s.id) === String(newAncestry.id))
    ?? (newAncestry.name ? allSpecies.find((s) => String(s.name ?? '').toLowerCase() === String(newAncestry.name ?? '').toLowerCase()) : null);
  return (species?.skills || []).map((id: string | number) => String(id));
}

function matchSkillId(skill: SkillEntry, id: string): boolean {
  return String(skill.id ?? '').toLowerCase() === id.toLowerCase()
    || String(skill.name ?? '').toLowerCase() === id.toLowerCase();
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
  allSpecies: SpeciesLike[]
): SkillEntry[] {
  const oldIds = getCurrentSpeciesSkillIds(character, allSpecies);
  const newIds = getNewSpeciesSkillIds(newAncestry, allSpecies);
  const oldSet = new Set(oldIds);
  const newSet = new Set(newIds);

  const skills = (character.skills || []) as SkillEntry[];
  const result = skills.map((s) => ({ ...s }));

  const skillById = (id: string) => result.find((s) => matchSkillId(s, id));

  // Remove 1 point from each old species skill that is not in new
  for (const id of oldIds) {
    if (newSet.has(id)) continue;
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
    if (oldSet.has(id)) continue;
    let skill = skillById(id);
    if (!skill) {
      result.push({
        id,
        name: id,
        skill_val: 0,
        prof: true,
      } as SkillEntry);
      skill = result[result.length - 1];
      continue;
    }
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

  return result;
}
