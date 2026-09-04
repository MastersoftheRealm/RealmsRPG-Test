/**
 * Reconcile a persisted guided skill allocation against the live codex.
 *
 * Mirrors `pruneUnresolvedLoadoutRefs` for item refs. Drafts live in localStorage with no TTL,
 * so a `codex_skills` row deleted after the draft was written leaves an allocation key that
 * `calculateSimpleSkillPointsSpent` still charges a Skill Point for while `GuidedSkillsPanel`
 * renders no row for it — no stepper, no remove button, `remainingPoints` never reaches 0, and
 * Continue is dead until the player restarts and loses the character (audit P0-2).
 *
 * Skill leftover remaining lives here too (`calculateGuidedSkillPointBudget`) so Skills Continue
 * and Your Hero Create share one spend path — empty Codex must not report remaining 0.
 */

import type { Skill } from '@/hooks';
import { buildMixedSpeciesSkillOptions } from '@/lib/ancestry/ancestry-selection';
import {
  calculateSimpleSkillPointsSpent,
  getTotalSkillPoints,
  resolveSkillAllocationRules,
} from '@/lib/game/skill-allocation';
import { DEFAULT_DEFENSE_SKILLS, type DefenseSkills } from '@/types';
import type { CoreRulesMap } from '@/types/core-rules';
import type { GuidedSpeciesContext } from './guided-species-resolve';

/** `Set` and `Map` both satisfy this, so callers can reuse an existing codex index. */
export interface SkillIdIndex {
  has: (id: string) => boolean;
}

export interface PrunedSkillAllocations {
  skills: Record<string, number>;
  /** Allocation keys with no codex match, in encounter order. */
  removedIds: string[];
}

/**
 * Drop allocation keys the codex can no longer resolve.
 * Callers must gate on a non-empty index: a cold query cache would otherwise wipe every
 * valid allocation.
 */
export function pruneUnresolvedSkillAllocations(
  allocations: Record<string, number> | undefined,
  resolvedSkillIds: SkillIdIndex,
): PrunedSkillAllocations {
  const skills: Record<string, number> = {};
  const removedIds: string[] = [];

  for (const [id, value] of Object.entries(allocations ?? {})) {
    if (resolvedSkillIds.has(String(id))) {
      skills[id] = value;
    } else {
      removedIds.push(id);
    }
  }

  return { skills, removedIds };
}

/** Ids a step may add as defaults (species / path grants) that the codex cannot resolve. */
export function filterResolvedSkillIds(
  ids: readonly (string | number)[],
  resolvedSkillIds: SkillIdIndex,
): string[] {
  return ids.map(String).filter((id) => resolvedSkillIds.has(id));
}

export interface GuidedSkillPointBudget {
  skillMeta: Map<string, { isSubSkill: boolean }>;
  speciesSkillIds: Set<string>;
  allocationsWithDefaults: Record<string, number>;
  extraSkillPoints: number;
  totalPoints: number;
  spentPoints: number;
  remainingPoints: number;
}

function buildGuidedSkillMeta(
  catalog: readonly Pick<Skill, 'id' | 'base_skill_id'>[],
): Map<string, { isSubSkill: boolean }> {
  const map = new Map<string, { isSubSkill: boolean }>();
  for (const skill of catalog) {
    map.set(String(skill.id), { isSubSkill: skill.base_skill_id !== undefined });
  }
  return map;
}

function resolveGuidedSpeciesSkillIds(
  speciesContext: GuidedSpeciesContext,
  selectedSpeciesSkillIds: readonly string[],
  catalog: Skill[],
): Set<string> {
  if (speciesContext.isMixed && speciesContext.speciesA && speciesContext.speciesB) {
    if (selectedSpeciesSkillIds.length > 0) {
      return new Set(selectedSpeciesSkillIds.map(String));
    }
    return new Set(
      buildMixedSpeciesSkillOptions(speciesContext.speciesA, speciesContext.speciesB, catalog).map(
        (option) => option.id,
      ),
    );
  }
  return new Set((speciesContext.species?.skills ?? []).map(String));
}

/**
 * Codex-resolved keys only. Unresolvable ids still cost a Skill Point in the spend calc
 * but `GuidedSkillsPanel` renders no row — skipped while the catalog is empty so a cold
 * cache cannot drop valid allocations.
 */
function mergeGuidedSkillAllocationsWithDefaults(args: {
  allocations: Record<string, number>;
  speciesSkillIds: Set<string>;
  recommendedSkillIds: readonly (string | number)[];
  declinedPathSkillIds: Set<string>;
  skillMeta: Map<string, { isSubSkill: boolean }>;
}): Record<string, number> {
  const { allocations, speciesSkillIds, recommendedSkillIds, declinedPathSkillIds, skillMeta } =
    args;
  const catalogReady = skillMeta.size > 0;
  const resolves = (id: string) => !catalogReady || skillMeta.has(id);
  const next: Record<string, number> = {};
  for (const [id, value] of Object.entries(allocations)) {
    if (resolves(id)) next[id] = value;
  }
  speciesSkillIds.forEach((id) => {
    if (id === '0' || !resolves(id)) return;
    if (!(id in next)) next[id] = 0;
  });
  for (const id of recommendedSkillIds) {
    const key = String(id);
    if (key === '0' || !resolves(key)) continue;
    if (declinedPathSkillIds.has(key)) continue;
    if (!(key in next)) next[key] = 0;
  }
  return next;
}

export function calculateGuidedSkillPointBudget(args: {
  allocations: Record<string, number> | undefined;
  defenseVals: DefenseSkills | undefined;
  selectedSpeciesSkillIds: readonly string[];
  declinedPathSkillIds?: readonly string[] | undefined;
  recommendedSkillIds?: readonly (string | number)[] | undefined;
  speciesContext: GuidedSpeciesContext;
  catalog: Skill[];
  rules?: Partial<CoreRulesMap> | undefined;
}): GuidedSkillPointBudget {
  const { catalog } = args;
  const skillMeta = buildGuidedSkillMeta(catalog);
  const speciesSkillIds = resolveGuidedSpeciesSkillIds(
    args.speciesContext,
    args.selectedSpeciesSkillIds,
    catalog,
  );
  const allocationsWithDefaults = mergeGuidedSkillAllocationsWithDefaults({
    allocations: args.allocations ?? {},
    speciesSkillIds,
    recommendedSkillIds: args.recommendedSkillIds ?? [],
    declinedPathSkillIds: new Set((args.declinedPathSkillIds ?? []).map(String)),
    skillMeta,
  });
  const extraSkillPoints = speciesSkillIds.has('0') ? 1 : 0;
  const skillRules = resolveSkillAllocationRules(args.rules);
  const totalPoints = getTotalSkillPoints(1, 'character') + extraSkillPoints;
  const spentPoints = calculateSimpleSkillPointsSpent(
    allocationsWithDefaults,
    speciesSkillIds,
    skillMeta,
    args.defenseVals ?? DEFAULT_DEFENSE_SKILLS,
    skillRules,
  );
  return {
    skillMeta,
    speciesSkillIds,
    allocationsWithDefaults,
    extraSkillPoints,
    totalPoints,
    spentPoints,
    remainingPoints: totalPoints - spentPoints,
  };
}
