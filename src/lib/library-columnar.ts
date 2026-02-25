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

const BODY_TO_PRISMA: Record<string, string> = {
  action_type: 'actionType',
  is_reaction: 'isReaction',
  weapon_name: 'weaponName',
  armor_value: 'armorValue',
  damage_reduction: 'damageReduction',
  hit_points: 'hitPoints',
  energy_points: 'energyPoints',
};

/** Build client-shaped item from a columnar row (official or user). */
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
    base.actionType = row.actionType;
    base.isReaction = row.isReaction;
    base.innate = row.innate;
  }
  if (type === 'techniques') {
    base.actionType = row.actionType;
    base.weaponName = row.weaponName;
    if (row.weaponName && !payload.weapon) base.weapon = { name: row.weaponName };
  }
  if (type === 'items') {
    base.type = row.type;
    base.rarity = row.rarity;
    base.armorValue = row.armorValue;
    base.damageReduction = row.damageReduction;
  }
  if (type === 'creatures') {
    base.level = row.level;
    base.type = row.type;
    base.size = row.size;
    base.hitPoints = row.hitPoints;
    base.energyPoints = row.energyPoints;
  }
  base.createdAt = row.createdAt;
  base.updatedAt = row.updatedAt;
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
    const camel = BODY_TO_PRISMA[k] ?? k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (scalarKeys.has(camel) || scalarKeys.has(k)) {
      scalars[camel] = v;
    } else {
      payload[k] = v;
    }
  }
  return { scalars, payload };
}
