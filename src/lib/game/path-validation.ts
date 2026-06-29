/**
 * Admin path publish validation — Layer 1 governance (REALMS_PRODUCT_OVERVIEW.md Appendix I.3).
 * Validates path_data before a path is player-visible.
 */

import type { ArchetypePathData, PathGuidanceGroup } from '@/types/archetype';
import { LAYER1_GOVERNANCE } from '@/lib/constants/creator-layer-governance';

export interface PathValidationIssue {
  severity: 'error' | 'warning';
  message: string;
}

export function validatePathDataForPublish(pathData: ArchetypePathData | undefined): PathValidationIssue[] {
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
      message: 'Level 1 notes are very long — keep path guidance concise for Layer 1.',
    });
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
