/**
 * Stable string id key for map lookups / Set membership
 * (trim + lowercase). Prefer this over one-off local helpers.
 */
export function normalizeId(id: string | number | null | undefined): string {
  return String(id ?? '')
    .trim()
    .toLowerCase();
}

export type NormalizedIdRow = {
  id?: string | number | null;
  docId?: string | number | null;
};

/** True when `refId` matches the row `id` or `docId` after normalizeId. */
export function rowMatchesNormalizedId(
  row: NormalizedIdRow,
  refId: string | number | null | undefined
): boolean {
  const key = normalizeId(refId);
  if (!key) return false;
  return normalizeId(row.id) === key || normalizeId(row.docId) === key;
}

export function findByNormalizedId<T extends NormalizedIdRow>(
  list: readonly T[] | undefined,
  refId: string | number | null | undefined
): T | undefined {
  const key = normalizeId(refId);
  if (!key) return undefined;
  return list?.find((row) => rowMatchesNormalizedId(row, key));
}

/** Index `id` and `docId` (when distinct) so either draft key resolves. */
export function indexByNormalizedIds<T extends NormalizedIdRow>(items: readonly T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    const idKey = normalizeId(item.id);
    if (idKey) map.set(idKey, item);
    const docKey = normalizeId(item.docId);
    if (docKey) map.set(docKey, item);
  }
  return map;
}

type NamedNormalizedIdRow = NormalizedIdRow & { name?: string | null };

/** Name maps keyed by normalized id/docId, plus name fallback for path refs. */
export function indexDisplayNamesByNormalizedIds(
  items: readonly NamedNormalizedIdRow[]
): { byId: Map<string, string>; byName: Map<string, string> } {
  const byId = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const [key, item] of indexByNormalizedIds(items)) {
    const name = String(item.name ?? '').trim();
    if (!name) continue;
    byId.set(key, name);
  }
  for (const item of items) {
    const name = String(item.name ?? '').trim();
    if (name) byName.set(normalizeId(name), name);
  }
  return { byId, byName };
}

/** Resolve `id` or `id:qty` to a display name (qty > 1 → `Name ×N`). */
export function resolveNormalizedRefLabel(
  ref: string,
  byId: Map<string, string>,
  byName?: Map<string, string>
): string {
  const trimmed = ref.trim();
  const colon = trimmed.indexOf(':');
  const idPart = colon >= 0 ? trimmed.slice(0, colon).trim() : trimmed;
  const qtyPart = colon >= 0 ? trimmed.slice(colon + 1).trim() : '';
  const key = normalizeId(idPart);
  const label = byId.get(key) ?? byName?.get(key) ?? idPart;
  if (qtyPart && Number.parseInt(qtyPart, 10) > 1) {
    return `${label} ×${qtyPart}`;
  }
  return label;
}

export function resolveNormalizedRefList(
  refs: string[] | undefined,
  byId: Map<string, string>,
  byName?: Map<string, string>
): string[] {
  if (!refs?.length) return [];
  return refs.map((ref) => resolveNormalizedRefLabel(ref, byId, byName));
}
