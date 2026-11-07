/**
 * Authoritative top-level keys for library POST/PATCH bodies.
 * Aligned with `src/types/library.ts` and creature-creator save payloads — not a fork of columnar metadata.
 */

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
] as const;

const IMAGE_KEYS = ['imageId', 'imageUrl', 'image_id', 'image_url'] as const;

/** Keys persisted for powers (`LibraryPower` + columnar aliases). */
const POWER_PERSISTED_KEYS = [
  'name',
  'description',
  'parts',
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

/** Validate shapes for keys present in this mutation body (not rules math). */
export function persistedLibraryBodyShapeError(
  type: ColumnarLibraryType,
  body: Record<string, unknown>,
): string | null {
  if ('parts' in body && body.parts !== undefined && !Array.isArray(body.parts)) {
    return 'parts must be an array';
  }
  if ('damage' in body && body.damage !== undefined && !Array.isArray(body.damage)) {
    return 'damage must be an array';
  }
  if ('properties' in body && body.properties !== undefined && !Array.isArray(body.properties)) {
    return 'properties must be an array';
  }
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
  if (
    type === 'creatures' &&
    'skills' in body &&
    body.skills !== undefined &&
    !Array.isArray(body.skills)
  ) {
    return 'skills must be an array';
  }
  if (
    (type === 'techniques' || type === 'empowered-techniques') &&
    'power' in body &&
    body.power !== undefined &&
    !isPlainObject(body.power)
  ) {
    return 'power must be an object';
  }
  if (
    type === 'empowered-techniques' &&
    'technique' in body &&
    body.technique !== undefined &&
    !isPlainObject(body.technique)
  ) {
    return 'technique must be an object';
  }
  return null;
}
