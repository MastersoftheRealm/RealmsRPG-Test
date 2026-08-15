/**
 * Derive power/technique categories from non-mechanic part categories.
 * Categories are multi-valued and deduped (TASK-673).
 * Powers with damage rows also receive the synthetic **Damage** category.
 */

export const DAMAGE_CATEGORY = 'Damage';

export interface PartCategorySource {
  id?: string | number | null;
  name?: string | null;
  category?: string | null;
  mechanic?: boolean | null;
}

export interface PartCategoryDbRow {
  id?: string | number | null;
  name?: string | null;
  category?: string | null;
  mechanic?: boolean | null;
}

function partLookupKey(id?: string | number | null, name?: string | null): string {
  if (id != null && String(id).trim()) return `id:${String(id).trim()}`;
  if (name != null && String(name).trim()) return `name:${String(name).trim().toLowerCase()}`;
  return '';
}

function buildPartsDbIndex(partsDb: PartCategoryDbRow[]): Map<string, PartCategoryDbRow> {
  const map = new Map<string, PartCategoryDbRow>();
  for (const row of partsDb) {
    const idKey = partLookupKey(row.id, null);
    if (idKey && !map.has(idKey)) map.set(idKey, row);
    const nameKey = partLookupKey(null, row.name);
    if (nameKey && !map.has(nameKey)) map.set(nameKey, row);
  }
  return map;
}

function resolvePartDef(
  part: PartCategorySource,
  index: Map<string, PartCategoryDbRow>,
): PartCategoryDbRow | null {
  const byId = partLookupKey(part.id, null);
  if (byId) {
    const hit = index.get(byId);
    if (hit) return hit;
  }
  const byName = partLookupKey(null, part.name);
  if (byName) {
    const hit = index.get(byName);
    if (hit) return hit;
  }
  // Saved payload may already carry category/mechanic without a DB hit.
  if (part.category != null || part.mechanic != null) return part;
  return null;
}

/**
 * Unique non-mechanic part categories for a power/technique, in first-seen order.
 * Mechanic parts (auto action/range/damage/etc.) are excluded.
 */
export function derivePartCategories(
  parts: PartCategorySource[] | null | undefined,
  partsDb: PartCategoryDbRow[] = [],
): string[] {
  if (!parts?.length) return [];
  const index = buildPartsDbIndex(partsDb);
  const seen = new Set<string>();
  const out: string[] = [];

  for (const part of parts) {
    const def = resolvePartDef(part, index);
    if (!def) continue;
    if (def.mechanic === true) continue;
    const category = String(def.category ?? '').trim();
    if (!category) continue;
    const key = category.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(category);
  }
  return out;
}

/** True when a power damage payload has at least one real damage row. */
export function powerHasDamageCategory(damage: unknown): boolean {
  if (!Array.isArray(damage)) return false;
  return damage.some((row) => {
    if (!row || typeof row !== 'object') return false;
    const d = row as { amount?: unknown; size?: unknown; type?: unknown };
    const type = String(d.type ?? '')
      .trim()
      .toLowerCase();
    if (!type || type === 'none') return false;
    return d.amount != null && d.amount !== '' && d.size != null && d.size !== '';
  });
}

/** Append synthetic Damage category when the power deals damage (deduped). */
export function withDamageCategory(categories: string[], hasDamage: boolean): string[] {
  if (!hasDamage) return categories;
  if (categories.some((c) => c.toLowerCase() === DAMAGE_CATEGORY.toLowerCase())) {
    return categories;
  }
  return [...categories, DAMAGE_CATEGORY];
}

/** Collapsed-column display: "Offense, Utility" or em dash when empty. */
export function formatPartCategoriesColumn(categories: string[]): string {
  if (categories.length === 0) return '—';
  return categories.join(', ');
}

/** Collect unique category labels present across a list of category arrays. */
export function collectCategoryFilterOptions(categoryLists: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of categoryLists) {
    for (const category of list) {
      const trimmed = category.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(trimmed);
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}

/** Collect unique category labels from raw power/technique part payloads (no full row build). */
export function collectCategoryOptionsFromItems(
  items: Array<{ parts?: PartCategorySource[] | null; damage?: unknown }>,
  partsDb: PartCategoryDbRow[],
  options?: { includeDamageCategory?: boolean },
): string[] {
  const includeDamage = options?.includeDamageCategory === true;
  return collectCategoryFilterOptions(
    items.map((item) => {
      const cats = derivePartCategories(item.parts, partsDb);
      return includeDamage ? withDamageCategory(cats, powerHasDamageCategory(item.damage)) : cats;
    }),
  );
}
