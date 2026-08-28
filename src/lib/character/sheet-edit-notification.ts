/**
 * Sheet edit toolbar notification — global pencil dot vs section EditSectionToggle states.
 * TASK-896: danger red only for overspend; success green for unspent; level-up is separate.
 */

import type { EditState } from '@/components/patterns';
import type { Character } from '@/types';
import { DEFAULT_DEFENSE_SKILLS } from '@/types/skills';
import {
  calculateAbilityPoints,
  calculateAbilityScoreCost,
  calculateHealthEnergyPool,
  calculateMaxArchetypeFeats,
  calculateMaxCharacterFeats,
  calculateProficiency,
  calculateSkillPointsForEntity,
  calculateXpToLevelUp,
} from '@/lib/game/formulas';
import {
  buildSpeciesSkillIdSet,
  calculateCharacterSkillPointsSpent,
} from '@/lib/game/skill-allocation';
import type { CoreRulesMap } from '@/types/core-rules';

export type SheetEditNotificationSeverity = 'none' | 'overspent' | 'unspent' | 'mixed' | 'level-up';

export interface SheetEditNotification {
  show: boolean;
  severity: SheetEditNotificationSeverity;
  title: string;
}

export interface SheetPointPools {
  abilityRemaining: number;
  skillRemaining: number;
  heRemaining: number;
  profRemaining: number;
  archetypeFeatRemaining: number;
  characterFeatRemaining: number;
  canLevelUp: boolean;
}

type FeatRef = { id?: string | number | undefined };
type CodexFeatLike = { id: string; feat_lvl?: number | undefined };

export function buildFeatLevelById(featsDb: CodexFeatLike[]): Map<string, number> {
  const featLevelById = new Map<string, number>();
  featsDb.forEach((feat) => {
    const lvl = feat.feat_lvl != null && feat.feat_lvl > 0 ? feat.feat_lvl : 1;
    featLevelById.set(String(feat.id), lvl);
  });
  return featLevelById;
}

export function sumFeatSlotUsage(feats: FeatRef[], featLevelById: Map<string, number>): number {
  return feats.reduce((sum, feat) => sum + (featLevelById.get(String(feat.id)) ?? 1), 0);
}

export interface ComputeSheetPointPoolsArgs {
  character: Character;
  characterSpeciesSkills: string[];
  featsDb: CodexFeatLike[];
  rules: Partial<CoreRulesMap> | undefined;
}

export function computeSheetPointPools({
  character,
  characterSpeciesSkills,
  featsDb,
  rules,
}: ComputeSheetPointPoolsArgs): SheetPointPools {
  const level = character.level || 1;
  const xp = character.experience ?? 0;
  const canLevelUp = xp >= calculateXpToLevelUp(level);

  const totalAbilityPoints = calculateAbilityPoints(level, false, rules);
  const currentAbilities = character.abilities || {};
  const spentAbilityPoints = Object.values(currentAbilities).reduce(
    (sum, val) => sum + calculateAbilityScoreCost(val || 0, rules),
    0,
  );
  const abilityRemaining = totalAbilityPoints - spentAbilityPoints;

  const totalHEPoints = calculateHealthEnergyPool(level, 'PLAYER', false, rules);
  const spentHEPoints = (character.healthPoints || 0) + (character.energyPoints || 0);
  const heRemaining = totalHEPoints - spentHEPoints;

  const totalSkillPoints = calculateSkillPointsForEntity(level, 'character', rules);
  const skillsList = (character.skills || []) as Array<{
    skill_val?: number | undefined;
    prof?: boolean | undefined;
    baseSkill?: string | undefined;
    baseSkillId?: number | undefined;
    selectedBaseSkillId?: string | undefined;
    name?: string | undefined;
    id?: string | undefined;
  }>;
  const speciesSkillIdSet = buildSpeciesSkillIdSet(
    characterSpeciesSkills.filter((id) => id !== '0'),
    skillsList,
  );
  const defVals = character.defenseVals || character.defenseSkills || DEFAULT_DEFENSE_SKILLS;
  const spentSkillPoints = calculateCharacterSkillPointsSpent(
    skillsList,
    speciesSkillIdSet,
    defVals,
    rules,
  );
  const skillRemaining = totalSkillPoints - spentSkillPoints;

  const martialProf = character.mart_prof ?? character.martialProficiency ?? 0;
  const powerProf = character.pow_prof ?? character.powerProficiency ?? 0;
  const totalProfPoints = calculateProficiency(level, false, rules);
  const profRemaining = totalProfPoints - (martialProf + powerProf);

  const archetypeType = character.archetype?.type || 'power';
  const archetypeFeatSlots = calculateMaxArchetypeFeats(
    level,
    archetypeType,
    undefined,
    character.archetypeChoices,
  );
  const characterFeatSlots = calculateMaxCharacterFeats(level);
  const featLevelById = buildFeatLevelById(featsDb);
  const usedArchetypeFeats = sumFeatSlotUsage(character.archetypeFeats || [], featLevelById);
  const usedCharacterFeats = sumFeatSlotUsage(character.feats || [], featLevelById);
  const archetypeFeatRemaining = archetypeFeatSlots - usedArchetypeFeats;
  const characterFeatRemaining = characterFeatSlots - usedCharacterFeats;

  return {
    abilityRemaining,
    skillRemaining,
    heRemaining,
    profRemaining,
    archetypeFeatRemaining,
    characterFeatRemaining,
    canLevelUp,
  };
}

