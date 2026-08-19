/**
 * GLR fact catalog (TASK-806 / ADR-0016).
 *
 * Sitewide SoT for which quick-ref facts exist, which entity types they apply to,
 * and how they rank. Density modes + the layout resolver decide column vs chip.
 * Formatting lives in compact-facts; this module only names facts and metadata.
 *
 * @see src/docs/ai/ADR/0016-glr-fact-catalog.md
 */

export type GlrFactId =
  | 'actionType'
  | 'area'
  | 'abilityRequirement'
  | 'agilityReduction'
  | 'block'
  | 'category'
  | 'criticalRangeIncrease'
  | 'currency'
  | 'damage'
  | 'damageReduction'
  | 'duration'
  | 'energy'
  | 'range'
  | 'rarity'
  | 'recovery'
  | 'reqLevel'
  | 'trainingPoints'
  | 'uses'
  | 'weapon';

export type GlrEntityType = 'power' | 'technique' | 'weapon' | 'armor' | 'shield' | 'feat' | 'gear';

export type GlrFactBand = 'primary' | 'secondary' | 'tertiary';

export interface GlrEntityFactMeta {
  band: GlrFactBand;
  orderInBand: number;
  displayOrder: number;
  columnKey?: string | undefined;
  headerTrack?: string | undefined;
}

export interface GlrFactDef {
  id: GlrFactId;
  /** Dense browse header (typically uppercase). */
  headerLabel: string;
  /** Play / select / USM header. */
  titleLabel: string;
  preferredColumnKey: string;
  /** Add/load USM key when it differs from preferredColumnKey. */
  usmKey?: string | undefined;
  columnKeys: string[];
  chipPatterns: RegExp[];
  entities: Partial<Record<GlrEntityType, GlrEntityFactMeta>>;
  /** compact-facts helper name (documentation / Wave 2 chip builders). */
  chipFormatter?: string | undefined;
  zeroIsMeaningful?: boolean | undefined;
}

export const GLR_BAND_RANK: Record<GlrFactBand, number> = {
  primary: 0,
  secondary: 1,
  tertiary: 2,
};

/** Normalize column/header keys for flexible matching. */
export function normalizeGlrColumnKey(key: string): string {
  return key.trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ');
}

function col(...keys: string[]): string[] {
  return keys.map(normalizeGlrColumnKey);
}

