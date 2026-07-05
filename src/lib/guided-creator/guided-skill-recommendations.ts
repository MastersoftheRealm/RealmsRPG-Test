/**
 * Guided creator skill recommendations — declined path skills + ability-aligned picks.
 * Shared between Layer 1 suggestion cards and AddSkillModal (Layer 2 browse all).
 */

import type { Skill } from '@/hooks';
import type { GridListBadgeColor } from '@/lib/chip/grid-list-chip-utils';
import type { AbilityName, ArchetypeCategory } from '@/types';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { getGuidedCuratedSkillIds } from './curated-skills';

const recommendedChipLabel = GUIDED_CREATOR_COPY.steps.skills.recommendedChip;

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
  declinedPathSkillIds: string[];
  pathSourceLabel?: string;
  archetypeType: ArchetypeCategory | null;
  powAbil?: AbilityName | null;
  martAbil?: AbilityName | null;
  pathSkillIds: string[];
  speciesSkillIds: string[];
  selectedSkillIds: Set<string>;
  /** When false, ability-match suggestions are omitted (declined path skills still show). */
  includeAbilityMatches?: boolean;
}

function pathDeclinedBadge(pathSourceLabel: string): GuidedSkillSuggestionBadge {
  return { label: pathSourceLabel, color: 'purple' };
}

function abilityMatchBadge(): GuidedSkillSuggestionBadge {
  return { label: recommendedChipLabel, color: 'green' };
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

export function buildGuidedSkillSuggestions(
  options: BuildGuidedSkillSuggestionsOptions
): GuidedSkillSuggestion[] {
  const {
    codexSkills,
    declinedPathSkillIds,
    pathSourceLabel,
    archetypeType,
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
    if (!codexSkills.some((s) => String(s.id) === skillId)) continue;

    const entry: Omit<GuidedSkillSuggestion, 'skillId'> = {
      kinds: ['path-declined'],
      tags: [pathLabel],
      badges: [pathDeclinedBadge(pathLabel)],
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

  if (includeAbilityMatches) {
    const curatedIds = getGuidedCuratedSkillIds({
      codexSkills,
      archetypeType,
      powAbil,
      martAbil,
      pathSkillIds,
      speciesSkillIds,
      selectedSkillIds,
    });

    for (const skillId of curatedIds) {
      const entry: Omit<GuidedSkillSuggestion, 'skillId'> = {
        kinds: ['ability-match'],
        tags: [recommendedChipLabel],
        badges: [abilityMatchBadge()],
        sortRank: 1,
      };
      const prev = byId.get(skillId);
      byId.set(
        skillId,
        prev
          ? mergeSuggestion({ ...prev, skillId }, entry)
          : { skillId, ...entry }
      );
    }
  }

  return [...byId.values()].sort((a, b) => {
    if (a.sortRank !== b.sortRank) return a.sortRank - b.sortRank;
    const nameA = codexSkills.find((s) => String(s.id) === a.skillId)?.name ?? '';
    const nameB = codexSkills.find((s) => String(s.id) === b.skillId)?.name ?? '';
    return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
  });
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

/** Sort skill ids so recommended suggestions appear first (preserves suggestion order). */
export function sortSkillIdsWithSuggestionsFirst(
  skillIds: string[],
  suggestions: GuidedSkillSuggestion[]
): string[] {
  const rank = new Map(suggestions.map((s, i) => [s.skillId, i]));
  return [...skillIds].sort((a, b) => {
    const ra = rank.get(a);
    const rb = rank.get(b);
    if (ra !== undefined && rb !== undefined) return ra - rb;
    if (ra !== undefined) return -1;
    if (rb !== undefined) return 1;
    return a.localeCompare(b);
  });
}
