/**
 * Library columnar helpers
 * =======================
 * Shared rowToItem and bodyToColumnar for official_* and user_* tables.
 * Same column set: scalars + one payload JSONB.
 */

export const COLUMNAR_LIBRARY_TYPES = ['powers', 'techniques', 'empowered-techniques', 'items', 'creatures'] as const;
export type ColumnarLibraryType = (typeof COLUMNAR_LIBRARY_TYPES)[number];

export const SCALAR_KEYS: Record<ColumnarLibraryType, string[]> = {
  powers: [
    'name', 'description', 'actionType', 'isReaction', 'innate',
    'rangeSteps', 'durationType', 'durationValue', 'areaType', 'areaLevel', 'damage',
  ],
  techniques: [
    'name', 'description', 'actionType', 'weaponName',
    'rangeSteps', 'durationType', 'durationValue', 'damage',
  ],
  'empowered-techniques': [
    'name', 'description', 'actionType', 'weaponName',
    'rangeSteps', 'durationType', 'durationValue', 'damage',
  ],
  items: [
    'name',
    'description',
    'type',
    'rarity',
    'armorValue',
    'damageReduction',
    // Armament mechanics (now columnar in Supabase)
    'rangeSteps',
    'isTwoHanded',
    'abilityRequirement',
    'costs',
    'damage',
    'properties',
    'agilityReduction',
    'criticalRangeIncrease',
    'shieldDR',
    'shieldDamage',
  ],
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
  range_steps: 'rangeSteps',
  duration_type: 'durationType',
  duration_value: 'durationValue',
  area_type: 'areaType',
  area_level: 'areaLevel',
  is_two_handed: 'isTwoHanded',
  ability_requirement: 'abilityRequirement',
  agility_reduction: 'agilityReduction',
  critical_range_increase: 'criticalRangeIncrease',
  shield_dr: 'shieldDR',
  shield_damage: 'shieldDamage',
};

