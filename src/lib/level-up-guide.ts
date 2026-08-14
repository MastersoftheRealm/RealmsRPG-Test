/**
 * Build delta-only level-up tutorial content (TASK-388).
 * Storage: browser localStorage via onboarding-preferences (TBD profile sync later).
 */

import {
  calculateAbilityPoints,
  calculateSkillPointsForEntity,
  calculateHealthEnergyPool,
  calculateTrainingPoints,
  calculateMaxArchetypeFeats,
  calculateMaxCharacterFeats,
} from '@/lib/game/formulas';
import { getArchetypeAbilityScore } from '@/lib/game/calculations';
import type { Character, ArchetypeCategory } from '@/types';
import type { CoreRulesMap } from '@/types/core-rules';
import {
  areTutorialsEnabled,
  hasSeenTutorialMilestone,
  type TutorialMilestoneId,
} from '@/lib/onboarding-preferences';
import { ONBOARDING_COPY } from '@/lib/constants/copy/onboarding-copy';

const copy = ONBOARDING_COPY.levelUpGuide;

export interface LevelUpGuideContent {
  milestoneId: TutorialMilestoneId;
  title: string;
  bullets: string[];
  newLevel: number;
  /** data-tour-id to highlight on the sheet (prefer highlight over modal). */
  highlightTarget: string | null;
  /** Enter sheet edit mode so allocation controls are visible. */
  enterEditMode: boolean;
}

function highlightFor(id: TutorialMilestoneId): string | null {
  switch (id) {
    case 'first_ability_point':
      return 'sheet-tour-abilities';
    case 'first_library_slot':
      return 'sheet-tour-library';
    case 'first_level_up':
      return 'sheet-tour-header';
    default:
      return null;
  }
}

export function buildLevelUpGuideContent(
  character: Character,
  previousLevel: number,
  newLevel: number,
  rules?: Partial<CoreRulesMap>
): LevelUpGuideContent | null {
  if (!areTutorialsEnabled()) return null;
  if (newLevel <= previousLevel) return null;

  const highestAbility = getArchetypeAbilityScore(character);
  const archType = (character.archetype?.type || 'power') as ArchetypeCategory;

  const heGain =
    calculateHealthEnergyPool(newLevel, 'PLAYER', false, rules) -
    calculateHealthEnergyPool(previousLevel, 'PLAYER', false, rules);
  const apGain =
    calculateAbilityPoints(newLevel, false, rules) -
    calculateAbilityPoints(previousLevel, false, rules);
  const spGain =
    calculateSkillPointsForEntity(newLevel, 'character', rules) -
    calculateSkillPointsForEntity(previousLevel, 'character', rules);
  const tpGain =
    calculateTrainingPoints(newLevel, highestAbility, rules) -
    calculateTrainingPoints(previousLevel, highestAbility, rules);
  const featGain =
    calculateMaxArchetypeFeats(newLevel, archType, rules, character.archetypeChoices) -
    calculateMaxArchetypeFeats(previousLevel, archType, rules, character.archetypeChoices) +
    (calculateMaxCharacterFeats(newLevel) - calculateMaxCharacterFeats(previousLevel));

  let pick: { id: TutorialMilestoneId; title: string } | null = null;

  if (!hasSeenTutorialMilestone('first_level_up')) {
    pick = { id: 'first_level_up', title: copy.titleFirst };
  } else if (apGain > 0 && !hasSeenTutorialMilestone('first_ability_point')) {
    pick = { id: 'first_ability_point', title: copy.titleAbility };
  } else if ((tpGain > 0 || featGain > 0) && !hasSeenTutorialMilestone('first_library_slot')) {
    pick = { id: 'first_library_slot', title: copy.titleLibrary };
  }

  if (!pick) return null;

  const bullets: string[] = [];
  if (pick.id === 'first_ability_point') {
    bullets.push(copy.editModeOn);
    bullets.push(copy.abilityTip);
    bullets.push(copy.allocateAbilities);
  } else if (pick.id === 'first_library_slot') {
    if (tpGain > 0) bullets.push(copy.allocateTraining);
    if (featGain > 0) bullets.push(copy.allocateFeats);
  } else {
    if (heGain > 0) bullets.push(copy.allocateHealthEnergy);
    if (spGain > 0) bullets.push(copy.allocateSkills);
    if (featGain > 0) bullets.push(copy.allocateFeats);
    if (tpGain > 0) bullets.push(copy.allocateTraining);
    if (apGain > 0) bullets.push(copy.allocateAbilities);
  }

  if (bullets.length === 0) {
    bullets.push(`At this level you moved from ${previousLevel} to ${newLevel}.`);
  }

  return {
    milestoneId: pick.id,
    title: pick.title,
    bullets,
    newLevel,
    highlightTarget: highlightFor(pick.id),
    enterEditMode: pick.id === 'first_ability_point',
  };
}
