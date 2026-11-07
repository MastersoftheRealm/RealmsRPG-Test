export const COLUMNAR_LIBRARY_TYPES = [
  'powers',
  'techniques',
  'empowered-techniques',
  'items',
  'creatures',
] as const;

export type ColumnarLibraryType = (typeof COLUMNAR_LIBRARY_TYPES)[number];

const LIBRARY_SCALAR_KEYS: Record<ColumnarLibraryType, readonly string[]> = {
  powers: [
    'name',
    'description',
    'actionType',
    'isReaction',
    'innate',
    'rangeSteps',
    'durationType',
    'durationValue',
    'areaType',
    'areaLevel',
    'damage',
    'imageId',
    'imageUrl',
  ],
  techniques: [
    'name',
    'description',
    'actionType',
    'rangeSteps',
    'durationType',
    'durationValue',
    'damage',
    'imageId',
    'imageUrl',
  ],
  'empowered-techniques': [
    'name',
    'description',
    'actionType',
    'rangeSteps',
    'durationType',
    'durationValue',
    'damage',
    'imageId',
    'imageUrl',
  ],
  items: [
    'name',
    'description',
    'type',
    'rarity',
    'armorValue',
    'damageReduction',
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
    'imageId',
    'imageUrl',
  ],
  creatures: [
    'name',
    'description',
    'level',
    'type',
    'size',
    'hitPoints',
    'energyPoints',
    'imageId',
    'imageUrl',
  ],
};

const LIBRARY_BODY_TO_CAMEL: Record<string, string> = {
  action_type: 'actionType',
  is_reaction: 'isReaction',
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
  image_id: 'imageId',
  image_url: 'imageUrl',
};

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

const POWER_PAYLOAD_KEYS = [
  'range',
  'duration',
  'area',
  'damage',
  'parts',
  'attackMode',
  'targetedDefenses',
  'powerComposition',
  'mechanics',
  'autoMechanics',
  'innate',
  'actionType',
  'action_type',
  'isReaction',
  'is_reaction',
] as const;

const TECHNIQUE_PAYLOAD_KEYS = [
  ...POWER_PAYLOAD_KEYS,
  'weapon',
  'weaponName',
  'weapon_name',
  'techniqueParts',
] as const;

const EMPOWERED_PAYLOAD_KEYS = [
  ...TECHNIQUE_PAYLOAD_KEYS,
  'empoweredTechnique',
  'power',
  'technique',
] as const;

const ITEM_PAYLOAD_KEYS = [
  'type',
  'rarity',
  'armorValue',
  'armor_value',
  'damageReduction',
  'damage_reduction',
  'rangeLevel',
  'rangeSteps',
  'range_steps',
  'isTwoHanded',
  'is_two_handed',
  'abilityRequirement',
  'ability_requirement',
  'costs',
  'damage',
  'properties',
  'agilityReduction',
  'agility_reduction',
  'criticalRangeIncrease',
  'critical_range_increase',
  'shieldDR',
  'shield_dr',
  'shieldDamage',
  'shield_damage',
  'name',
  'description',
] as const;

const CREATURE_PAYLOAD_KEYS = [
  'level',
  'type',
  'size',
  'hitPoints',
  'hit_points',
  'energyPoints',
  'energy_points',
  'name',
  'description',
  'parts',
  'feats',
  'skills',
  'loadout',
] as const;

const SPECIES_BODY_KEYS = [
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
  'ave_height',
  'ave_weight',
  'adulthood_lifespan',
  'languages',
  'updatedAt',
  'updated_at',
  ...IMAGE_KEYS,
  ...META_KEYS,
] as const;

function buildTypeAllowlist(type: ColumnarLibraryType): Set<string> {
  const scalars = LIBRARY_SCALAR_KEYS[type];
  const payloadKeys =
    type === 'powers'
      ? POWER_PAYLOAD_KEYS
      : type === 'techniques'
        ? TECHNIQUE_PAYLOAD_KEYS
        : type === 'empowered-techniques'
          ? EMPOWERED_PAYLOAD_KEYS
          : type === 'items'
            ? ITEM_PAYLOAD_KEYS
            : CREATURE_PAYLOAD_KEYS;
  return new Set([
    ...META_KEYS,
    ...IMAGE_KEYS,
    ...scalars,
    ...Object.keys(LIBRARY_BODY_TO_CAMEL),
    ...payloadKeys,
  ]);
}

const ALLOWLIST_BY_TYPE: Record<ColumnarLibraryType, Set<string>> = Object.fromEntries(
  COLUMNAR_LIBRARY_TYPES.map((type) => [type, buildTypeAllowlist(type)]),
) as Record<ColumnarLibraryType, Set<string>>;

const SPECIES_ALLOWLIST = new Set<string>(SPECIES_BODY_KEYS);

export function unknownLibraryBodyKeys(
  type: ColumnarLibraryType,
  body: Record<string, unknown>,
): string[] {
  const allowed = ALLOWLIST_BY_TYPE[type];
  return Object.keys(body).filter((key) => !allowed.has(key));
}

export function unknownSpeciesBodyKeys(body: Record<string, unknown>): string[] {
  return Object.keys(body).filter((key) => !SPECIES_ALLOWLIST.has(key));
}

export function isColumnarLibraryTypeName(type: string): type is ColumnarLibraryType {
  return COLUMNAR_LIBRARY_TYPES.includes(type as ColumnarLibraryType);
}

export function isAllowedLibraryBodyKey(type: ColumnarLibraryType, key: string): boolean {
  return ALLOWLIST_BY_TYPE[type].has(key);
}

export function isAllowedSpeciesBodyKey(key: string): boolean {
  return SPECIES_ALLOWLIST.has(key);
}