const CAMEL_TO_SNAKE: Record<string, string> = {
  actionType: 'action_type',
  isReaction: 'is_reaction',
  weaponName: 'weapon_name',
  armorValue: 'armor_value',
  damageReduction: 'damage_reduction',
  hitPoints: 'hit_points',
  energyPoints: 'energy_points',
  rangeSteps: 'range_steps',
  durationType: 'duration_type',
  durationValue: 'duration_value',
  areaType: 'area_type',
  areaLevel: 'area_level',
  isTwoHanded: 'is_two_handed',
  abilityRequirement: 'ability_requirement',
  agilityReduction: 'agility_reduction',
  criticalRangeIncrease: 'critical_range_increase',
  shieldDR: 'shield_dr',
  shieldDamage: 'shield_damage',
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
  const base: Record<string, unknown> = {};
  const assignIfPresent = (key: string, val: unknown) => {
    if (val !== undefined && val !== null) base[key] = val;
  };

  // Identity always present (even if nullish, but keep stable)
  base.id = row.id;
  base.docId = row.id;
  if (row.name !== undefined && row.name !== null) base.name = row.name;
  if (row.description !== undefined && row.description !== null) base.description = row.description;
  if (source) base._source = source;
  if (type === 'powers') {
    assignIfPresent('actionType', v(row, 'actionType', 'action_type'));
    assignIfPresent('isReaction', v(row, 'isReaction', 'is_reaction'));
    assignIfPresent('innate', v(row, 'innate'));
    const rangeSteps = v(row, 'rangeSteps', 'range_steps') as number | undefined | null;
    const durationType = v(row, 'durationType', 'duration_type') as string | undefined | null;
    const durationValue = v(row, 'durationValue', 'duration_value') as number | undefined | null;
    const areaType = v(row, 'areaType', 'area_type') as string | undefined | null;
    const areaLevel = v(row, 'areaLevel', 'area_level') as number | undefined | null;
    const damageCol = row.damage as unknown[] | undefined;
    const payRange = payload.range as Record<string, unknown> | undefined;
    const payDuration = payload.duration as Record<string, unknown> | undefined;
    const payArea = payload.area as Record<string, unknown> | undefined;
    if (rangeSteps != null) base.range = { ...payRange, steps: rangeSteps };
    if (durationType != null || durationValue != null)
      base.duration = { ...payDuration, type: durationType ?? payDuration?.type, value: durationValue ?? payDuration?.value };
    if (areaType != null || areaLevel != null)
      base.area = { ...payArea, type: areaType ?? payArea?.type, level: areaLevel ?? payArea?.level };
    if (damageCol != null && Array.isArray(damageCol)) base.damage = damageCol;
  }
  if (type === 'techniques' || type === 'empowered-techniques') {
    assignIfPresent('actionType', v(row, 'actionType', 'action_type'));
    const weaponName = v(row, 'weaponName', 'weapon_name');
    assignIfPresent('weaponName', weaponName);
    if (weaponName && !payload.weapon) base.weapon = { name: weaponName };
    const rangeSteps = v(row, 'rangeSteps', 'range_steps') as number | undefined | null;
    const durationType = v(row, 'durationType', 'duration_type') as string | undefined | null;
    const durationValue = v(row, 'durationValue', 'duration_value') as number | undefined | null;
    const damageCol = row.damage as unknown[] | undefined;
    const payRange = payload.range as Record<string, unknown> | undefined;
    const payDuration = payload.duration as Record<string, unknown> | undefined;
    if (rangeSteps != null) base.range = { ...payRange, steps: rangeSteps };
    if (durationType != null || durationValue != null) {
      base.duration = {
        ...payDuration,
        type: durationType ?? payDuration?.type,
        value: durationValue ?? payDuration?.value,
      };
    }
    if (damageCol != null && Array.isArray(damageCol)) base.damage = damageCol;
  }
  if (type === 'items') {
    // IMPORTANT: Only assign scalar-backed fields when present on the row.
    // If the column doesn't exist (or is omitted), we must not overwrite payload values.
    assignIfPresent('type', v(row, 'type'));
    assignIfPresent('rarity', v(row, 'rarity'));
    assignIfPresent('armorValue', v(row, 'armorValue', 'armor_value'));
    assignIfPresent('damageReduction', v(row, 'damageReduction', 'damage_reduction'));
    assignIfPresent('rangeLevel', v(row, 'rangeSteps', 'range_steps'));
    assignIfPresent('isTwoHanded', v(row, 'isTwoHanded', 'is_two_handed'));
    assignIfPresent('abilityRequirement', v(row, 'abilityRequirement', 'ability_requirement'));
    assignIfPresent('agilityReduction', v(row, 'agilityReduction', 'agility_reduction'));
    assignIfPresent('criticalRangeIncrease', v(row, 'criticalRangeIncrease', 'critical_range_increase'));
    assignIfPresent('shieldDR', v(row, 'shieldDR', 'shield_dr'));
    assignIfPresent('shieldDamage', v(row, 'shieldDamage', 'shield_damage'));

    // Transition hardening:
    // If columns exist but are still default/empty (e.g. `damage = []`, `properties = []`)
    // while payload contains the real saved data, prefer the payload so UI doesn't go blank.
    const payloadCosts = payload.costs;
    const payloadDamage = payload.damage;
    const payloadProps = payload.properties;
    const costsCol = v(row, 'costs') as unknown;
    const damageCol = v(row, 'damage') as unknown;
    const propertiesCol = v(row, 'properties') as unknown;

    // costs: keep scalar if it's a non-empty object; otherwise fall back to payload.
    const costsIsNonEmptyObject =
      costsCol != null && typeof costsCol === 'object' && !Array.isArray(costsCol) && Object.keys(costsCol as Record<string, unknown>).length > 0;
    if (costsIsNonEmptyObject) {
      base.costs = costsCol;
    } else if (payloadCosts !== undefined && payloadCosts !== null) {
      // no-op: payload will supply it
    }

    // damage/properties: only override payload when the column array is non-empty.
    const damageIsNonEmptyArray = Array.isArray(damageCol) && damageCol.length > 0;
    const payloadDamageIsArray = Array.isArray(payloadDamage) && payloadDamage.length > 0;
    if (damageIsNonEmptyArray || (!payloadDamageIsArray && Array.isArray(damageCol))) {
      // If payload has no damage, allow empty column to be authoritative.
      base.damage = damageCol;
    }

    const propsIsNonEmptyArray = Array.isArray(propertiesCol) && propertiesCol.length > 0;
    const payloadPropsIsArray = Array.isArray(payloadProps) && payloadProps.length > 0;
    if (propsIsNonEmptyArray || (!payloadPropsIsArray && Array.isArray(propertiesCol))) {
      base.properties = propertiesCol;
    }
  }
  if (type === 'creatures') {
    assignIfPresent('level', v(row, 'level'));
    assignIfPresent('type', v(row, 'type'));
    assignIfPresent('size', v(row, 'size'));
    assignIfPresent('hitPoints', v(row, 'hitPoints', 'hit_points'));
    assignIfPresent('energyPoints', v(row, 'energyPoints', 'energy_points'));
  }
  assignIfPresent('createdAt', v(row, 'createdAt', 'created_at'));
  assignIfPresent('updatedAt', v(row, 'updatedAt', 'updated_at'));
  // Payload first, then explicit columns override overlapping keys.
  return { ...payload, ...base };
}