export const GLR_FACT_CATALOG: Record<GlrFactId, GlrFactDef> = {
  actionType: {
    id: 'actionType',
    headerLabel: 'ACTION',
    titleLabel: 'Action',
    preferredColumnKey: 'action',
    usmKey: 'Action',
    columnKeys: col('action', 'action type'),
    chipPatterns: [/^(quick|basic|full)?\s*(action|reaction)/i],
    chipFormatter: 'actionTypeFactChip',
    entities: {
      power: { band: 'primary', orderInBand: 2, displayOrder: 3, headerTrack: '0.9fr' },
      technique: { band: 'primary', orderInBand: 2, displayOrder: 4, headerTrack: '0.9fr' },
    },
  },
  area: {
    id: 'area',
    headerLabel: 'AREA',
    titleLabel: 'Area',
    preferredColumnKey: 'area',
    usmKey: 'Area',
    columnKeys: col('area'),
    chipPatterns: [/^area\b/i],
    entities: {
      power: { band: 'secondary', orderInBand: 4, displayOrder: 6, headerTrack: '0.9fr' },
    },
  },
  abilityRequirement: {
    id: 'abilityRequirement',
    headerLabel: 'ABL. REQ.',
    titleLabel: 'Abl. Req.',
    preferredColumnKey: 'abilityRequirement',
    columnKeys: col('abilityRequirement', 'abl req', 'ability req', 'ability'),
    chipPatterns: [/requirement\s+\d+\+/i, /^ability\b/i],
    chipFormatter: 'abilityRequirementChip',
    entities: {
      armor: {
        band: 'secondary',
        orderInBand: 1,
        displayOrder: 6,
        headerTrack: '0.9fr',
      },
      feat: {
        band: 'primary',
        orderInBand: 2,
        displayOrder: 3,
        columnKey: 'ability',
        headerTrack: '0.8fr',
      },
    },
  },
  agilityReduction: {
    id: 'agilityReduction',
    headerLabel: 'AGILITY RED.',
    titleLabel: 'Agility Red.',
    preferredColumnKey: 'agilityReduction',
    columnKeys: col('agilityReduction', 'agility red', 'agility reduction'),
    chipPatterns: [/agility reduction/i],
    chipFormatter: 'agilityReductionFactChip',
    zeroIsMeaningful: true,
    entities: {
      armor: { band: 'secondary', orderInBand: 2, displayOrder: 5, headerTrack: '0.7fr' },
    },
  },
  block: {
    id: 'block',
    headerLabel: 'BLOCK',
    titleLabel: 'Block',
    preferredColumnKey: 'block',
    usmKey: 'Block',
    columnKeys: col('block'),
    chipPatterns: [/^block\b/i],
    entities: {
      shield: { band: 'primary', orderInBand: 1, displayOrder: 4, headerTrack: '0.8fr' },
    },
  },
  category: {
    id: 'category',
    headerLabel: 'CATEGORY',
    titleLabel: 'Category',
    preferredColumnKey: 'category',
    columnKeys: col('category'),
    chipPatterns: [/^category\b/i],
    entities: {
      power: { band: 'secondary', orderInBand: 1, displayOrder: 1, headerTrack: '1fr' },
      technique: { band: 'secondary', orderInBand: 1, displayOrder: 1, headerTrack: '1fr' },
      feat: { band: 'primary', orderInBand: 1, displayOrder: 2, headerTrack: '1fr' },
      gear: { band: 'primary', orderInBand: 1, displayOrder: 1, headerTrack: '1.1fr' },
    },
  },
  criticalRangeIncrease: {
    id: 'criticalRangeIncrease',
    headerLabel: 'CRIT +',
    titleLabel: 'Crit Range',
    preferredColumnKey: 'criticalRangeIncrease',
    columnKeys: col('criticalRangeIncrease', 'crit +', 'crit range', 'crit'),
    chipPatterns: [/critical range/i],
    chipFormatter: 'criticalRangeIncreaseFactChip',
    zeroIsMeaningful: true,
    entities: {
      armor: { band: 'primary', orderInBand: 2, displayOrder: 7, headerTrack: '0.55fr' },
    },
  },
  currency: {
    id: 'currency',
    headerLabel: 'CURRENCY',
    titleLabel: 'Currency',
    preferredColumnKey: 'currency',
    columnKeys: col('currency'),
    chipPatterns: [/^currency\s+\d+/i],
    chipFormatter: 'currencyFactChip',
    zeroIsMeaningful: true,
    entities: {
      weapon: { band: 'secondary', orderInBand: 2, displayOrder: 2, headerTrack: '0.7fr' },
      armor: { band: 'secondary', orderInBand: 4, displayOrder: 2, headerTrack: '0.6fr' },
      shield: { band: 'secondary', orderInBand: 2, displayOrder: 2, headerTrack: '0.7fr' },
      gear: { band: 'primary', orderInBand: 2, displayOrder: 2, headerTrack: '0.7fr' },
    },
  },
  damage: {
    id: 'damage',
    headerLabel: 'DAMAGE',
    titleLabel: 'Damage',
    preferredColumnKey: 'damage',
    usmKey: 'Damage',
    columnKeys: col('damage'),
    chipPatterns: [/\d+d\d+.*damage/i, /^(?!category\b).+\bdamage$/i],
    chipFormatter: 'damageFactChip',
    entities: {
      power: { band: 'primary', orderInBand: 3, displayOrder: 7, headerTrack: '0.9fr' },
      technique: { band: 'primary', orderInBand: 4, displayOrder: 6, headerTrack: '1fr' },
      weapon: { band: 'primary', orderInBand: 1, displayOrder: 5, headerTrack: '1fr' },
      shield: { band: 'primary', orderInBand: 2, displayOrder: 5, headerTrack: '1fr' },
    },
  },
  damageReduction: {
    id: 'damageReduction',
    headerLabel: 'DAMAGE RED.',
    titleLabel: 'Dmg. Red.',
    preferredColumnKey: 'damageReduction',
    usmKey: 'armor',
    columnKeys: col('damageReduction', 'damage red', 'dmg red', 'damage reduction', 'dr', 'armor'),
    chipPatterns: [/damage reduction/i],
    chipFormatter: 'damageReductionFactChip',
    zeroIsMeaningful: true,
    entities: {
      armor: { band: 'primary', orderInBand: 1, displayOrder: 4, headerTrack: '0.7fr' },
    },
  },
  duration: {
    id: 'duration',
    headerLabel: 'DURATION',
    titleLabel: 'Duration',
    preferredColumnKey: 'duration',
    usmKey: 'Duration',
    columnKeys: col('duration'),
    chipPatterns: [/^duration\b/i],
    entities: {
      power: { band: 'secondary', orderInBand: 2, displayOrder: 4, headerTrack: '0.9fr' },
    },
  },
  energy: {
    id: 'energy',
    headerLabel: 'ENERGY',
    titleLabel: 'Energy',
    preferredColumnKey: 'energy',
    usmKey: 'Energy',
    columnKeys: col('energy'),
    chipPatterns: [/^energy\s+\d+/i],
    chipFormatter: 'energyFactChip',
    zeroIsMeaningful: true,
    entities: {
      power: { band: 'primary', orderInBand: 1, displayOrder: 2, headerTrack: '0.7fr' },
      technique: { band: 'primary', orderInBand: 1, displayOrder: 2, headerTrack: '0.7fr' },
    },
  },
  range: {
    id: 'range',
    headerLabel: 'RANGE',
    titleLabel: 'Range',
    preferredColumnKey: 'range',
    usmKey: 'Range',
    columnKeys: col('range'),
    chipPatterns: [/^range\s+/i],
    chipFormatter: 'rangeFactChip',
    entities: {
      power: { band: 'secondary', orderInBand: 3, displayOrder: 5, headerTrack: '0.7fr' },
      weapon: { band: 'primary', orderInBand: 2, displayOrder: 4, headerTrack: '0.7fr' },
    },
  },
  rarity: {
    id: 'rarity',
    headerLabel: 'RARITY',
    titleLabel: 'Rarity',
    preferredColumnKey: 'rarity',
    columnKeys: col('rarity'),
    chipPatterns: [/^rarity\b/i],
    entities: {
      weapon: { band: 'secondary', orderInBand: 1, displayOrder: 1, headerTrack: '0.7fr' },
      armor: { band: 'secondary', orderInBand: 3, displayOrder: 1, headerTrack: '0.55fr' },
      shield: { band: 'secondary', orderInBand: 1, displayOrder: 1, headerTrack: '0.7fr' },
      gear: { band: 'primary', orderInBand: 3, displayOrder: 3, headerTrack: '0.85fr' },
    },
  },
  recovery: {
    id: 'recovery',
    headerLabel: 'RECOVERY',
    titleLabel: 'Recovery',
    preferredColumnKey: 'rec_period',
    columnKeys: col('recovery', 'rec_period', 'rec period'),
    chipPatterns: [/^recovery\b/i],
    entities: {
      feat: { band: 'secondary', orderInBand: 2, displayOrder: 5, headerTrack: '1fr' },
    },
  },
  reqLevel: {
    id: 'reqLevel',
    headerLabel: 'REQ. LEVEL',
    titleLabel: 'Req. Level',
    preferredColumnKey: 'lvl_req',
    columnKeys: col('req level', 'lvl_req', 'lvl', 'level'),
    chipPatterns: [/^req(uired)?\.?\s*level/i],
    entities: {
      feat: { band: 'secondary', orderInBand: 3, displayOrder: 1, headerTrack: '0.8fr' },
    },
  },
  trainingPoints: {
    id: 'trainingPoints',
    headerLabel: 'TP',
    titleLabel: 'Training Pts',
    preferredColumnKey: 'tp',
    usmKey: 'Training Pts',
    columnKeys: col('tp', 'training points', 'training pts'),
    chipPatterns: [/training points\s+\d+/i, /^tp:\s*\d+/i],
    chipFormatter: 'trainingPointsFactChip',
    zeroIsMeaningful: true,
    entities: {
      power: { band: 'tertiary', orderInBand: 1, displayOrder: 8, headerTrack: '0.7fr' },
      technique: { band: 'secondary', orderInBand: 2, displayOrder: 3, headerTrack: '0.7fr' },
      weapon: { band: 'secondary', orderInBand: 3, displayOrder: 3, headerTrack: '0.7fr' },
      armor: { band: 'secondary', orderInBand: 5, displayOrder: 3, headerTrack: '0.45fr' },
      shield: { band: 'secondary', orderInBand: 3, displayOrder: 3, headerTrack: '0.7fr' },
    },
  },
  uses: {
    id: 'uses',
    headerLabel: 'USES',
    titleLabel: 'Uses',
    preferredColumnKey: 'uses_per_rec',
    columnKeys: col('uses', 'uses_per_rec'),
    chipPatterns: [/^uses\b/i],
    entities: {
      feat: { band: 'secondary', orderInBand: 1, displayOrder: 4, headerTrack: '0.8fr' },
    },
  },
  weapon: {
    id: 'weapon',
    headerLabel: 'ATTACK',
    titleLabel: 'Attack',
    preferredColumnKey: 'weapon',
    usmKey: 'Attack',
    columnKeys: col('weapon', 'attack'),
    chipPatterns: [/^attack\b/i, /^weapon\b/i],
    entities: {
      technique: { band: 'primary', orderInBand: 3, displayOrder: 5, headerTrack: '1fr' },
    },
  },
};

