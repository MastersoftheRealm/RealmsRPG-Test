/**
 * Layer 1 curated skill picks for the guided creator skills step.
 * Surfaces base skills whose governing abilities include the path's key ability(ies).
 * Excludes sub-skills and overly broad skills (ALL/ANY or 4+ governing abilities).
 */

import type { Skill } from '@/hooks';
import { getLinkedAbilityKeys } from '@/lib/game/formulas';
import { formatAbilityLabel } from '@/lib/constants/ability-effect-blurbs';
import type { AbilityName, ArchetypeCategory } from '@/types';

/** Skills with more than this many governing abilities are too broad for card suggestions. */
export const GUIDED_CURATED_MAX_GOVERNING_ABILITIES = 3;

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
 * True when a base skill uses the path's archetype ability as one of its governing options
 * (single- or multi-ability), excluding overly broad skills.
 */
export function skillMatchesArchetypeAbility(skill: Skill, abilityKeys: Set<string>): boolean {
  if (!skill.ability || abilityKeys.size === 0) return false;
  if (isTooBroadSkillAbility(skill.ability)) return false;

  const keys = getLinkedAbilityKeys(skill.ability);
  return keys.some((key) => abilityKeys.has(key.toLowerCase()));
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

/** Human-readable label for suggestion section titles (e.g. "Strength" or "Strength or Vitality"). */
export function formatGuidedAbilityKeysLabel(abilityKeys: Set<string>): string {
  const labels = [...abilityKeys].map((k) => formatAbilityLabel(k as AbilityName));
  if (labels.length === 0) return 'your path';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, or ${labels[labels.length - 1]}`;
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
    limit = 48,
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
      return skillMatchesArchetypeAbility(skill, abilityKeys);
    })
    .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''), undefined, { sensitivity: 'base' }))
    .slice(0, limit)
    .map((s) => String(s.id));
}
