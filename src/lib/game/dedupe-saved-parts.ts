/**
 * Deduplicate saved library parts / entity refs.
 *
 * DESIGN_INTENT: Creators concatenate manual + advanced + auto-mechanic parts.
 * Without a final uniqueness pass, the same part id can be persisted 2–3× and
 * then render as duplicate expandable chips on the character sheet / Library.
 * Keep the first occurrence; bump option levels when a later duplicate has higher.
 */

import { normalizeId } from '@/lib/utils/normalize-id';

export type SavedPartLike = {
  id?: string | number | null;
  name?: string | null;
  op_1_lvl?: number | null;
  op_2_lvl?: number | null;
  op_3_lvl?: number | null;
  /** UI-shape payloads nest the codex row under `part`. */
  part?: { id?: string | number | null; name?: string | null } | null;
};

/** Collapse codex aliases such as `s377` and `377` to the same dedupe key. */
function canonicalPartIdKey(id: string | number | null | undefined): string {
  const raw = normalizeId(id);
  if (!raw) return '';
  const stripped = raw.startsWith('s') && /^\d+$/.test(raw.slice(1)) ? raw.slice(1) : raw;
  return stripped;
}

function partDedupeKey(part: SavedPartLike | string): string {
  if (typeof part === 'string') {
    const name = normalizeId(part);
    return name ? `name:${name}` : '';
  }
  const idKey = canonicalPartIdKey(part.id ?? part.part?.id);
  if (idKey) return `id:${idKey}`;
  const name = normalizeId(part.name ?? part.part?.name);
  return name ? `name:${name}` : '';
}

function maxLvl(a: number | null | undefined, b: number | null | undefined): number {
  return Math.max(Number(a) || 0, Number(b) || 0);
}

/**
 * Deduplicate saved parts by normalized id (fallback: name).
 * Preserves first-seen order; merges higher option levels onto the kept entry.
 */
export function dedupeSavedParts<T extends SavedPartLike | string>(
  parts: T[] | null | undefined,
): T[] {
  if (!parts?.length) return [];

  const seen = new Map<string, T>();
  const order: string[] = [];
  let anon = 0;

  for (const part of parts) {
    let key = partDedupeKey(part);
    if (!key) {
      key = `__anon_${anon++}`;
      seen.set(key, part);
      order.push(key);
      continue;
    }

    const existing = seen.get(key);
    if (existing === undefined) {
      seen.set(key, part);
      order.push(key);
      continue;
    }

    if (typeof existing !== 'string' && typeof part !== 'string') {
      const e = existing as SavedPartLike;
      const p = part as SavedPartLike;
      const merged: SavedPartLike = { ...e };
      const next1 = maxLvl(e.op_1_lvl, p.op_1_lvl);
      const next2 = maxLvl(e.op_2_lvl, p.op_2_lvl);
      const next3 = maxLvl(e.op_3_lvl, p.op_3_lvl);
      // Only write option levels when a side already had them or the merge raised them.
      if (e.op_1_lvl != null || p.op_1_lvl != null) merged.op_1_lvl = next1;
      if (e.op_2_lvl != null || p.op_2_lvl != null) merged.op_2_lvl = next2;
      if (e.op_3_lvl != null || p.op_3_lvl != null) merged.op_3_lvl = next3;
      seen.set(key, merged as T);
    }
  }

  return order.map((k) => seen.get(k)!);
}

/**
 * Deduplicate list items by a normalized id extractor. Empty keys are kept
 * (cannot safely collapse) in first-seen order.
 */
export function dedupeByNormalizedId<T>(
  items: T[] | null | undefined,
  getId: (item: T) => string | number | null | undefined,
): T[] {
  if (!items?.length) return [];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = normalizeId(getId(item));
    if (!key) {
      out.push(item);
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** Character power / technique / feat refs: string or `{ id?, name? }`. */
export function dedupeEntityRefs<T extends string | { id?: string | number; name?: string }>(
  items: T[] | null | undefined,
): T[] {
  return dedupeByNormalizedId(items ?? [], (item) => {
    if (typeof item === 'string') return item;
    return item.id ?? item.name;
  });
}
