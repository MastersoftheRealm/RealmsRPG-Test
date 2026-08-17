/**
 * GLR fact coverage validators (TASK-806 / ADR-0016).
 */

import {
  factIdMatchingColumnKey,
  getGlrFactDef,
  isGlrNonFactColumnKey,
  normalizeGlrColumnKey,
  type GlrFactId,
} from './glr-fact-catalog';
import {
  getGlrSurfaceBinding,
  resolveSurfaceLayout,
  type GlrSurfaceId,
} from './glr-surface-bindings';
import { glrColumnKeyFor } from './resolve-glr-fact-layout';

type GlrFactPlacement = 'column' | 'chip' | 'column-or-chip' | 'rightSlot';

interface GlrFactRule {
  id: GlrFactId;
  placement: GlrFactPlacement;
  columnKeys?: string[];
  chipPatterns?: RegExp[];
}

export interface GlrRowFactSnapshot {
  columnKeys: string[];
  chipLabels: string[];
  hasRightSlot?: boolean;
}

function columnKeysSatisfyFact(
  factId: GlrFactId,
  columnKeys: string[],
  extraAliases?: string[],
): boolean {
  const normalized = columnKeys.map(normalizeGlrColumnKey);
  const aliases = extraAliases ?? getGlrFactDef(factId).columnKeys;
  return aliases.some((candidate) => normalized.includes(normalizeGlrColumnKey(candidate)));
}

function chipLabelsSatisfyFact(factId: GlrFactId, chipLabels: string[]): boolean {
  const patterns = getGlrFactDef(factId).chipPatterns;
  if (!patterns.length) return false;
  return chipLabels.some((label) => patterns.some((pattern) => pattern.test(label.trim())));
}

function ruleFromLayout(surfaceId: GlrSurfaceId, factId: GlrFactId): GlrFactRule {
  const layout = resolveSurfaceLayout(surfaceId);
  const def = getGlrFactDef(factId);
  const aliased = layout.aliasColumnKeys[factId];
  let placement: GlrFactRule['placement'] = 'column-or-chip';
  if (layout.rightSlotFacts.includes(factId)) placement = 'rightSlot';
  else if (layout.columnFacts.includes(factId)) placement = 'column';
  else if (layout.chipFacts.includes(factId)) placement = 'chip';
  else if (aliased?.length) placement = 'column-or-chip';
  return {
    id: factId,
    placement,
    columnKeys: aliased ?? def.columnKeys,
    chipPatterns: def.chipPatterns,
  };
}

function factCoverageErrors(
  surfaceId: GlrSurfaceId,
  rule: GlrFactRule,
  snapshot: GlrRowFactSnapshot,
): string[] {
  const inColumn = columnKeysSatisfyFact(rule.id, snapshot.columnKeys, rule.columnKeys);
  const inChip = chipLabelsSatisfyFact(rule.id, snapshot.chipLabels);
  const inRightSlot = snapshot.hasRightSlot === true;
  const loc = `columns=[${snapshot.columnKeys.join(', ')}]; chips=[${snapshot.chipLabels.join(', ')}]`;
  const dual = (channels: string) =>
    `${surfaceId}: fact "${rule.id}" appears as both ${channels} (${loc})`;
  const missing = () =>
    `${surfaceId}: fact "${rule.id}" missing (placement=${rule.placement}; ${loc})`;

  switch (rule.placement) {
    case 'column':
      if (!inColumn) return [missing()];
      if (inChip) return [dual('column and chip')];
      return [];
    case 'chip':
      if (!inChip) return [missing()];
      if (inColumn) return [dual('column and chip')];
      return [];
    case 'rightSlot':
      if (!inRightSlot) return [missing()];
      if (inColumn && inChip) return [dual('rightSlot, column, and chip')];
      if (inColumn) return [dual('rightSlot and column')];
      if (inChip) return [dual('rightSlot and chip')];
      return [];
    case 'column-or-chip':
      if (!inColumn && !inChip) return [missing()];
      if (inColumn && inChip) return [dual('column and chip')];
      return [];
    default:
      return [missing()];
  }
}

function columnKeyAllowed(surfaceId: GlrSurfaceId, key: string): boolean {
  const binding = getGlrSurfaceBinding(surfaceId);
  if (isGlrNonFactColumnKey(key, binding.entityType)) return true;
  if (factIdMatchingColumnKey(key, binding.entityType)) return true;
  const layout = resolveSurfaceLayout(surfaceId);
  if (layout.columnFacts.some((id) => columnKeysSatisfyFact(id, [key]))) return true;
  return Object.values(layout.aliasColumnKeys).some((aliases) =>
    aliases?.some((alias) => normalizeGlrColumnKey(alias) === normalizeGlrColumnKey(key)),
  );
}

/**
 * Static column/header config: primary facts must be columns (unless rightSlot / aliased),
 * headers must be catalog facts or known non-fact chrome, and resolver column facts
 * must be present.
 */
export function validateSurfaceColumnConfig(
  surfaceId: GlrSurfaceId,
  columnKeys: string[],
): string[] {
  const binding = getGlrSurfaceBinding(surfaceId);
  const layout = resolveSurfaceLayout(surfaceId);
  const errors: string[] = [];

  for (const key of columnKeys) {
    if (!columnKeyAllowed(surfaceId, key)) {
      errors.push(
        `${surfaceId}: unknown column "${key}" is not a catalog fact for ${binding.entityType}`,
      );
    }
  }

  for (const factId of layout.columnFacts) {
    const key = glrColumnKeyFor(factId, layout.entityType, layout.mode);
    const aliases = [key, ...getGlrFactDef(factId).columnKeys];
    if (!columnKeysSatisfyFact(factId, columnKeys, aliases)) {
      errors.push(
        `${surfaceId}: missing column for fact "${factId}" (expected one of: ${aliases.join(', ')})`,
      );
    }
  }

  return errors;
}

/**
 * Row snapshot covers every layout fact (column, chip, rightSlot, or aliased column)
 * and fails when a fact appears in more than one channel (ADR-0016 never-both).
 */
export function validateRowFactCoverage(
  surfaceId: GlrSurfaceId,
  snapshot: GlrRowFactSnapshot,
): string[] {
  const layout = resolveSurfaceLayout(surfaceId);
  const errors: string[] = [];
  const factIds = new Set<GlrFactId>([
    ...layout.columnFacts,
    ...layout.chipFacts,
    ...layout.rightSlotFacts,
    ...(Object.keys(layout.aliasColumnKeys) as GlrFactId[]),
  ]);

  for (const factId of factIds) {
    errors.push(...factCoverageErrors(surfaceId, ruleFromLayout(surfaceId, factId), snapshot));
  }

  return errors;
}

export function chipLabelsFromDetailSections(
  sections?: ReadonlyArray<{ chips: ReadonlyArray<{ name: string }> }>,
): string[] {
  return (sections ?? []).flatMap((s) => s.chips.map((c) => c.name));
}

export function assertSurfaceColumnConfig(surfaceId: GlrSurfaceId, columnKeys: string[]): void {
  const errors = validateSurfaceColumnConfig(surfaceId, columnKeys);
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}

export function assertRowFactCoverage(surfaceId: GlrSurfaceId, snapshot: GlrRowFactSnapshot): void {
  const errors = validateRowFactCoverage(surfaceId, snapshot);
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}
