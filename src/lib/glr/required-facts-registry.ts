/**
 * GLR required-facts registry (TASK-629 / ADR-0009).
 *
 * SoT for which quick-ref facts each GridListRow surface must expose in collapsed
 * columns and/or expanded descriptor chips. Formatting lives in compact-facts;
 * this module only names facts and placement rules.
 *
 * @see src/docs/ai/ADR/0009-glr-required-facts-registry.md
 * @see src/lib/detail-option/compact-facts.ts
 */

/** Stable identifiers for game-meaningful GLR facts. */
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

/** GLR presentation surfaces — one row per list chrome variant. */
export type GlrSurfaceId =
  | 'library-official-power'
  | 'library-official-technique'
  | 'library-official-weapon'
  | 'library-official-armor'
  | 'library-official-shield'
  | 'character-sheet-power-play'
  | 'character-sheet-technique-play'
  | 'character-sheet-armor'
  | 'add-modal-power'
  | 'add-modal-technique'
  | 'codex-feat'
  | 'codex-equipment'
  /** Guided creator L2/L3 powers catalog — Official Library columns + TP cost (TASK-709). */
  | 'guided-powers-l3'
  /** Guided creator L2/L3 techniques catalog — Official Library columns (TASK-709). */
  | 'guided-techniques-l3'
  /** Guided creator L2/L3 feat catalogs — Codex feat columns (TASK-709). */
  | 'guided-feats-l3'
  /** Guided creator L2/L3 equipment weapon phase (TASK-688). */
  | 'guided-equipment-weapon-l3'
  /** Guided creator L2/L3 equipment armor phase (TASK-688). */
  | 'guided-equipment-armor-l3'
  /** Guided creator L2/L3 equipment shield-in-weapon phase (TASK-688). */
  | 'guided-equipment-shield-l3'
  /** Guided creator L2/L3 equipment gear phase (TASK-688). */
  | 'guided-equipment-gear-l3';

export type GlrFactPlacement = 'column' | 'chip' | 'column-or-chip' | 'rightSlot';

export interface GlrFactRule {
  id: GlrFactId;
  /**
   * Preferred placement. `column-or-chip` = must appear in at least one (TASK-437).
   * `rightSlot` = spend control satisfies energy (character sheet play).
   */
  placement: GlrFactPlacement;
  /** Header / ColumnValue keys (normalized match). */
  columnKeys?: string[];
  /** Descriptor chip name patterns when column is omitted. */
  chipPatterns?: RegExp[];
}

export interface GlrSurfaceSpec {
  surfaceId: GlrSurfaceId;
  entityType: string;
  requiredFacts: GlrFactRule[];
}

/** Normalize column/header keys for flexible matching. */
export function normalizeGlrColumnKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');
}

function col(...keys: string[]): string[] {
  return keys.map(normalizeGlrColumnKey);
}

