/**
 * Layer 1 curated skill picks for the guided creator skills step.
 * Surfaces base skills aligned with the path's key abilities (not species/path picks already shown).
 */

import type { Skill } from '@/hooks';
import type { AbilityName, ArchetypeCategory } from '@/types';

export interface GuidedCuratedSkillsOptions {
  codexSkills: Skill[];
  archetypeType: ArchetypeCategory | null;
  powAbil?: AbilityName | null;
  martAbil?: AbilityName | null;
  pathSkillIds: string[];
  speciesSkillIds: string[];
  selectedSkillIds: Set<string>;
  limit?: number;
}

function skillMatchesAbilities(skill: Skill, abilityKeys: Set<string>): boolean {
  if (!skill.ability || abilityKeys.size === 0) return false;
  return skill.ability
    .split(',')
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .some((a) => abilityKeys.has(a));
}

/** Resolve which abilities to use when curating free picks. */
export function getGuidedPathAbilityKeys(
  archetypeType: ArchetypeCategory | null,
  powAbil?: AbilityName | null,
  martAbil?: AbilityName | null
): Set<string> {
  const keys = new Set<string>();
  if (powAbil) keys.add(powAbil.toLowerCase());
  if (martAbil) keys.add(martAbil.toLowerCase());

  if (keys.size > 0) return keys;

  if (archetypeType === 'martial') {
    keys.add('strength');
    keys.add('vitality');
  } else if (archetypeType === 'power') {
    keys.add('intelligence');
    keys.add('charisma');
  }

  return keys;
}

export function getGuidedCuratedSkillIds(options: GuidedCuratedSkillsOptions): string[] {
  const {
    codexSkills,
    archetypeType,
    powAbil,
    martAbil,
    pathSkillIds,
    speciesSkillIds,
    selectedSkillIds,
    limit = 12,
  } = options;

  const abilityKeys = getGuidedPathAbilityKeys(archetypeType, powAbil, martAbil);
  const blocked = new Set<string>([
    ...speciesSkillIds.map(String),
    ...pathSkillIds.map(String),
    ...selectedSkillIds,
    '0',
  ]);

  return codexSkills
    .filter((skill) => {
      if (skill.base_skill_id !== undefined) return false;
      const id = String(skill.id);
      if (blocked.has(id)) return false;
      return skillMatchesAbilities(skill, abilityKeys);
    })
    .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''), undefined, { sensitivity: 'base' }))
    .slice(0, limit)
    .map((s) => String(s.id));
}
