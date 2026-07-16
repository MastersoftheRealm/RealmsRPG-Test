/**
 * Layer 1 power/technique card IDs: path recommendations plus selected non-path L2 picks.
 * Mirrors getPhaseL1Candidates promotion for equipment (TASK-458).
 */

import { normalizeId } from '@/lib/utils/normalize-id';

/**
 * Resolve a path or draft id to a stable catalog id when the library row exists.
 * Return undefined when the ref cannot be resolved (stale / still loading).
 */
export type ResolvePowersTechniquesCanonicalId = (id: string) => string | undefined;

/**
 * Path L1 ids stay visible (even while unresolved) so soft-seed and path cards remain stable.
 * Selected ids that resolve outside the path set are appended (deduped by canonical id).
 * Unresolved selected refs are skipped so stale draft ids do not invent empty cards.
 */
export function getPowersTechniquesL1Ids(
  pathOptionIds: string[],
  selectedIds: string[],
  resolveCanonicalId: ResolvePowersTechniquesCanonicalId
): { displayIds: string[]; promotedIds: string[] } {
  const byKey = new Map<string, string>();
  const pathKeys = new Set<string>();

  for (const id of pathOptionIds) {
    const raw = String(id).trim();
    if (!raw) continue;
    const canonical = resolveCanonicalId(raw);
    const key = normalizeId(canonical ?? raw);
    if (byKey.has(key)) continue;
    byKey.set(key, canonical ?? raw);
    pathKeys.add(key);
    if (canonical) {
      pathKeys.add(normalizeId(raw));
    }
  }

  const promotedIds: string[] = [];
  for (const id of selectedIds) {
    const raw = String(id).trim();
    if (!raw) continue;
    const canonical = resolveCanonicalId(raw);
    if (!canonical) continue;
    const key = normalizeId(canonical);
    if (byKey.has(key) || pathKeys.has(key) || pathKeys.has(normalizeId(raw))) {
      continue;
    }
    byKey.set(key, canonical);
    promotedIds.push(canonical);
  }

  return {
    displayIds: [...byKey.values()],
    promotedIds,
  };
}

/** True when id (or its canonical form) is among path recommendations. */
export function isPathRecommendedPowersTechniquesId(
  id: string,
  pathOptionIds: string[],
  resolveCanonicalId: ResolvePowersTechniquesCanonicalId
): boolean {
  const raw = String(id).trim();
  if (!raw) return false;
  const rawKey = normalizeId(raw);
  const canonical = resolveCanonicalId(raw);
  const canonicalKey = canonical ? normalizeId(canonical) : null;

  for (const pathId of pathOptionIds) {
    const pRaw = String(pathId).trim();
    if (!pRaw) continue;
    const pKey = normalizeId(pRaw);
    if (pKey === rawKey || (canonicalKey && pKey === canonicalKey)) return true;
    const pCanonical = resolveCanonicalId(pRaw);
    if (pCanonical) {
      const pk = normalizeId(pCanonical);
      if (pk === rawKey || (canonicalKey && pk === canonicalKey)) return true;
    }
  }
  return false;
}