const FACT = {
  actionType: {
    id: 'actionType' as const,
    placement: 'column' as const,
    columnKeys: col('action', 'action type'),
  },
  area: {
    id: 'area' as const,
    placement: 'column' as const,
    columnKeys: col('area'),
  },
  abilityRequirement: {
    id: 'abilityRequirement' as const,
    placement: 'column' as const,
    columnKeys: col('abilityRequirement', 'abl req', 'ability req'),
    chipPatterns: [/requirement\s+\d+\+/i],
  },
  agilityReduction: {
    id: 'agilityReduction' as const,
    placement: 'column' as const,
    columnKeys: col('agilityReduction', 'agility red', 'agility reduction'),
    chipPatterns: [/agility reduction/i],
  },
  block: {
    id: 'block' as const,
    placement: 'column' as const,
    columnKeys: col('block'),
  },
  category: {
    id: 'category' as const,
    placement: 'column' as const,
    columnKeys: col('category'),
  },
  criticalRangeIncrease: {
    id: 'criticalRangeIncrease' as const,
    placement: 'column' as const,
    columnKeys: col('criticalRangeIncrease', 'crit +', 'crit range', 'crit'),
    chipPatterns: [/critical range/i],
  },
  currency: {
    id: 'currency' as const,
    placement: 'column' as const,
    columnKeys: col('currency'),
  },
  damage: {
    id: 'damage' as const,
    placement: 'column-or-chip' as const,
    columnKeys: col('damage'),
    chipPatterns: [/\d+d\d+.*damage/i, /damage$/i],
  },
  damageReduction: {
    id: 'damageReduction' as const,
    placement: 'column' as const,
    columnKeys: col('damageReduction', 'damage red', 'dmg red', 'damage reduction', 'dr'),
    chipPatterns: [/damage reduction/i],
  },
  duration: {
    id: 'duration' as const,
    placement: 'column' as const,
    columnKeys: col('duration'),
  },
  energy: {
    id: 'energy' as const,
    placement: 'column-or-chip' as const,
    columnKeys: col('energy'),
    chipPatterns: [/^energy\s+\d+/i],
  },
  range: {
    id: 'range' as const,
    placement: 'column-or-chip' as const,
    columnKeys: col('range'),
    chipPatterns: [/^range\s+/i],
  },
  rarity: {
    id: 'rarity' as const,
    placement: 'column' as const,
    columnKeys: col('rarity'),
  },
  recovery: {
    id: 'recovery' as const,
    placement: 'column' as const,
    columnKeys: col('recovery', 'rec_period', 'rec period'),
  },
  reqLevel: {
    id: 'reqLevel' as const,
    placement: 'column' as const,
    columnKeys: col('req level', 'lvl_req', 'lvl', 'level'),
  },
  trainingPoints: {
    id: 'trainingPoints' as const,
    placement: 'column-or-chip' as const,
    columnKeys: col('tp', 'training points', 'training pts'),
    chipPatterns: [/training points\s+\d+/i, /^tp:\s*\d+/i],
  },
  uses: {
    id: 'uses' as const,
    placement: 'column' as const,
    columnKeys: col('uses', 'uses_per_rec'),
  },
  weapon: {
    id: 'weapon' as const,
    placement: 'column' as const,
    columnKeys: col('weapon', 'attack'),
  },
} satisfies Record<string, GlrFactRule>;

/**
 * Required facts per GLR surface. Column builders and CI tests must stay in sync.
 */
