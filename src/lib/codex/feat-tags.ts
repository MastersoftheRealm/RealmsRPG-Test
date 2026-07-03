/**
 * Feat tag parsing and DB normalization (pairs with sql/feat-tags-unification-phase*.sql).
 * Canonical merges run in Postgres via `normalize_feat_tags()`; admin saves call that RPC.
 */

/** Parse codex_feats.tags TEXT (comma-separated, optional trailing comma) into a clean array. */
export function parseFeatTagsFromDb(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/** Format tag array for codex_feats.tags storage (sorted unique, trailing comma when non-empty). */
export function formatFeatTagsForDb(tags: string[]): string | null {
  const unique = [...new Set(tags.map((t) => t.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
  if (unique.length === 0) return null;
  return `${unique.join(',')},`;
}

/** Join raw tag parts before sending to `normalize_feat_tags` RPC. */
export function featTagsToNormalizeInput(tags: string[]): string | null {
  const parts = tags.map((t) => t.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(',');
}
