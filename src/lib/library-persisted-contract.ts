/**
 * Authoritative top-level keys for library POST/PATCH bodies.
 * Aligned with `src/types/library.ts` and creature-creator save payloads — not a fork of columnar metadata.
 */

import {
  CREATOR_DESCRIPTION_MAX_LENGTH,
  CREATOR_NAME_MAX_LENGTH,
} from '@/lib/creator/creator-text-limits';
import {
  COLUMNAR_LIBRARY_TYPES,
  LIBRARY_BODY_TO_CAMEL,
  LIBRARY_SCALAR_KEYS,
  type ColumnarLibraryType,
} from '@/lib/library-columnar-keys';

export type { ColumnarLibraryType };

const META_KEYS = [
  'id',
  'docId',
  '_source',
  'duplicateOf',
  'updatedAt',
  'createdAt',
  'catalogListing',
  'catalog_listing',
  /** Set by `withSyncMeta` / Library Sync and creature creator saves (`library-sync.ts`). */
  'syncMeta',
] as const;

const IMAGE_KEYS = ['imageId', 'imageUrl', 'image_id', 'image_url'] as const;

/** Keys persisted for powers (`LibraryPower` + columnar aliases). */
const POWER_PERSISTED_KEYS = [
  'name',
  'description',
  'parts',
  /** Legacy alias still read by `power-creator-bootstrap.ts`. */
  'powerParts',
  'damage',
  'actionType',
  'action_type',
  'isReaction',
  'is_reaction',
  'innate',
  'attackMode',
  'range',
  'area',
  'duration',
  'targetedDefenses',
  'composition',
  'mechanics',
  'autoMechanics',
] as const;

const TECHNIQUE_PERSISTED_KEYS = [
  ...POWER_PERSISTED_KEYS,
  'weapon',
  'weaponName',
  'weapon_name',
  'techniqueParts',
  /** Legacy fields read by `technique-creator-bootstrap.ts`. */
  'actionTypeSelection',
  'reaction',
  'empoweredTechnique',
  'empowered_technique',
  'power',
  'technique',
  'totals',
] as const;

const ITEM_PERSISTED_KEYS = [
  'name',
  'description',
  'type',
  'rarity',
  'properties',
  'damage',
  'costs',
  'isTwoHanded',
  'is_two_handed',
  'rangeLevel',
  'rangeSteps',
  'range_steps',
  'abilityRequirement',
  'ability_requirement',
  'damageReduction',
  'damage_reduction',
  'armorValue',
  'armor_value',
  'agilityReduction',
  'agility_reduction',
  'criticalRangeIncrease',
  'critical_range_increase',
  'shieldDR',
  'shield_dr',
  'shieldDamage',
  'shield_damage',
  'hasShieldDamage',
] as const;

/** Creature creator saves full `CreatureState` (see creature-creator-types.ts). */
const CREATURE_PERSISTED_KEYS = [
  'name',
  'description',
  'level',
  'type',
  'size',
  'hitPoints',
  'hit_points',
  'energyPoints',
  'energy_points',
  'hp',
  'archetypeType',
  'abilities',
  'defenses',
  'powerProficiency',
  'martialProficiency',
  'resistances',
  'weaknesses',
  'immunities',
  'conditionImmunities',
  'senses',
  'movementTypes',
  'languages',
  'skills',
  'powers',
  'techniques',
  'feats',
  'weapons',
  'armor',
  'shields',
  'equipment',
  'armaments',
  'attacks',
  'parts',
  'loadout',
  'enablePowers',
  'enableTechniques',
  'enableArmaments',
] as const;

const SPECIES_PERSISTED_KEYS = [
  'name',
  'description',
  'type',
  'size',
  'sizes',
  'speed',
  'skills',
  'species_traits',
  'ancestry_traits',
  'flaws',
  'characteristics',
  'languages',
  'ave_height',
  'ave_weight',
  'ave_hgt_cm',
  'ave_wgt_kg',
  'adulthood_lifespan',
  'updated_at',
] as const;

function buildAllowlist(type: ColumnarLibraryType): Set<string> {
  const scalars = LIBRARY_SCALAR_KEYS[type];
  const payloadKeys =
    type === 'powers'
      ? POWER_PERSISTED_KEYS
      : type === 'techniques'
        ? TECHNIQUE_PERSISTED_KEYS
        : type === 'empowered-techniques'
          ? TECHNIQUE_PERSISTED_KEYS
          : type === 'items'
            ? ITEM_PERSISTED_KEYS
            : CREATURE_PERSISTED_KEYS;
  return new Set([
    ...META_KEYS,
    ...IMAGE_KEYS,
    ...scalars,
    ...Object.keys(LIBRARY_BODY_TO_CAMEL),
    ...payloadKeys,
  ]);
}

