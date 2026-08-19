/**
 * Layer 1 curated skill picks for the guided creator skills step.
 * Surfaces base skills by archetype ability first, then by ability-score tiers.
 * Excludes sub-skills and overly broad skills (ALL/ANY or 4+ governing abilities).
 */

import type { Skill } from '@/hooks';
import { getHighestLinkedAbilityKey, getLinkedAbilityKeys } from '@/lib/game/formulas';
import { formatAbilityLabel } from '@/lib/constants/ability-effect-blurbs';
import type { Abilities, AbilityName, Archetype, ArchetypeCategory } from '@/types';
import { ABILITIES } from '@/types/abilities';

/** Skills with more than this many governing abilities are too broad for card suggestions. */
export const GUIDED_CURATED_MAX_GOVERNING_ABILITIES = 3;

/** Minimum ability-aligned suggestion cards when the player has skill points left. */
export const GUIDED_CURATED_MIN_SUGGESTIONS = 4;

const ABILITY_KEYS = Object.values(ABILITIES) as (keyof Abilities)[];

export interface GuidedCuratedSkillsOptions {
  codexSkills: Skill[];
  abilities: Abilities;
  archetypeType: ArchetypeCategory | null;
  /** Path primary ability (archetype_ability / power side). */
  primaryAbility?: AbilityName | null;
  /** Legacy draft fallbacks when path abilities are unset. */
  powAbil?: AbilityName | null;
  martAbil?: AbilityName | null;
  pathSkillIds: string[];
  speciesSkillIds: string[];
  selectedSkillIds: Set<string>;
  limit?: number;
  minSuggestions?: number;
}

export interface GuidedCuratedSkillsResult {
  skillIds: string[];
  /** Lowercase ability keys from tiers that contributed picks (in tier order). */
  abilityKeysUsed: string[];
  /** Best governing ability per skill for card labels. */
  skillAbilityById: Record<string, keyof Abilities>;
}

function parseRawAbilityParts(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);
}

/** True when the skill lists ALL/ANY or too many governing abilities to suggest as a card. */
export function isTooBroadSkillAbility(raw: string | undefined): boolean {
  const parts = parseRawAbilityParts(raw);
  if (parts.length === 0) return true;

  const upper = parts.map((p) => p.toUpperCase());
  if (upper.some((p) => p === 'ALL' || p === 'ANY')) return true;

  const keys = getLinkedAbilityKeys(raw);
  if (keys.length === 0) return true;
  if (keys.length > GUIDED_CURATED_MAX_GOVERNING_ABILITIES) return true;

  return false;
}

/**
 * True when a base skill uses one of the given abilities as a governing option,
 * excluding overly broad skills.
 */
export function skillMatchesArchetypeAbility(skill: Skill, abilityKeys: Set<string>): boolean {
  if (!skill.ability || abilityKeys.size === 0) return false;
  if (isTooBroadSkillAbility(skill.ability)) return false;

  const keys = getLinkedAbilityKeys(skill.ability);
  return keys.some((key) => abilityKeys.has(key.toLowerCase()));
}

type ArchetypeAbilitySource = Pick<
  Archetype,
  'archetype_ability' | 'secondary_ability' | 'pow_abil' | 'mart_abil'
>;

/** Resolve primary and secondary path abilities for skill curation. */
export function resolveGuidedArchetypeAbilities(
  archetypeType: ArchetypeCategory | null,
  options?: {
    archetype?: ArchetypeAbilitySource | null;
    powAbil?: AbilityName | null;
    martAbil?: AbilityName | null;
  },
): { primary: AbilityName | null; secondary: AbilityName | null } {
  const archetype = options?.archetype;
  const draftPow = options?.powAbil ?? null;
  const draftMart = options?.martAbil ?? null;

  const rowPrimary = archetype?.archetype_ability ?? archetype?.pow_abil ?? null;
  const rowSecondary = archetype?.secondary_ability ?? archetype?.mart_abil ?? null;

  if (archetypeType === 'powered-martial') {
    return {
      primary: archetype?.pow_abil ?? rowPrimary ?? draftPow,
      secondary: archetype?.mart_abil ?? rowSecondary ?? draftMart,
    };
  }

  if (archetypeType === 'martial') {
    return {
      primary: rowPrimary ?? draftMart,
      secondary: rowSecondary,
    };
  }

  if (archetypeType === 'power') {
    return {
      primary: rowPrimary ?? draftPow,
      secondary: rowSecondary,
    };
  }

  return {
    primary: rowPrimary ?? draftPow ?? draftMart,
    secondary: rowSecondary,
  };
}

/**
 * Ability tiers for skill suggestions: archetype ability first, then remaining
 * abilities grouped by score (highest to lowest; ties in the same tier).
 */
export function getGuidedAbilityRecommendationTiers(
  abilities: Abilities,
  primaryAbility?: AbilityName | null,
): (keyof Abilities)[][] {
  const tiers: (keyof Abilities)[][] = [];
  const primaryKey = primaryAbility?.toLowerCase() as keyof Abilities | undefined;

  if (primaryKey && ABILITY_KEYS.includes(primaryKey)) {
    tiers.push([primaryKey]);
  }

  const remainingKeys = ABILITY_KEYS.filter((key) => key !== primaryKey);
  const byScore = new Map<number, (keyof Abilities)[]>();

  for (const key of remainingKeys) {
    const score = abilities[key] ?? 0;
    const group = byScore.get(score) ?? [];
    group.push(key);
    byScore.set(score, group);
  }

  const scores = [...byScore.keys()].sort((a, b) => b - a);
  for (const score of scores) {
    const group = byScore.get(score)!;
    group.sort((a, b) => ABILITY_KEYS.indexOf(a) - ABILITY_KEYS.indexOf(b));
    tiers.push(group);
  }

  return tiers;
}

