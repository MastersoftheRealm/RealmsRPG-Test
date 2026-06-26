/**
 * Creature creator — feat requirement mapping, point costs, and leveled-feat helpers.
 */

import type { Feat } from '@/hooks';
import {
  formatFeatName,
  getFeatFamilyId,
  getFeatLevel,
} from '@/lib/leveled-feats';
import {
  checkFeatRequirements,
  type CharacterForFeatRequirement,
} from '@/lib/game/feat-requirements';
import type { CodexSkillForFeat } from '@/lib/game/formulas';
import type { CreatureSkill, CreatureState } from './creature-creator-types';
import type { CreatureFeat } from './transformers';

export function creatureSkillsToFeatReqRecord(
  skills: CreatureSkill[]
): Record<string, { prof?: boolean; val?: number }> {
  const out: Record<string, { prof?: boolean; val?: number }> = {};
  skills.forEach((s) => {
    const entry = { prof: s.proficient, val: s.value };
    if (s.id) out[String(s.id)] = entry;
    if (s.name) out[s.name] = entry;
  });
  return out;
}

export function effectiveCreatureLevelForFeatReq(level: number | undefined | null): number {
  const n = Number(level);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.floor(n));
}

export function creatureToFeatRequirementCharacter(creature: CreatureState): CharacterForFeatRequirement {
  return {
    level: effectiveCreatureLevelForFeatReq(creature.level),
    abilities: creature.abilities,
    defenseVals: creature.defenses,
    skills: creatureSkillsToFeatReqRecord(creature.skills),
    feats: creature.feats.map((f) => ({ id: f.id, name: f.name })),
    archetypeFeats: [],
  };
}

export function creaturePointsForPlayerFeat(feat: { char_feat?: boolean; feat_lvl?: number }): number {
  const lvl = feat.feat_lvl != null && feat.feat_lvl > 0 ? feat.feat_lvl : 1;
  return feat.char_feat ? 0.5 * lvl : 1 * lvl;
}

export function codexFeatToCreatureFeat(feat: Feat): CreatureFeat {
  return {
    id: String(feat.id),
    name: formatFeatName(feat),
    description: feat.description,
    points: creaturePointsForPlayerFeat(feat),
    featSourceType: feat.char_feat ? 'character' : 'archetype',
  };
}

/** Highest feat level in a family the creature currently qualifies for. */
export function getMaxQualifiedFeatLevel(
  creature: CreatureState,
  family: Feat[],
  codexSkills: CodexSkillForFeat[],
  allFeats: Feat[]
): number {
  const requirementCharacter = creatureToFeatRequirementCharacter(creature);
  let max = 1;
  family.forEach((feat) => {
    const level = getFeatLevel(feat);
    const { met } = checkFeatRequirements(feat, requirementCharacter, codexSkills, allFeats);
    if (met) max = Math.max(max, level);
  });
  return max;
}

/** When adding library feats, replace lower levels in the same feat family (matches character sheet). */
export function mergeCreatureFeatsOnAdd(
  existing: CreatureFeat[],
  added: CreatureFeat[],
  codexFeatsById: Map<string, Feat>
): CreatureFeat[] {
  const getLevel = (id: string) => {
    const def = codexFeatsById.get(id);
    return def ? getFeatLevel(def) : 1;
  };
  const getFamily = (id: string) => {
    const def = codexFeatsById.get(id);
    return def ? getFeatFamilyId(def) : id;
  };

  return added.reduce<CreatureFeat[]>((acc, nextFeat) => {
    const nextFamily = getFamily(nextFeat.id);
    const nextLevel = getLevel(nextFeat.id);
    const filtered = acc.filter((existing) => {
      const existingDef = codexFeatsById.get(existing.id);
      if (!existingDef) return true;
      if (getFamily(existing.id) !== nextFamily) return true;
      return getLevel(existing.id) >= nextLevel;
    });
    return [...filtered, nextFeat];
  }, [...existing]);
}
