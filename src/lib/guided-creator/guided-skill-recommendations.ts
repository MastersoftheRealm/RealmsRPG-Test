/**
 * Guided creator skill recommendations — declined path skills + ability-aligned picks.
 * Shared between Layer 1 suggestion cards and AddSkillModal (Layer 2 browse all).
 */

import type { Skill } from '@/hooks';
import type { GridListBadgeColor } from '@/lib/chip/grid-list-chip-utils';
import type { Abilities, AbilityName, Archetype, ArchetypeCategory } from '@/types';
import {
  curateGuidedSkillIds,
  formatGuidedSkillAbilityTag,
  resolveGuidedArchetypeAbilities,
  type GuidedCuratedSkillsResult,
} from './curated-skills';

export type GuidedSkillSuggestionKind = 'path-declined' | 'ability-match';

export interface GuidedSkillSuggestionBadge {
  label: string;
  color?: GridListBadgeColor;
}

export interface GuidedSkillSuggestion {
  skillId: string;
  kinds: GuidedSkillSuggestionKind[];
  /** Tags for GuidedChoiceCard (plain labels). */
  tags: string[];
  /** Badges for GridListRow / AddSkillModal inline chips. */
  badges: GuidedSkillSuggestionBadge[];
  sortRank: number;
}

export interface BuildGuidedSkillSuggestionsOptions {
  codexSkills: Skill[];
  abilities: Abilities;
  declinedPathSkillIds: string[];
  pathSourceLabel?: string;
  archetypeType: ArchetypeCategory | null;
  archetype?: Pick<
    Archetype,
    'archetype_ability' | 'secondary_ability' | 'pow_abil' | 'mart_abil'
  > | null;
  powAbil?: AbilityName | null;
  martAbil?: AbilityName | null;
  pathSkillIds: string[];
  speciesSkillIds: string[];
  selectedSkillIds: Set<string>;
  /** When false, ability-match suggestions are omitted (declined path skills still show). */
  includeAbilityMatches?: boolean;
}

export interface BuildGuidedSkillSuggestionsResult {
  suggestions: GuidedSkillSuggestion[];
  curation: GuidedCuratedSkillsResult;
}

function pathDeclinedBadge(pathSourceLabel: string): GuidedSkillSuggestionBadge {
  return { label: pathSourceLabel, color: 'purple' };
}

function abilityTagBadge(label: string): GuidedSkillSuggestionBadge {
  return { label, color: 'blue' };
}

function mergeSuggestion(
  existing: GuidedSkillSuggestion,
  next: Omit<GuidedSkillSuggestion, 'skillId'>
): GuidedSkillSuggestion {
  const badgeLabels = new Set(existing.badges.map((b) => b.label));
  const tags = [...existing.tags];
  const badges = [...existing.badges];
  for (const tag of next.tags) {
    if (!tags.includes(tag)) tags.push(tag);
  }
  for (const badge of next.badges) {
    if (!badgeLabels.has(badge.label)) {
      badges.push(badge);
      badgeLabels.add(badge.label);
    }
  }
  const kinds = [...new Set([...existing.kinds, ...next.kinds])];
  return {
    skillId: existing.skillId,
    kinds,
    tags,
    badges,
    sortRank: Math.min(existing.sortRank, next.sortRank),
  };
}

function abilityMatchEntry(
  skillId: string,
  codexSkills: Skill[],
  abilities: Abilities
): Omit<GuidedSkillSuggestion, 'skillId'> {
  const skill = codexSkills.find((s) => String(s.id) === skillId);
  const label = (skill && formatGuidedSkillAbilityTag(skill, abilities)) ?? 'Skill';

  return {
    kinds: ['ability-match'],
    tags: [label],
    badges: [abilityTagBadge(label)],
    sortRank: 1,
  };
}

export function buildGuidedSkillSuggestions(
  options: BuildGuidedSkillSuggestionsOptions
): BuildGuidedSkillSuggestionsResult {
  const {
    codexSkills,
    abilities,
    declinedPathSkillIds,
    pathSourceLabel,
    archetypeType,
    archetype,
    powAbil,
    martAbil,
    pathSkillIds,
    speciesSkillIds,
    selectedSkillIds,
    includeAbilityMatches = true,
  } = options;

  const pathLabel = pathSourceLabel?.trim() || 'your path';

  const byId = new Map<string, GuidedSkillSuggestion>();

  for (const rawId of declinedPathSkillIds) {
    const skillId = String(rawId);
    if (skillId === '0' || selectedSkillIds.has(skillId)) continue;
    const skill = codexSkills.find((s) => String(s.id) === skillId);
    if (!skill) continue;

    const abilityLabel = formatGuidedSkillAbilityTag(skill, abilities);
    const tags = abilityLabel ? [pathLabel, abilityLabel] : [pathLabel];
    const badges = abilityLabel
      ? [pathDeclinedBadge(pathLabel), abilityTagBadge(abilityLabel)]
      : [pathDeclinedBadge(pathLabel)];

    const entry: Omit<GuidedSkillSuggestion, 'skillId'> = {
      kinds: ['path-declined'],
      tags,
      badges,
      sortRank: 0,
    };
    const prev = byId.get(skillId);
    byId.set(
      skillId,
      prev
        ? mergeSuggestion({ ...prev, skillId }, entry)
        : { skillId, ...entry }
    );
  }

  const { primary } = resolveGuidedArchetypeAbilities(archetypeType, {
    archetype,
    powAbil,
    martAbil,
  });

  const emptyCuration: GuidedCuratedSkillsResult = {
    skillIds: [],
    abilityKeysUsed: [],
    skillAbilityById: {},
  };

  const curation = includeAbilityMatches
    ? curateGuidedSkillIds({
        codexSkills,
        abilities,
        archetypeType,
        primaryAbility: primary,
        powAbil,
        martAbil,
        pathSkillIds,
        speciesSkillIds,
        selectedSkillIds,
      })
    : emptyCuration;

  if (includeAbilityMatches) {
    for (const skillId of curation.skillIds) {
      const entry = abilityMatchEntry(skillId, codexSkills, abilities);
      const prev = byId.get(skillId);
      byId.set(
        skillId,
        prev
          ? mergeSuggestion({ ...prev, skillId }, entry)
          : { skillId, ...entry }
      );
    }
  }

  const suggestions = [...byId.values()].sort((a, b) => {
    if (a.sortRank !== b.sortRank) return a.sortRank - b.sortRank;
    const rankA = curation.skillIds.indexOf(a.skillId);
    const rankB = curation.skillIds.indexOf(b.skillId);
    if (rankA !== -1 && rankB !== -1 && rankA !== rankB) return rankA - rankB;
    const nameA = codexSkills.find((s) => String(s.id) === a.skillId)?.name ?? '';
    const nameB = codexSkills.find((s) => String(s.id) === b.skillId)?.name ?? '';
    return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
  });

  return { suggestions, curation };
}

/** Map for AddSkillModal badge lookup by skill id. */
export function guidedSuggestionsToBadgeMap(
  suggestions: GuidedSkillSuggestion[]
): Record<string, GuidedSkillSuggestionBadge[]> {
  const map: Record<string, GuidedSkillSuggestionBadge[]> = {};
  for (const s of suggestions) {
    map[s.skillId] = s.badges;
  }
  return map;
}