const ALLOWLIST_BY_TYPE: Record<ColumnarLibraryType, Set<string>> = Object.fromEntries(
  COLUMNAR_LIBRARY_TYPES.map((type) => [type, buildAllowlist(type)]),
) as Record<ColumnarLibraryType, Set<string>>;

const SPECIES_ALLOWLIST = new Set<string>([...META_KEYS, ...IMAGE_KEYS, ...SPECIES_PERSISTED_KEYS]);

export function isColumnarLibraryTypeName(type: string): type is ColumnarLibraryType {
  return COLUMNAR_LIBRARY_TYPES.includes(type as ColumnarLibraryType);
}

export function unknownPersistedLibraryKeys(
  type: ColumnarLibraryType,
  body: Record<string, unknown>,
): string[] {
  const allowed = ALLOWLIST_BY_TYPE[type];
  return Object.keys(body).filter((key) => !allowed.has(key));
}

export function unknownPersistedSpeciesKeys(body: Record<string, unknown>): string[] {
  return Object.keys(body).filter((key) => !SPECIES_ALLOWLIST.has(key));
}

export function isPersistedLibraryBodyKey(type: ColumnarLibraryType, key: string): boolean {
  return ALLOWLIST_BY_TYPE[type].has(key);
}

export function isPersistedSpeciesBodyKey(key: string): boolean {
  return SPECIES_ALLOWLIST.has(key);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function textBoundsError(key: string, value: unknown, max: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return `${key} must be a string`;
  if (value.length > max) return `${key} exceeds maximum length`;
  return null;
}

function isAllowedPartId(value: unknown): boolean {
  const t = typeof value;
  return t === 'string' || t === 'number' || t === 'boolean';
}

function savedPartRecordError(value: unknown, path: string): string | null {
  if (!isPlainObject(value)) return `${path} must be an object`;
  const record = value;
  if ('id' in record && record.id !== undefined && !isAllowedPartId(record.id)) {
    return `${path}.id has an unsupported type`;
  }
  if ('name' in record && record.name !== undefined && typeof record.name !== 'string') {
    return `${path}.name must be a string`;
  }
  for (const key of ['op_1_lvl', 'op_2_lvl', 'op_3_lvl', 'op_1Lvl', 'op_2Lvl', 'op_3Lvl']) {
    if (key in record && record[key] !== undefined && typeof record[key] !== 'number') {
      return `${path}.${key} must be a number`;
    }
  }
  return null;
}

function validatePartsArray(parts: unknown, label: string): string | null {
  if (parts === undefined) return null;
  if (!Array.isArray(parts)) return `${label} must be an array`;
  for (let i = 0; i < parts.length; i++) {
    const err = savedPartRecordError(parts[i], `${label}[${i}]`);
    if (err) return err;
  }
  return null;
}

/** `CreatureSkill` records from creature-creator-types.ts; legacy rows may store skill names as strings. */
function creatureSkillEntryError(value: unknown, path: string): string | null {
  if (typeof value === 'string') return null;
  if (!isPlainObject(value)) return `${path} must be an object or string`;
  const record = value;
  if (typeof record.name !== 'string') return `${path}.name must be a string`;
  if (typeof record.value !== 'number' || !Number.isFinite(record.value)) {
    return `${path}.value must be a number`;
  }
  if (typeof record.proficient !== 'boolean') return `${path}.proficient must be a boolean`;
  if ('id' in record && record.id !== undefined && typeof record.id !== 'string') {
    return `${path}.id must be a string`;
  }
  if (
    'baseSkillId' in record &&
    record.baseSkillId !== undefined &&
    typeof record.baseSkillId !== 'string'
  ) {
    return `${path}.baseSkillId must be a string`;
  }
  if (
    'isSubSkill' in record &&
    record.isSubSkill !== undefined &&
    typeof record.isSubSkill !== 'boolean'
  ) {
    return `${path}.isSubSkill must be a boolean`;
  }
  return null;
}

function validateCreatureSkillsArray(skills: unknown): string | null {
  if (skills === undefined) return null;
  if (!Array.isArray(skills)) return 'skills must be an array';
  for (let i = 0; i < skills.length; i++) {
    const err = creatureSkillEntryError(skills[i], `skills[${i}]`);
    if (err) return err;
  }
  return null;
}

const SPECIES_STRING_ARRAY_KEYS = [
  'sizes',
  'skills',
  'species_traits',
  'ancestry_traits',
  'flaws',
  'characteristics',
  'languages',
] as const;

/** Validate species mutation shapes (not rules math). */
export function persistedSpeciesBodyShapeError(body: Record<string, unknown>): string | null {
  const nameErr = textBoundsError('name', body.name, CREATOR_NAME_MAX_LENGTH);
  if (nameErr) return nameErr;
  const descErr = textBoundsError('description', body.description, CREATOR_DESCRIPTION_MAX_LENGTH);
  if (descErr) return descErr;
  for (const key of SPECIES_STRING_ARRAY_KEYS) {
    if (key in body && body[key] !== undefined && !isStringArray(body[key])) {
      return `${key} must be an array of strings`;
    }
  }
  return null;
}

/** Validate shapes for keys present in this mutation body (not rules math). */
export function persistedLibraryBodyShapeError(
  type: ColumnarLibraryType,
  body: Record<string, unknown>,
): string | null {
  const nameErr = textBoundsError('name', body.name, CREATOR_NAME_MAX_LENGTH);
  if (nameErr) return nameErr;
  const descErr = textBoundsError('description', body.description, CREATOR_DESCRIPTION_MAX_LENGTH);
  if (descErr) return descErr;
  if ('reaction' in body && body.reaction !== undefined && typeof body.reaction !== 'boolean') {
    return 'reaction must be a boolean';
  }
  if (
    'actionTypeSelection' in body &&
    body.actionTypeSelection !== undefined &&
    typeof body.actionTypeSelection !== 'string'
  ) {
    return 'actionTypeSelection must be a string';
  }
  if (
    'isReaction' in body &&
    body.isReaction !== undefined &&
    typeof body.isReaction !== 'boolean'
  ) {
    return 'isReaction must be a boolean';
  }
  const partsErr = validatePartsArray(body.parts, 'parts');
  if (partsErr) return partsErr;
  const techniquePartsErr = validatePartsArray(body.techniqueParts, 'techniqueParts');
  if (techniquePartsErr) return techniquePartsErr;
  const powerPartsErr = validatePartsArray(body.powerParts, 'powerParts');
  if (powerPartsErr) return powerPartsErr;
  if ('damage' in body && body.damage !== undefined && !Array.isArray(body.damage)) {
    return 'damage must be an array';
  }
  const propsErr = validatePartsArray(body.properties, 'properties');
  if (propsErr) return propsErr;
  if ('composition' in body && body.composition !== undefined && !isPlainObject(body.composition)) {
    return 'composition must be an object';
  }
  if ('totals' in body && body.totals !== undefined && !isPlainObject(body.totals)) {
    return 'totals must be an object';
  }
  if ('abilities' in body && body.abilities !== undefined && !isPlainObject(body.abilities)) {
    return 'abilities must be an object';
  }
  if ('defenses' in body && body.defenses !== undefined && !isPlainObject(body.defenses)) {
    return 'defenses must be an object';
  }
  if (type === 'creatures') {
    for (const key of [
      'skills',
      'powers',
      'techniques',
      'weapons',
      'armor',
      'shields',
      'equipment',
    ] as const) {
      if (key in body && body[key] !== undefined && !Array.isArray(body[key])) {
        return `${key} must be an array`;
      }
    }
    const skillsErr = validateCreatureSkillsArray(body.skills);
    if (skillsErr) return skillsErr;
  }
  if (
    (type === 'techniques' || type === 'empowered-techniques') &&
    'power' in body &&
    body.power !== undefined &&
    !isPlainObject(body.power)
  ) {
    return 'power must be an object';
  }
  if (isPlainObject(body.power)) {
    const nested = validatePartsArray(body.power.parts, 'power.parts');
    if (nested) return nested;
  }
  if (
    type === 'empowered-techniques' &&
    'technique' in body &&
    body.technique !== undefined &&
    !isPlainObject(body.technique)
  ) {
    return 'technique must be an object';
  }
  if (isPlainObject(body.technique)) {
    const nested = validatePartsArray(body.technique.parts, 'technique.parts');
    if (nested) return nested;
  }
  if ('syncMeta' in body && body.syncMeta !== undefined) {
    if (!isPlainObject(body.syncMeta)) {
      return 'syncMeta must be an object';
    }
    const meta = body.syncMeta as Record<string, unknown>;
    const keys = Object.keys(meta);
    const allowed = new Set(['dependencyFingerprint', 'syncedAt']);
    if (keys.some((k) => !allowed.has(k))) {
      return 'syncMeta contains unsupported fields';
    }
    if (
      'dependencyFingerprint' in meta &&
      meta.dependencyFingerprint !== undefined &&
      typeof meta.dependencyFingerprint !== 'string'
    ) {
      return 'syncMeta.dependencyFingerprint must be a string';
    }
    if ('syncedAt' in meta && meta.syncedAt !== undefined && typeof meta.syncedAt !== 'string') {
      return 'syncMeta.syncedAt must be a string';
    }
  }
  return null;
}