/** Resolve which abilities to use when curating free picks (legacy single-pool fallback). */
export function getGuidedPathAbilityKeys(
  archetypeType: ArchetypeCategory | null,
  powAbil?: AbilityName | null,
  martAbil?: AbilityName | null,
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

/** Human-readable label for suggestion section titles (e.g. "Strength" or "Strength or Vitality"). */
export function formatGuidedAbilityKeysLabel(abilityKeys: Set<string> | string[]): string {
  const keys = abilityKeys instanceof Set ? [...abilityKeys] : abilityKeys;
  const labels = keys.map((k) => formatAbilityLabel(k as AbilityName));
  if (labels.length === 0) return 'your path';
  if (labels.length === 1) return labels[0] ?? 'your path';
  if (labels.length === 2) return `${labels[0] ?? ''} or ${labels[1] ?? ''}`;
  return `${labels.slice(0, -1).join(', ')}, or ${labels[labels.length - 1] ?? ''}`;
}

/** Label for which ability a skill will use on the character's sheet. */
export function formatGuidedSkillAbilityTag(skill: Skill, abilities: Abilities): string | null {
  const key = getHighestLinkedAbilityKey(skill.ability, abilities);
  return key ? formatAbilityLabel(key) : null;
}

function sortSkillsByName(a: Skill, b: Skill): number {
  return String(a.name ?? '').localeCompare(String(b.name ?? ''), undefined, {
    sensitivity: 'base',
  });
}

function collectTierSkillIds(
  codexSkills: Skill[],
  tierKeys: (keyof Abilities)[],
  blocked: Set<string>,
  exclude: Set<string>,
): string[] {
  const keySet = new Set(tierKeys.map((key) => key.toLowerCase()));
  return codexSkills
    .filter((skill) => {
      if (skill.base_skill_id !== undefined) return false;
      const id = String(skill.id);
      if (blocked.has(id) || exclude.has(id)) return false;
      return skillMatchesArchetypeAbility(skill, keySet);
    })
    .sort(sortSkillsByName)
    .map((s) => String(s.id));
}

function curateFromAbilityPool(
  codexSkills: Skill[],
  abilityKeys: Set<string>,
  blocked: Set<string>,
  abilities: Abilities,
  limit: number,
): Pick<GuidedCuratedSkillsResult, 'skillIds' | 'skillAbilityById'> {
  const skillIds = codexSkills
    .filter((skill) => {
      if (skill.base_skill_id !== undefined) return false;
      const id = String(skill.id);
      if (blocked.has(id)) return false;
      return skillMatchesArchetypeAbility(skill, abilityKeys);
    })
    .sort(sortSkillsByName)
    .slice(0, limit);

  const skillAbilityById: Record<string, keyof Abilities> = {};
  for (const skill of skillIds) {
    const id = String(skill.id);
    const key = getHighestLinkedAbilityKey(skill.ability, abilities);
    if (key) skillAbilityById[id] = key;
  }

  return {
    skillIds: skillIds.map((s) => String(s.id)),
    skillAbilityById,
  };
}

export function curateGuidedSkillIds(
  options: GuidedCuratedSkillsOptions,
): GuidedCuratedSkillsResult {
  const {
    codexSkills,
    abilities,
    archetypeType,
    primaryAbility,
    powAbil,
    martAbil,
    pathSkillIds,
    speciesSkillIds,
    selectedSkillIds,
    limit = 48,
    minSuggestions = GUIDED_CURATED_MIN_SUGGESTIONS,
  } = options;

  const blocked = new Set<string>([
    ...speciesSkillIds.map(String),
    ...pathSkillIds.map(String),
    ...selectedSkillIds,
    '0',
  ]);

  const primary = primaryAbility?.toLowerCase() ?? null;

  if (!primary) {
    const abilityKeys = getGuidedPathAbilityKeys(archetypeType, powAbil, martAbil);
    const pooled = curateFromAbilityPool(codexSkills, abilityKeys, blocked, abilities, limit);
    return {
      skillIds: pooled.skillIds,
      abilityKeysUsed: [...abilityKeys],
      skillAbilityById: pooled.skillAbilityById,
    };
  }

  const tiers = getGuidedAbilityRecommendationTiers(abilities, primaryAbility);
  const abilityKeysUsed: string[] = [];
  const picked = new Set<string>();
  const result: string[] = [];
  const skillAbilityById: Record<string, keyof Abilities> = {};

  for (const tier of tiers) {
    const tierIds = collectTierSkillIds(codexSkills, tier, blocked, picked);
    let tierAdded = 0;

    for (const id of tierIds) {
      if (result.length >= limit) break;
      result.push(id);
      picked.add(id);
      tierAdded += 1;

      const skill = codexSkills.find((s) => String(s.id) === id);
      const abilityKey = (skill && getHighestLinkedAbilityKey(skill.ability, abilities)) ?? tier[0];
      if (abilityKey) skillAbilityById[id] = abilityKey;
    }

    if (tierAdded > 0) {
      for (const key of tier) {
        const lower = key.toLowerCase();
        if (!abilityKeysUsed.includes(lower)) abilityKeysUsed.push(lower);
      }
    }

    if (result.length >= minSuggestions) break;
  }

  return {
    skillIds: result,
    abilityKeysUsed,
    skillAbilityById,
  };
}