/** Split request body into scalars (for columns) and payload (JSONB). */
export function bodyToColumnar(
  type: ColumnarLibraryType,
  body: Record<string, unknown>
): { scalars: Record<string, unknown>; payload: Record<string, unknown> } {
  const scalarKeys = new Set(SCALAR_KEYS[type]);
  const scalars: Record<string, unknown> = {};
  const payload: Record<string, unknown> = {};

  if (type === 'powers') {
    const range = body.range as Record<string, unknown> | undefined;
    const duration = body.duration as Record<string, unknown> | undefined;
    const area = body.area as Record<string, unknown> | undefined;
    if (range && typeof range === 'object' && range.steps != null) scalars.rangeSteps = range.steps;
    if (duration && typeof duration === 'object') {
      if (duration.type != null) scalars.durationType = duration.type;
      if (duration.value != null) scalars.durationValue = duration.value;
    }
    if (area && typeof area === 'object') {
      if (area.type != null) scalars.areaType = area.type;
      if (area.level != null) scalars.areaLevel = area.level;
    }
    if (Array.isArray(body.damage)) scalars.damage = body.damage;
  }

  if (type === 'techniques' || type === 'empowered-techniques') {
    const range = (body.range ?? (body.power as Record<string, unknown> | undefined)?.range) as
      | Record<string, unknown>
      | undefined;
    const duration = (body.duration ?? (body.power as Record<string, unknown> | undefined)?.duration) as
      | Record<string, unknown>
      | undefined;
    const damage = (body.damage ?? (body.power as Record<string, unknown> | undefined)?.damage) as unknown;
    if (range && typeof range === 'object' && range.steps != null) scalars.rangeSteps = range.steps;
    if (duration && typeof duration === 'object') {
      if (duration.type != null) scalars.durationType = duration.type;
      if (duration.value != null) scalars.durationValue = duration.value;
    }
    if (Array.isArray(damage)) scalars.damage = damage;
  }

  if (type === 'items') {
    // Prefer columnar fields when present in request body (current schema includes these columns).
    if (body.rangeLevel != null) scalars.rangeSteps = body.rangeLevel;
    if (body.rangeSteps != null) scalars.rangeSteps = body.rangeSteps;
    if (body.isTwoHanded != null) scalars.isTwoHanded = body.isTwoHanded;
    if (body.abilityRequirement != null) scalars.abilityRequirement = body.abilityRequirement;
    if (body.costs != null) scalars.costs = body.costs;
    if (Array.isArray(body.damage)) scalars.damage = body.damage;
    if (Array.isArray(body.properties)) scalars.properties = body.properties;
    if (body.agilityReduction != null) scalars.agilityReduction = body.agilityReduction;
    if (body.criticalRangeIncrease != null) scalars.criticalRangeIncrease = body.criticalRangeIncrease;
    if (body.shieldDR != null) scalars.shieldDR = body.shieldDR;
    if (body.shieldDamage != null) scalars.shieldDamage = body.shieldDamage;
  }

  const skipKeys = new Set<string>([
    ...(type === 'powers' ? ['range', 'duration', 'area', 'damage'] : []),
    ...((type === 'techniques' || type === 'empowered-techniques') ? ['range', 'duration', 'damage'] : []),
    ...(type === 'items'
      ? [
          // Stored in scalar columns (rangeSteps/isTwoHanded/etc.) via the block above.
          'rangeLevel',
          'rangeSteps',
          'isTwoHanded',
          'abilityRequirement',
          'costs',
          'damage',
          'properties',
          'agilityReduction',
          'criticalRangeIncrease',
          'shieldDR',
          'shieldDamage',
        ]
      : []),
  ]);

  for (const [k, v] of Object.entries(body)) {
    if (k === 'id' || k === 'docId' || k === '_source') continue;
    if (skipKeys.has(k)) continue;
    const camel = BODY_TO_CAMEL[k] ?? k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (scalarKeys.has(camel) || scalarKeys.has(k)) {
      // user_creatures.level is an INTEGER column in DB, but creature creator allows
      // sub-level values (0.25/0.5/0.75). Keep fractional levels in payload and
      // only write scalar level when the value is an integer.
      if (type === 'creatures' && camel === 'level') {
        const parsed = typeof v === 'number' ? v : Number(v);
        if (Number.isFinite(parsed) && Number.isInteger(parsed)) {
          scalars[camel] = parsed;
        } else {
          payload[k] = Number.isFinite(parsed) ? parsed : v;
        }
        continue;
      }
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