export const GLR_FACT_IDS = Object.keys(GLR_FACT_CATALOG) as GlrFactId[];

const GLR_IDENTITY_COLUMN_KEYS = col('name', 'type', 'quantity', 'qty', 'stat', 'description');

/** Identity / control columns that are not ranked facts. Sheet weapon/shield `attack` is a roll control. */
export function isGlrNonFactColumnKey(columnKey: string, entityType: GlrEntityType): boolean {
  const normalized = normalizeGlrColumnKey(columnKey);
  if (GLR_IDENTITY_COLUMN_KEYS.includes(normalized)) return true;
  if (normalized === 'attack' && entityType !== 'technique') return true;
  return normalized === 'range' && entityType === 'shield';
}

export function getGlrFactDef(id: GlrFactId): GlrFactDef {
  return GLR_FACT_CATALOG[id];
}

export function factsForEntity(entityType: GlrEntityType): GlrFactDef[] {
  return GLR_FACT_IDS.map((id) => GLR_FACT_CATALOG[id]).filter((fact) => fact.entities[entityType]);
}

export function entityFactMeta(
  id: GlrFactId,
  entityType: GlrEntityType,
): GlrEntityFactMeta | undefined {
  return GLR_FACT_CATALOG[id].entities[entityType];
}

export function preferredColumnKeyFor(id: GlrFactId, entityType: GlrEntityType): string {
  const def = GLR_FACT_CATALOG[id];
  return def.entities[entityType]?.columnKey ?? def.preferredColumnKey;
}

export function factAliases(id: GlrFactId): string[] {
  return GLR_FACT_CATALOG[id].columnKeys;
}

export function factIdMatchingColumnKey(
  columnKey: string,
  entityType: GlrEntityType,
): GlrFactId | undefined {
  const normalized = normalizeGlrColumnKey(columnKey);
  if (isGlrNonFactColumnKey(columnKey, entityType)) return undefined;
  for (const fact of factsForEntity(entityType)) {
    if (fact.columnKeys.includes(normalized)) return fact.id;
  }
  return undefined;
}