function formatCount(n: number, singular: string, plural = `${singular}s`): string {
  const abs = Math.abs(n);
  const label = abs === 1 ? singular : plural;
  return `${abs} ${label}`;
}

function buildPoolMessage(parts: string[]): string {
  return parts.join('; ');
}

export function buildSheetEditNotification(pools: SheetPointPools): SheetEditNotification {
  const overspent: string[] = [];
  const unspent: string[] = [];

  if (pools.abilityRemaining < 0) {
    overspent.push(formatCount(pools.abilityRemaining, 'ability point'));
  } else if (pools.abilityRemaining > 0) {
    unspent.push(formatCount(pools.abilityRemaining, 'ability point'));
  }

  if (pools.skillRemaining < 0) {
    overspent.push(formatCount(pools.skillRemaining, 'skill point'));
  } else if (pools.skillRemaining > 0) {
    unspent.push(formatCount(pools.skillRemaining, 'skill point'));
  }

  if (pools.heRemaining < 0) {
    overspent.push(formatCount(pools.heRemaining, 'Health/Energy point', 'Health/Energy points'));
  } else if (pools.heRemaining > 0) {
    unspent.push(formatCount(pools.heRemaining, 'Health/Energy point', 'Health/Energy points'));
  }

  if (pools.profRemaining < 0) {
    overspent.push(formatCount(pools.profRemaining, 'proficiency point'));
  } else if (pools.profRemaining > 0) {
    unspent.push(formatCount(pools.profRemaining, 'proficiency point'));
  }

  if (pools.archetypeFeatRemaining < 0) {
    overspent.push(formatCount(pools.archetypeFeatRemaining, 'archetype feat slot'));
  } else if (pools.archetypeFeatRemaining > 0) {
    unspent.push(formatCount(pools.archetypeFeatRemaining, 'archetype feat slot'));
  }

  if (pools.characterFeatRemaining < 0) {
    overspent.push(formatCount(pools.characterFeatRemaining, 'character feat slot'));
  } else if (pools.characterFeatRemaining > 0) {
    unspent.push(formatCount(pools.characterFeatRemaining, 'character feat slot'));
  }

  if (overspent.length > 0 && unspent.length > 0) {
    return {
      show: true,
      severity: 'mixed',
      title: `Over budget: ${buildPoolMessage(overspent)}; Unspent: ${buildPoolMessage(unspent)}`,
    };
  }

  if (overspent.length > 0) {
    return {
      show: true,
      severity: 'overspent',
      title: `Over budget: ${buildPoolMessage(overspent)}`,
    };
  }

  if (unspent.length > 0) {
    return {
      show: true,
      severity: 'unspent',
      title: `Unspent: ${buildPoolMessage(unspent)}`,
    };
  }

  if (pools.canLevelUp) {
    return {
      show: true,
      severity: 'level-up',
      title: 'Ready to level up — open Level Up from the toolbar',
    };
  }

  return { show: false, severity: 'none', title: '' };
}

export function resolveFeatLibraryEditState(
  pools: Pick<SheetPointPools, 'archetypeFeatRemaining' | 'characterFeatRemaining'>,
): EditState {
  if (pools.archetypeFeatRemaining < 0 || pools.characterFeatRemaining < 0) {
    return 'over-budget';
  }
  if (pools.archetypeFeatRemaining > 0 || pools.characterFeatRemaining > 0) {
    return 'has-points';
  }
  return 'normal';
}
