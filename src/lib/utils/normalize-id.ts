/**
 * Stable string id key for map lookups / Set membership
 * (trim + lowercase). Prefer this over one-off local helpers.
 */
export function normalizeId(id: string | number | null | undefined): string {
  return String(id ?? '')
    .trim()
    .toLowerCase();
}
