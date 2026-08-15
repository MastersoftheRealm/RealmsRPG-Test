/**
 * GLR fact coverage validators (TASK-629 / ADR-0009).
 */

import type { GlrFactId, GlrFactRule, GlrSurfaceId } from './required-facts-registry';
import { getGlrSurfaceSpec, normalizeGlrColumnKey } from './required-facts-registry';

export interface GlrRowFactSnapshot {
  columnKeys: string[];
  chipLabels: string[];
  hasRightSlot?: boolean;
}

function columnKeysSatisfyRule(rule: GlrFactRule, columnKeys: string[]): boolean {
  if (!rule.columnKeys?.length) return false;
  const normalized = columnKeys.map(normalizeGlrColumnKey);
  return rule.columnKeys.some((candidate) => normalized.includes(candidate));
}

function chipLabelsSatisfyRule(rule: GlrFactRule, chipLabels: string[]): boolean {
  if (!rule.chipPatterns?.length) return false;
  return chipLabels.some((label) =>
    rule.chipPatterns!.some((pattern) => pattern.test(label.trim())),
  );
}

function factIsSatisfied(rule: GlrFactRule, snapshot: GlrRowFactSnapshot): boolean {
  const inColumn = columnKeysSatisfyRule(rule, snapshot.columnKeys);
  const inChip = chipLabelsSatisfyRule(rule, snapshot.chipLabels);

  switch (rule.placement) {
    case 'column':
      return inColumn;
    case 'chip':
      return inChip;
    case 'rightSlot':
      return snapshot.hasRightSlot === true;
    case 'column-or-chip':
      return inColumn || inChip;
    default:
      return false;
  }
}

/**
 * Validate that a surface's static column/header config declares every fact
 * that must appear as a collapsed column (placement `column` only).
 */
export function validateSurfaceColumnConfig(
  surfaceId: GlrSurfaceId,
  columnKeys: string[],
): string[] {
  const spec = getGlrSurfaceSpec(surfaceId);
  const errors: string[] = [];

  for (const rule of spec.requiredFacts) {
    if (rule.placement !== 'column') continue;
    if (!columnKeysSatisfyRule(rule, columnKeys)) {
      errors.push(
        `${surfaceId}: missing column for fact "${rule.id}" (expected one of: ${rule.columnKeys?.join(', ')})`,
      );
    }
  }

  return errors;
}

/**
 * Validate that a row snapshot covers every required fact for a surface
 * (column, chip, rightSlot, or column-or-chip per rule).
 */
export function validateRowFactCoverage(
  surfaceId: GlrSurfaceId,
  snapshot: GlrRowFactSnapshot,
): string[] {
  const spec = getGlrSurfaceSpec(surfaceId);
  const errors: string[] = [];

  for (const rule of spec.requiredFacts) {
    if (!factIsSatisfied(rule, snapshot)) {
      errors.push(
        `${surfaceId}: fact "${rule.id}" missing (placement=${rule.placement}; columns=[${snapshot.columnKeys.join(', ')}]; chips=[${snapshot.chipLabels.join(', ')}])`,
      );
    }
  }

  return errors;
}

export function chipLabelsFromDetailSections(
  sections?: ReadonlyArray<{ chips: ReadonlyArray<{ name: string }> }>,
): string[] {
  return (sections ?? []).flatMap((s) => s.chips.map((c) => c.name));
}

/** Fail fast helper for vitest. */
export function assertSurfaceColumnConfig(surfaceId: GlrSurfaceId, columnKeys: string[]): void {
  const errors = validateSurfaceColumnConfig(surfaceId, columnKeys);
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}

/** Fail fast helper for vitest. */
export function assertRowFactCoverage(surfaceId: GlrSurfaceId, snapshot: GlrRowFactSnapshot): void {
  const errors = validateRowFactCoverage(surfaceId, snapshot);
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}

export type { GlrFactId };
