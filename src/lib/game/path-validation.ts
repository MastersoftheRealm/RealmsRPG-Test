/**
 * Admin path publish validation — Layer 1 governance (REALMS_PRODUCT_OVERVIEW.md Appendix I.3).
 * Validates path_data before a path is player-visible.
 */

import type { ArchetypeCategory, ArchetypePathData, PathGuidanceGroup } from '@/types/archetype';
import { flattenLoadoutEntries } from '@/lib/game/loadout-entries';
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
  /**
   * Return true when the skill is a sub-skill (has a base). Used for Level 1 skill authoring
   * warnings (TASK-515). Omit or return null when unknown — unknown ids are not treated as sub-skills.
   */
  isSubSkill?: (skillId: string) => boolean | null;
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
    ['powers', level1.powers?.length ?? 0],
    ['innate powers', level1.innatePowers?.length ?? 0],
    ['techniques', level1.techniques?.length ?? 0],
    ['armaments', level1.armaments?.length ?? 0],
    ['equipment', level1.equipment?.length ?? 0],
  ];
  for (const [label, count] of listCounts) {
    if (count > LAYER1_GOVERNANCE.maxItemsPerGroup) {
      issues.push({
        severity: 'warning',
        message: `Level 1 ${label} list has ${count} items (recommended max ${LAYER1_GOVERNANCE.maxItemsPerGroup} for Layer 1).`,
      });
    }
  }

  issues.push(...validateLevel1Skills(level1.skills ?? [], context));

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

/** Level 1 path skills: prefer ≤3 base skills; legacy excess / sub-skills warn only (TASK-515). */
export function validateLevel1Skills(
  skillIds: string[],
  context?: PathValidationContext
): PathValidationIssue[] {
  const issues: PathValidationIssue[] = [];
  const ids = skillIds.map(String).filter(Boolean);
  const max = LAYER1_GOVERNANCE.maxPathRecommendedBaseSkills;

  if (ids.length > max) {
    issues.push({
      severity: 'warning',
      message: `Level 1 recommends ${ids.length} skills (target max ${max} base skills). Save is allowed; trim in a later content pass.`,
    });
  }

  const isSub = context?.isSubSkill;
  if (isSub) {
    const subSkillIds = ids.filter((id) => isSub(id) === true);
    if (subSkillIds.length > 0) {
      issues.push({
        severity: 'warning',
        message: `Level 1 includes ${subSkillIds.length} sub-skill(s). Paths should recommend base skills only; save is allowed for legacy rows.`,
      });
    }
  }

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
  if ((group.feats?.length ?? 0) > 0 && group.audience == null) {
    issues.push({
      severity: 'warning',
      message: `Feat guidance group "${group.title}" is missing audience (character vs archetype). Parsers backfill from title until re-saved.`,
    });
  }
  return issues;
}
