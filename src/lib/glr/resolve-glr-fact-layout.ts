/**
 * Resolve GLR column vs chip layout once per list (TASK-807 / ADR-0016).
 */

import {
  GLR_BAND_RANK,
  entityFactMeta,
  factsForEntity,
  getGlrFactDef,
  preferredColumnKeyFor,
  type GlrEntityType,
  type GlrFactId,
} from './glr-fact-catalog';
import {
  GLR_DENSITY,
  isFactOmitted,
  type GlrDensityMode,
  type GlrLayoutFlags,
} from './glr-density';

export type GlrFactChannel = 'column' | 'chip' | 'rightSlot';

/** Per-surface override of play/select density (e.g. sheet Equipment catalog columns — TASK-873). */
export interface GlrLayoutOverrides {
  columnBudget?: number | undefined;
  demoteFacts?: readonly GlrFactId[] | undefined;
}

export interface GlrResolveInput {
  entityType: GlrEntityType;
  mode: GlrDensityMode;
  flags?: GlrLayoutFlags | undefined;
  layoutOverrides?: GlrLayoutOverrides | undefined;
}

export interface GlrResolvedLayout {
  entityType: GlrEntityType;
  mode: GlrDensityMode;
  flags: GlrLayoutFlags;
  columnFacts: GlrFactId[];
  chipFacts: GlrFactId[];
  rightSlotFacts: GlrFactId[];
  /** Extra column keys that satisfy a fact (guided shield Block in Damage). */
  aliasColumnKeys: Partial<Record<GlrFactId, string[]>>;
}

function orderInBandFor(
  factId: GlrFactId,
  entityType: GlrEntityType,
  mode: GlrDensityMode,
): number {
  const override = GLR_DENSITY[mode].orderInBandOverrides?.[entityType]?.[factId];
  if (override != null) return override;
  return entityFactMeta(factId, entityType)?.orderInBand ?? 99;
}

function displayOrderFor(
  factId: GlrFactId,
  entityType: GlrEntityType,
  mode: GlrDensityMode,
): number {
  const override = GLR_DENSITY[mode].displayOrderOverrides?.[entityType]?.[factId];
  if (override != null) return override;
  return entityFactMeta(factId, entityType)?.displayOrder ?? 99;
}

export function glrColumnKeyFor(
  factId: GlrFactId,
  entityType: GlrEntityType,
  mode: GlrDensityMode,
  keyStyle: 'canonical' | 'usm' = 'canonical',
): string {
  const override = GLR_DENSITY[mode].columnKeyOverrides?.[entityType]?.[factId];
  if (override) return override;
  if (keyStyle === 'usm') {
    return getGlrFactDef(factId).usmKey ?? preferredColumnKeyFor(factId, entityType);
  }
  return preferredColumnKeyFor(factId, entityType);
}

export function glrHeaderTrackFor(
  factId: GlrFactId,
  entityType: GlrEntityType,
  mode: GlrDensityMode,
): string {
  const override = GLR_DENSITY[mode].headerTrackOverrides?.[entityType]?.[factId];
  if (override) return override;
  return entityFactMeta(factId, entityType)?.headerTrack ?? '0.7fr';
}

export function glrNameTrackFor(entityType: GlrEntityType, mode: GlrDensityMode): string {
  return GLR_DENSITY[mode].nameTrack?.[entityType] ?? '1.5fr';
}

function rightSlotFact(
  factId: GlrFactId,
  entityType: GlrEntityType,
  mode: GlrDensityMode,
  flags: GlrLayoutFlags,
): boolean {
  if (
    factId === 'energy' &&
    mode === 'play' &&
    (entityType === 'power' || entityType === 'technique')
  ) {
    return true;
  }
  if (factId === 'trainingPoints' && flags.creatorBudget && entityType === 'power') {
    return true;
  }
  return false;
}

function compareInclusion(
  a: GlrFactId,
  b: GlrFactId,
  entityType: GlrEntityType,
  mode: GlrDensityMode,
): number {
  const metaA = entityFactMeta(a, entityType);
  const metaB = entityFactMeta(b, entityType);
  const band = GLR_BAND_RANK[metaA?.band ?? 'tertiary'] - GLR_BAND_RANK[metaB?.band ?? 'tertiary'];
  if (band !== 0) return band;
  return orderInBandFor(a, entityType, mode) - orderInBandFor(b, entityType, mode);
}

function isFactDemotedForInput(
  entityType: GlrEntityType,
  mode: GlrDensityMode,
  factId: GlrFactId,
  layoutOverrides?: GlrLayoutOverrides,
): boolean {
  const demoted = layoutOverrides?.demoteFacts ?? GLR_DENSITY[mode].demoteFacts?.[entityType];
  return demoted?.includes(factId) ?? false;
}

function resolveEntityLayout(input: GlrResolveInput): GlrResolvedLayout {
  const flags = input.flags ?? {};
  const { entityType, mode, layoutOverrides } = input;
  const budget = layoutOverrides?.columnBudget ?? GLR_DENSITY[mode].columnBudget[entityType] ?? 0;

  const applicable = factsForEntity(entityType)
    .map((f) => f.id)
    .filter((id) => !isFactOmitted(entityType, mode, flags, id));

  const rightSlotFacts = applicable.filter((id) => rightSlotFact(id, entityType, mode, flags));
  const pool = applicable.filter((id) => !rightSlotFacts.includes(id));
  const demoted = pool.filter((id) => isFactDemotedForInput(entityType, mode, id, layoutOverrides));
  const columnPool = pool.filter((id) => !demoted.includes(id));
  columnPool.sort((a, b) => compareInclusion(a, b, entityType, mode));

  const columnFacts = columnPool.slice(0, Math.max(0, budget));
  const overflow = columnPool.slice(Math.max(0, budget));
  const chipFacts = [...overflow, ...demoted].sort(
    (a, b) => displayOrderFor(a, entityType, mode) - displayOrderFor(b, entityType, mode),
  );
  columnFacts.sort(
    (a, b) => displayOrderFor(a, entityType, mode) - displayOrderFor(b, entityType, mode),
  );

  return {
    entityType,
    mode,
    flags,
    columnFacts,
    chipFacts,
    rightSlotFacts,
    aliasColumnKeys: {},
  };
}

/**
 * Resolve column vs chip vs rightSlot for one list.
 * Mixed shield-in-weapon phase reuses the weapon column set and aliases Block to Damage.
 */
export function resolveGlrFactLayout(input: GlrResolveInput): GlrResolvedLayout {
  const flags = input.flags ?? {};
  if (flags.mixedArmamentPhase && input.entityType === 'shield') {
    const weaponLayout = resolveEntityLayout({
      entityType: 'weapon',
      mode: input.mode,
      flags: { ...flags, mixedArmamentPhase: false },
    });
    return {
      ...weaponLayout,
      entityType: 'shield',
      flags,
      aliasColumnKeys: { block: ['damage', 'block'] },
    };
  }
  return resolveEntityLayout({ ...input, flags });
}
