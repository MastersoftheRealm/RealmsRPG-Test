/**
 * Admin path publish validation — Layer 1 governance (REALMS_PRODUCT_OVERVIEW.md Appendix I.3).
 * Validates path_data before a path is player-visible.
 */

import type { ArchetypeCategory, ArchetypePathData, PathGuidanceGroup } from '@/types/archetype';
import { flattenLoadoutEntries } from '@/lib/guided-creator/resolve-loadout-items';
import { LAYER1_GOVERNANCE } from '@/lib/constants/creator-layer-governance';
import {
  validateRecommendedInnatePowers,
  type InnatePowerSnapshot,
} from '@/lib/game/innate-eligibility';

export interface PathValidationContext {
  /** Resolve armament TP from codex/official library (admin save). Returns null if item not found. */
  resolveItemTrainingPoints?: (itemId: string) => number | null;
  /** Level-1 TP cap (typically from path recommended abilities). */
  trainingPointLimit?: number;
  /** Archetype category for Innate Energy / Threshold (TASK-473). */
  archetypeType?: ArchetypeCategory;
  powerProfStart?: number | null;
  martialProfStart?: number | null;
  /** Resolve official power snapshot for innate eligibility. */
  resolveInnatePower?: (powerId: string) => InnatePowerSnapshot | null;
}

export interface PathValidationIssue {
  severity: 'error' | 'warning';
  message: string;
}

export function validatePathDataForPublish(
  pathData: ArchetypePathData | undefined,
  context?: PathValidationContext
): PathValidationIssue[] {
  const issues: PathValidationIssue[] = [];
  if (!pathData?.level1) {
    issues.push({ severity: 'error', message: 'Level 1 recommendations are required for player-visible paths.' });
    return issues;
  }

  const level1 = pathData.level1;
  const groups = level1.guidance_groups ?? [];

  if (groups.length > LAYER1_GOVERNANCE.maxGroupsPerStep) {
    issues.push({
      severity: 'warning',
      message: `Level 1 has ${groups.length} guidance groups (recommended max ${LAYER1_GOVERNANCE.maxGroupsPerStep}).`,
    });
  }

  for (const group of groups) {
    issues.push(...validateGuidanceGroup(group));
  }

  const listCounts: Array<[string, number]> = [
    ['feats', level1.feats?.length ?? 0],
    ['skills', level1.skills?.length ?? 0],
    ['powers', level1.powers?.length ?? 0],
    ['innate powers', level1.innatePowers?.length ?? 0],
    ['techniques', level1.techniques?.length ?? 0],
    ['armaments', level1.armaments?.length ?? 0],
    ['equipment', level1.equipment?.length ?? 0],
    ['recommended species', level1.recommended_species?.length ?? 0],
  ];
  for (const [label, count] of listCounts) {
    if (count > LAYER1_GOVERNANCE.maxItemsPerGroup) {
      issues.push({
        severity: 'warning',
        message: `Level 1 ${label} list has ${count} items (recommended max ${LAYER1_GOVERNANCE.maxItemsPerGroup} for Layer 1).`,
      });
    }
  }

  if (level1.notes && level1.notes.length > LAYER1_GOVERNANCE.maxWhyCopyLength * 4) {
    issues.push({
      severity: 'warning',
      message: 'Level 1 notes are very long. Keep path guidance concise for Layer 1.',
    });
  }

  issues.push(...validateLoadoutTrainingPoints(level1, context));
  issues.push(...validateInnatePowerRecommendations(level1, context));

  return issues;
}

function validateInnatePowerRecommendations(
  level1: NonNullable<ArchetypePathData['level1']>,
  context?: PathValidationContext
): PathValidationIssue[] {
  const innateIds = level1.innatePowers ?? [];
  if (innateIds.length === 0) return [];

  const archetypeType = context?.archetypeType;
  if (!archetypeType) {
    return [
      {
        severity: 'warning',
        message:
          'Recommended innate powers authored but archetype type was not provided for eligibility validation.',
      },
    ];
  }

  const resolve = context?.resolveInnatePower;
  if (!resolve) {
    return [
      {
        severity: 'warning',
        message:
          'Recommended innate powers authored but power library data was unavailable for Appendix G eligibility checks.',
      },
    ];
  }

  return validateRecommendedInnatePowers(innateIds, {
    archetypeType,
    powerProfStart: context?.powerProfStart,
    martialProfStart: context?.martialProfStart,
    resolvePower: resolve,
  });
}

function validateLoadoutTrainingPoints(
  level1: NonNullable<ArchetypePathData['level1']>,
  context?: PathValidationContext
): PathValidationIssue[] {
  const issues: PathValidationIssue[] = [];
  const loadouts = level1.loadouts ?? [];
  if (loadouts.length === 0) return issues;

  const resolveTp = context?.resolveItemTrainingPoints;
  const limit = context?.trainingPointLimit;
  if (!resolveTp || limit == null) {
    issues.push({
      severity: 'warning',
      message: `${loadouts.length} loadout(s) authored. TP budget was not validated (missing item property data).`,
    });
    return issues;
  }

  for (const loadout of loadouts) {
    const items = flattenLoadoutEntries(loadout);
    let spent = 0;
    const unknown: string[] = [];
    for (const ref of items) {
      const tp = resolveTp(ref.id);
      if (tp == null || Number.isNaN(tp)) {
        unknown.push(ref.id);
        continue;
      }
      spent += tp * Math.max(1, ref.quantity);
    }
    if (unknown.length > 0) {
      issues.push({
        severity: 'warning',
        message: `Loadout "${loadout.title}" references unknown items: ${unknown.slice(0, 3).join(', ')}${unknown.length > 3 ? '…' : ''}.`,
      });
    }
    if (spent > limit) {
      issues.push({
        severity: 'error',
        message: `Loadout "${loadout.title}" exceeds Training Point budget (${spent} / ${limit}).`,
      });
    }
  }

  return issues;
}

function validateGuidanceGroup(group: PathGuidanceGroup): PathValidationIssue[] {
  const issues: PathValidationIssue[] = [];
  const itemCount =
    (group.feats?.length ?? 0) +
    (group.powers?.length ?? 0) +
    (group.techniques?.length ?? 0) +
    (group.armaments?.length ?? 0) +
    (group.equipment?.length ?? 0);

  if (itemCount > LAYER1_GOVERNANCE.maxItemsPerGroup) {
    issues.push({
      severity: 'warning',
      message: `Guidance group "${group.title}" has ${itemCount} items (max ${LAYER1_GOVERNANCE.maxItemsPerGroup}).`,
    });
  }
  if (group.why && group.why.length > LAYER1_GOVERNANCE.maxWhyCopyLength) {
    issues.push({
      severity: 'warning',
      message: `Guidance group "${group.title}" why-copy exceeds ${LAYER1_GOVERNANCE.maxWhyCopyLength} characters.`,
    });
  }
  return issues;
}