export const GLR_SURFACE_REGISTRY: Record<GlrSurfaceId, GlrSurfaceSpec> = {
  'library-official-power': {
    surfaceId: 'library-official-power',
    entityType: 'power',
    requiredFacts: [
      FACT.category,
      FACT.energy,
      FACT.actionType,
      FACT.duration,
      FACT.range,
      FACT.area,
      FACT.damage,
    ],
  },
  'library-official-technique': {
    surfaceId: 'library-official-technique',
    entityType: 'technique',
    requiredFacts: [
      FACT.category,
      FACT.energy,
      FACT.trainingPoints,
      FACT.actionType,
      FACT.weapon,
      FACT.damage,
    ],
  },
  'library-official-weapon': {
    surfaceId: 'library-official-weapon',
    entityType: 'weapon',
    requiredFacts: [
      FACT.rarity,
      FACT.currency,
      FACT.trainingPoints,
      FACT.range,
      FACT.damage,
    ],
  },
  'library-official-armor': {
    surfaceId: 'library-official-armor',
    entityType: 'armor',
    requiredFacts: [
      FACT.rarity,
      FACT.currency,
      FACT.trainingPoints,
      FACT.damageReduction,
      FACT.agilityReduction,
      FACT.abilityRequirement,
      FACT.criticalRangeIncrease,
    ],
  },
  'library-official-shield': {
    surfaceId: 'library-official-shield',
    entityType: 'shield',
    requiredFacts: [
      FACT.rarity,
      FACT.currency,
      FACT.trainingPoints,
      FACT.block,
      FACT.damage,
    ],
  },
  'character-sheet-power-play': {
    surfaceId: 'character-sheet-power-play',
    entityType: 'power',
    requiredFacts: [
      { ...FACT.energy, placement: 'rightSlot' },
      FACT.actionType,
      FACT.damage,
      FACT.area,
      FACT.duration,
    ],
  },
  'character-sheet-technique-play': {
    surfaceId: 'character-sheet-technique-play',
    entityType: 'technique',
    requiredFacts: [
      { ...FACT.energy, placement: 'rightSlot' },
      FACT.actionType,
      FACT.weapon,
    ],
  },
  'character-sheet-armor': {
    surfaceId: 'character-sheet-armor',
    entityType: 'armor',
    requiredFacts: [
      FACT.damageReduction,
      FACT.criticalRangeIncrease,
      { ...FACT.abilityRequirement, placement: 'chip' },
      { ...FACT.agilityReduction, placement: 'chip' },
    ],
  },
  'add-modal-power': {
    surfaceId: 'add-modal-power',
    entityType: 'power',
    requiredFacts: [
      FACT.energy,
      FACT.actionType,
      FACT.duration,
      FACT.area,
      FACT.damage,
      { ...FACT.range, placement: 'chip' },
    ],
  },
  'add-modal-technique': {
    surfaceId: 'add-modal-technique',
    entityType: 'technique',
    requiredFacts: [
      FACT.energy,
      FACT.actionType,
      FACT.weapon,
      FACT.trainingPoints,
    ],
  },
  'codex-feat': {
    surfaceId: 'codex-feat',
    entityType: 'feat',
    requiredFacts: [
      FACT.reqLevel,
      FACT.category,
      { id: 'abilityRequirement', placement: 'column', columnKeys: col('ability') },
      FACT.uses,
      FACT.recovery,
    ],
  },
  'codex-equipment': {
    surfaceId: 'codex-equipment',
    entityType: 'equipment',
    requiredFacts: [FACT.damage, FACT.damageReduction],
  },
  /**
   * Guided powers L2/L3 — Official Library browse columns (TASK-709).
   * Training Points stay on GridListRow totalCost (creator budget), not a dense column
   * (Official powers have no TP column).
   */
  'guided-powers-l3': {
    surfaceId: 'guided-powers-l3',
    entityType: 'power',
    requiredFacts: [
      FACT.category,
      FACT.energy,
      FACT.actionType,
      FACT.duration,
      FACT.range,
      FACT.area,
      FACT.damage,
      { ...FACT.trainingPoints, placement: 'rightSlot' },
    ],
  },
  'guided-techniques-l3': {
    surfaceId: 'guided-techniques-l3',
    entityType: 'technique',
    requiredFacts: [
      FACT.category,
      FACT.energy,
      FACT.trainingPoints,
      FACT.actionType,
      FACT.weapon,
      FACT.damage,
    ],
  },
  'guided-feats-l3': {
    surfaceId: 'guided-feats-l3',
    entityType: 'feat',
    requiredFacts: [
      FACT.reqLevel,
      FACT.category,
      { id: 'abilityRequirement', placement: 'column', columnKeys: col('ability') },
      FACT.uses,
      FACT.recovery,
    ],
  },
  'guided-equipment-weapon-l3': {
    surfaceId: 'guided-equipment-weapon-l3',
    entityType: 'weapon',
    requiredFacts: [
      FACT.rarity,
      FACT.currency,
      FACT.trainingPoints,
      FACT.range,
      FACT.damage,
    ],
  },
  'guided-equipment-armor-l3': {
    surfaceId: 'guided-equipment-armor-l3',
    entityType: 'armor',
    requiredFacts: [
      FACT.rarity,
      FACT.currency,
      FACT.trainingPoints,
      FACT.damageReduction,
      FACT.agilityReduction,
      FACT.abilityRequirement,
      FACT.criticalRangeIncrease,
    ],
  },
  /**
   * Shields appear in the guided weapon phase (mixed list) using weapon headers;
   * Block is shown in the Damage cell (not a separate Block column).
   */
  'guided-equipment-shield-l3': {
    surfaceId: 'guided-equipment-shield-l3',
    entityType: 'shield',
    requiredFacts: [
      FACT.rarity,
      FACT.currency,
      FACT.trainingPoints,
      FACT.range,
      {
        ...FACT.block,
        placement: 'column-or-chip',
        columnKeys: col('damage', 'block'),
      },
    ],
  },
  'guided-equipment-gear-l3': {
    surfaceId: 'guided-equipment-gear-l3',
    entityType: 'equipment',
    requiredFacts: [FACT.rarity, FACT.currency],
  },
};

export function getGlrSurfaceSpec(surfaceId: GlrSurfaceId): GlrSurfaceSpec {
  return GLR_SURFACE_REGISTRY[surfaceId];
}

/** Map official armament kinds to registry surface ids (Library Realms tab). */
export const ARMAMENT_GLR_SURFACE = {
  weapon: 'library-official-weapon',
  armor: 'library-official-armor',
  shield: 'library-official-shield',
} as const satisfies Record<string, GlrSurfaceId>;
