/**
 * Reconcile a persisted guided skill allocation against the live codex.
 *
 * Mirrors `pruneUnresolvedLoadoutRefs` for item refs. Drafts live in localStorage with no TTL,
 * so a `codex_skills` row deleted after the draft was written leaves an allocation key that
 * `calculateSimpleSkillPointsSpent` still charges a Skill Point for while `GuidedSkillsPanel`
 * renders no row for it — no stepper, no remove button, `remainingPoints` never reaches 0, and
 * Continue is dead until the player restarts and loses the character (audit P0-2).
 */

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
