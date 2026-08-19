/**
 * GLR density modes + context flags (TASK-806 / ADR-0016).
 *
 * Modes set column budget and a few order/key overrides. Flags are named and
 * reusable — not per-surface placement tables.
 */

import type { GlrEntityType, GlrFactId } from './glr-fact-catalog';

export type GlrDensityMode = 'browse' | 'play' | 'select' | 'detail';

export interface GlrLayoutFlags {
  /** Creator eligibility already hid unmet feats (TASK-758). */
  characterCreate?: boolean | undefined;
  /** Power Training Points live on GridListRow totalCost / rightSlot. */
  creatorBudget?: boolean | undefined;
  /** Guided weapon+shield phase: shield Block may occupy the Damage cell. */
  mixedArmamentPhase?: boolean | undefined;
}

export interface GlrModeSpec {
  /** Max data columns (name excluded). 0 = all chips (detail). */
  columnBudget: Record<GlrEntityType, number>;
  /**
   * Skip these when filling columns so combat facts keep the dense tracks;
   * they still become expanded chips (ADR-0016 never-neither). True omit is
   * only `characterCreate` + feat `reqLevel`.
   */
  demoteFacts?: Partial<Record<GlrEntityType, readonly GlrFactId[]>> | undefined;
  orderInBandOverrides?:
    | Partial<Record<GlrEntityType, Partial<Record<GlrFactId, number>>>>
    | undefined;
  displayOrderOverrides?:
    | Partial<Record<GlrEntityType, Partial<Record<GlrFactId, number>>>>
    | undefined;
  columnKeyOverrides?:
    | Partial<Record<GlrEntityType, Partial<Record<GlrFactId, string>>>>
    | undefined;
  headerTrackOverrides?:
    | Partial<Record<GlrEntityType, Partial<Record<GlrFactId, string>>>>
    | undefined;
  nameTrack?: Partial<Record<GlrEntityType, string>> | undefined;
}

export const GLR_DENSITY: Record<GlrDensityMode, GlrModeSpec> = {
  browse: {
    columnBudget: {
      power: 7,
      technique: 6,
      weapon: 5,
      armor: 7,
      shield: 5,
      feat: 5,
      gear: 3,
    },
    nameTrack: {
      power: '1.4fr',
      technique: '1.4fr',
      weapon: '1.5fr',
      armor: '1.4fr',
      shield: '1.5fr',
      feat: '1.5fr',
      gear: '1.5fr',
    },
  },
  play: {
    columnBudget: {
      power: 4,
      technique: 2,
      weapon: 2,
      armor: 2,
      shield: 4,
      feat: 2,
      gear: 0,
    },
    demoteFacts: {
      power: ['category', 'trainingPoints', 'range'],
      technique: ['category', 'damage', 'trainingPoints'],
      weapon: ['rarity', 'currency', 'trainingPoints'],
      armor: ['rarity', 'currency', 'trainingPoints'],
      shield: ['rarity', 'currency', 'trainingPoints'],
      feat: ['reqLevel', 'category', 'abilityRequirement'],
      gear: ['category', 'currency', 'rarity'],
    },
    orderInBandOverrides: {
      power: { duration: 1, area: 2, range: 3 },
    },
    displayOrderOverrides: {
      power: { actionType: 1, damage: 2, area: 3, duration: 4 },
      technique: { actionType: 1, weapon: 2 },
      armor: { damageReduction: 1, criticalRangeIncrease: 2 },
      weapon: { damage: 1, range: 2 },
      shield: { damage: 1, block: 2 },
      feat: { uses: 1, recovery: 2 },
    },
    columnKeyOverrides: {
      armor: { damageReduction: 'dr', criticalRangeIncrease: 'crit' },
      feat: { uses: 'uses', recovery: 'recovery' },
    },
    headerTrackOverrides: {
      power: { actionType: '1fr', damage: '1fr', area: '0.7fr', duration: '0.7fr' },
      technique: { actionType: '1fr', weapon: '1fr' },
      armor: { damageReduction: '0.6fr', criticalRangeIncrease: '0.6fr' },
      weapon: { damage: '0.8fr', range: '0.6fr' },
    },
    nameTrack: {
      power: '1.4fr',
      technique: '1.4fr',
      armor: '1fr',
      weapon: '1fr',
      feat: 'minmax(140px, 1.6fr)',
    },
  },
  select: {
    columnBudget: {
      power: 5,
      technique: 4,
      weapon: 1,
      armor: 1,
      shield: 2,
      feat: 4,
      gear: 3,
    },
    demoteFacts: {
      power: ['category', 'trainingPoints'],
      technique: ['category', 'damage'],
      weapon: ['rarity', 'currency', 'trainingPoints'],
      armor: ['rarity', 'currency', 'trainingPoints'],
      shield: ['rarity', 'currency', 'trainingPoints'],
    },
    orderInBandOverrides: {
      power: { duration: 1, area: 2, range: 3 },
    },
    displayOrderOverrides: {
      technique: { actionType: 1, energy: 2, weapon: 3, trainingPoints: 4 },
    },
    headerTrackOverrides: {
      power: {
        energy: '0.55fr',
        actionType: '0.75fr',
        duration: '0.75fr',
        area: '0.65fr',
        damage: '1fr',
      },
      technique: {
        actionType: '1fr',
        energy: '0.7fr',
        weapon: '1fr',
        trainingPoints: '0.8fr',
      },
    },
    nameTrack: {
      power: '1.2fr',
      technique: '1.4fr',
      weapon: '1.5fr',
      armor: '1.5fr',
      shield: '1.5fr',
      feat: '1.5fr',
      gear: '1.5fr',
    },
  },
  detail: {
    columnBudget: {
      power: 0,
      technique: 0,
      weapon: 0,
      armor: 0,
      shield: 0,
      feat: 0,
      gear: 0,
    },
  },
};

export function isFactOmitted(
  _entityType: GlrEntityType,
  _mode: GlrDensityMode,
  flags: GlrLayoutFlags,
  factId: GlrFactId,
): boolean {
  return Boolean(flags.characterCreate && factId === 'reqLevel');
}

export function isFactDemoted(
  entityType: GlrEntityType,
  mode: GlrDensityMode,
  factId: GlrFactId,
): boolean {
  const demoted = GLR_DENSITY[mode].demoteFacts?.[entityType];
  return demoted?.includes(factId) ?? false;
}
