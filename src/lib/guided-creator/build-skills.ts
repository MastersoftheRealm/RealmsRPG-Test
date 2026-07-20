/**
 * Guided creator skill rows — thin wrapper over shared creator skill-save helper.
 */

import {
  buildCreatorSkillSaveRows,
  type CreatorSkillCodexEntry,
  type CreatorSkillSaveRow,
} from '@/lib/creator/build-creator-skills';

export type GuidedSkillRow = CreatorSkillSaveRow;

export function buildGuidedSkillsArray(
  skills: Record<string, number>,
  speciesSkillIds: string[],
  codexSkills: CreatorSkillCodexEntry[]
): GuidedSkillRow[] {
  return buildCreatorSkillSaveRows(skills, { speciesSkillIds, codexSkills });
}
