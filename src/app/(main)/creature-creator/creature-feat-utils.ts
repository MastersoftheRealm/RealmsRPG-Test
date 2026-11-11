/**
 * Creature creator — feat requirement mapping, point costs, and leveled-feat helpers.
 */

import type { CreatureFeat as CodexCreatureFeat, Feat } from '@/hooks';
import { formatFeatName, mergeFeatsInFamilyOnAdd, type LeveledFeatLike } from '@/lib/leveled-feats';
import type { CharacterForFeatRequirement } from '@/lib/game/feat-requirements';
import type { CreatureSkill, CreatureState } from './creature-creator-types';
import type { CreatureFeat } from './transformers';

function creatureSkillsToFeatReqRecord(
  skills: CreatureSkill[],
): Record<string, { prof?: boolean | undefined; val?: number | undefined }> {
  const out: Record<string, { prof?: boolean | undefined; val?: number | undefined }> = {};
  skills.forEach((s) => {
    const entry = { prof: s.proficient, val: s.value };
    if (s.id) out[String(s.id)] = entry;
    if (s.name) out[s.name] = entry;
  });
  return out;
}

function effectiveCreatureLevelForFeatReq(level: number | undefined | null): number {
  const n = Number(level);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.floor(n));
}

export function creatureToFeatRequirementCharacter(
  creature: CreatureState,
): CharacterForFeatRequirement {
  return {
    level: effectiveCreatureLevelForFeatReq(creature.level),
    abilities: creature.abilities,
    defenseVals: creature.defenses,
    skills: creatureSkillsToFeatReqRecord(creature.skills),
    feats: creature.feats.map((f) => ({ id: f.id, name: f.name })),
    archetypeFeats: [],
  };
}

export function creaturePointsForPlayerFeat(feat: {
  char_feat?: boolean | undefined;
  feat_lvl?: number | undefined;
}): number {
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

export function codexCreatureFeatToCreatureFeat(feat: CodexCreatureFeat): CreatureFeat {
  return {
    id: String(feat.id),
    name: formatFeatName(feat),
    description: feat.description,
    points: feat.points,
    featSourceType: 'creature',
  };
}

/** Replace lower ranks in the same catalog family when adding feats (creature vs character maps stay separate). */
export function mergeCreatureFeatsOnAdd(
  existing: CreatureFeat[],
  added: CreatureFeat[],
  characterDefsById: Map<string, LeveledFeatLike>,
  creatureDefsById: Map<string, LeveledFeatLike>,
): CreatureFeat[] {
  return mergeFeatsInFamilyOnAdd({
    existing,
    added,
    characterDefsById,
    creatureDefsById,
  });
}
