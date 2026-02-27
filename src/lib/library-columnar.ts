/**
 * Library columnar helpers
 * =======================
 * Shared rowToItem and bodyToColumnar for official_* and user_* tables.
 * Same column set: scalars + one payload JSONB.
 */

export const COLUMNAR_LIBRARY_TYPES = ['powers', 'techniques', 'items', 'creatures'] as const;
export type ColumnarLibraryType = (typeof COLUMNAR_LIBRARY_TYPES)[number];

export const SCALAR_KEYS: Record<ColumnarLibraryType, string[]> = {
  powers: ['name', 'description', 'actionType', 'isReaction', 'innate'],
  techniques: ['name', 'description', 'actionType', 'weaponName'],
  items: ['name', 'description', 'type', 'rarity', 'armorValue', 'damageReduction'],
  creatures: ['name', 'description', 'level', 'type', 'size', 'hitPoints', 'energyPoints'],
};

const BODY_TO_CAMEL: Record<string, string> = {
  action_type: 'actionType',
  is_reaction: 'isReaction',
  weapon_name: 'weaponName',
  armor_value: 'armorValue',
  damage_reduction: 'damageReduction',
  hit_points: 'hitPoints',
  energy_points: 'energyPoints',
};

const CAMEL_TO_SNAKE: Record<string, string> = {
  actionType: 'action_type',
  isReaction: 'is_reaction',
  weaponName: 'weapon_name',
  armorValue: 'armor_value',
  damageReduction: 'damage_reduction',
  hitPoints: 'hit_points',
  energyPoints: 'energy_points',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  userId: 'user_id',
};

/** Convert camelCase object to snake_case for Supabase columnar insert/update. */
export function toDbRow(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const snake = CAMEL_TO_SNAKE[k] ?? k.replace(/([A-Z])/g, (_, c) => `_${c.toLowerCase()}`);
    out[snake] = v;
  }
  return out;
}

/** Get value from row (camel or snake_case for Supabase compatibility). */
function v(row: Record<string, unknown>, camel: string, snake?: string): unknown {
  return row[camel] ?? (snake ? row[snake] : undefined);
}

/** Build client-shaped item from a columnar row (official or user). Row may be camelCase or snake_case (Supabase). */
export function rowToItem(
  type: ColumnarLibraryType,
  row: Record<string, unknown>,
  source?: 'official' | 'user'
): Record<string, unknown> {
  const payload = (row.payload as Record<string, unknown>) || {};
  const base: Record<string, unknown> = {
    id: row.id,
    docId: row.id,
    name: row.name,
    description: row.description,
  };
  if (source) base._source = source;
  if (type === 'powers') {
    base.actionType = v(row, 'actionType', 'action_type');
    base.isReaction = v(row, 'isReaction', 'is_reaction');
    base.innate = v(row, 'innate');
  }
  if (type === 'techniques') {
    base.actionType = v(row, 'actionType', 'action_type');
    const weaponName = v(row, 'weaponName', 'weapon_name');
    base.weaponName = weaponName;
    if (weaponName && !payload.weapon) base.weapon = { name: weaponName };
  }
  if (type === 'items') {
    base.type = v(row, 'type');
    base.rarity = v(row, 'rarity');
    base.armorValue = v(row, 'armorValue', 'armor_value');
    base.damageReduction = v(row, 'damageReduction', 'damage_reduction');
  }
  if (type === 'creatures') {
    base.level = v(row, 'level');
    base.type = v(row, 'type');
    base.size = v(row, 'size');
    base.hitPoints = v(row, 'hitPoints', 'hit_points');
    base.energyPoints = v(row, 'energyPoints', 'energy_points');
  }
  base.createdAt = v(row, 'createdAt', 'created_at');
  base.updatedAt = v(row, 'updatedAt', 'updated_at');
  return { ...base, ...payload };
}

/** Split request body into scalars (for columns) and payload (JSONB). */
export function bodyToColumnar(
  type: ColumnarLibraryType,
  body: Record<string, unknown>
): { scalars: Record<string, unknown>; payload: Record<string, unknown> } {
  const scalarKeys = new Set(SCALAR_KEYS[type]);
  const scalars: Record<string, unknown> = {};
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (k === 'id' || k === 'docId' || k === '_source') continue;
    const camel = BODY_TO_CAMEL[k] ?? k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (scalarKeys.has(camel) || scalarKeys.has(k)) {
      scalars[camel] = v;
    } else {
      payload[k] = v;
    }
  }
  return { scalars, payload };
}

// -----------------------------------------------------------------------------
// Species (user_species columnar — same shape as codex_species + user_id)
// -----------------------------------------------------------------------------

const SPECIES_ARRAY_KEYS = [
  'sizes',
  'skills',
  'species_traits',
  'ancestry_traits',
  'flaws',
  'characteristics',
  'languages',
] as const;

function toStrArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

/** Build client-shaped species from columnar row (user_species). */
export function rowToItemSpecies(row: Record<string, unknown>): Record<string, unknown> {
  const payload = (row.payload as Record<string, unknown>) ?? {};
  const base: Record<string, unknown> = {
    id: row.id,
    docId: row.id,
    name: row.name ?? '',
    description: row.description ?? '',
    type: row.type ?? '',
    sizes: toStrArray(row.sizes),
    skills: toStrArray(row.skills),
    species_traits: toStrArray(row.species_traits),
    ancestry_traits: toStrArray(row.ancestry_traits),
    flaws: toStrArray(row.flaws),
    characteristics: toStrArray(row.characteristics),
    ave_hgt_cm: row.ave_hgt_cm != null ? Number(row.ave_hgt_cm) : undefined,
    ave_wgt_kg: row.ave_wgt_kg != null ? Number(row.ave_wgt_kg) : undefined,
    adulthood_lifespan: row.adulthood_lifespan ?? undefined,
    languages: toStrArray(row.languages),
    _source: 'user',
  };
  if (typeof base.adulthood_lifespan === 'string' && base.adulthood_lifespan.includes(',')) {
    base.adulthood_lifespan = (base.adulthood_lifespan as string)
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !Number.isNaN(n));
  }
  return { ...base, ...payload };
}

/** Split species body into scalars (for columns; arrays → comma-sep) and payload. */
export function bodyToColumnarSpecies(body: Record<string, unknown>): {
  scalars: Record<string, unknown>;
  payload: Record<string, unknown>;
} {
  const scalarKeys = new Set([
    'name',
    'description',
    'type',
    'sizes',
    'skills',
    'species_traits',
    'ancestry_traits',
    'flaws',
    'characteristics',
    'ave_hgt_cm',
    'ave_wgt_kg',
    'adulthood_lifespan',
    'languages',
  ]);
  const scalars: Record<string, unknown> = {};
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (k === 'id' || k === 'docId' || k === '_source') continue;
    if (scalarKeys.has(k)) {
      if (SPECIES_ARRAY_KEYS.includes(k as (typeof SPECIES_ARRAY_KEYS)[number]) && Array.isArray(v)) {
        scalars[k] = (v as unknown[]).map(String).join(',');
      } else if (k === 'adulthood_lifespan' && Array.isArray(v)) {
        scalars[k] = (v as unknown[]).map(String).join(',');
      } else {
        scalars[k] = v;
      }
    } else {
      payload[k] = v;
    }
  }
  return { scalars, payload };
}

/** Species row for DB: snake_case, arrays already comma-sep. */
export function toDbRowSpecies(obj: Record<string, unknown>): Record<string, unknown> {
  return toDbRow(obj);
}
