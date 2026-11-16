/**
 * Creature creator — feat requirement mapping, point costs, and leveled-feat helpers.
 */

import type { CreatureFeat as CodexCreatureFeat, Feat } from '@/hooks';
import {
  formatFeatName,
  getFeatFamilyId,
  getFeatLevel,
  mergeFeatsInFamilyOnAdd,
  type LeveledFeatLike,
} from '@/lib/leveled-feats';
import type { CharacterForFeatRequirement } from '@/lib/game/feat-requirements';
import type { CreatureSkill, CreatureState } from './creature-creator-types';
import {
  classifyStoredFeatCatalog,
  type CreatureFeat,
  type FeatSourceLookup,
} from './transformers';

declare const creatureCodexFeatIdBrand: unique symbol;
declare const playerCodexFeatIdBrand: unique symbol;
declare const speciesTraitIdBrand: unique symbol;

/** `codex_creature_feats.id`. Not interchangeable with a character feat id. */
export type CreatureCodexFeatId = string & { readonly [creatureCodexFeatIdBrand]: true };
/** `codex_feats.id`. Character and archetype feats share this table. */
export type PlayerCodexFeatId = string & { readonly [playerCodexFeatIdBrand]: true };
/** Species trait id. Not a feat id from either feat table. */
export type SpeciesTraitId = string & { readonly [speciesTraitIdBrand]: true };

export function creatureCodexFeatId(id: string | number): CreatureCodexFeatId {
  return String(id) as CreatureCodexFeatId;
}

export function playerCodexFeatId(id: string | number): PlayerCodexFeatId {
  return String(id) as PlayerCodexFeatId;
}

export function speciesTraitId(id: string | number): SpeciesTraitId {
  return String(id) as SpeciesTraitId;
}

export type CatalogOwnedFeatIds = {
  creature: ReadonlySet<CreatureCodexFeatId>;
  player: ReadonlySet<PlayerCodexFeatId>;
  trait: ReadonlySet<SpeciesTraitId>;
};

export function ownedFeatIdsByCatalog(
  feats: readonly Pick<CreatureFeat, 'id' | 'name' | 'featSourceType'>[],
  lookup: FeatSourceLookup,
): CatalogOwnedFeatIds {
  const creature = new Set<CreatureCodexFeatId>();
  const player = new Set<PlayerCodexFeatId>();
  const trait = new Set<SpeciesTraitId>();
  for (const feat of feats) {
    const id = String(feat.id);
    if (!id) continue;
    const catalog = classifyStoredFeatCatalog(feat, lookup);
    if (catalog === 'creature') creature.add(creatureCodexFeatId(id));
    else if (catalog === 'player') player.add(playerCodexFeatId(id));
    else if (catalog === 'trait') trait.add(speciesTraitId(id));
  }
  return { creature, player, trait };
}

/** Highest owned rank in each family, looked up only in that catalog's id set. */
export function ownedFamilyLevelCaps<T extends LeveledFeatLike, Id extends string>(
  catalog: readonly T[],
  ownedIds: ReadonlySet<Id>,
  toId: (id: string | number) => Id,
): ReadonlyMap<string, number> {
  const caps = new Map<string, number>();
  for (const feat of catalog) {
    if (!ownedIds.has(toId(feat.id))) continue;
    const familyId = getFeatFamilyId(feat);
    const level = getFeatLevel(feat);
    const prev = caps.get(familyId) ?? 0;
    if (level > prev) caps.set(familyId, level);
  }
  return caps;
}

export function sameStoredFeatRow(
  row: Pick<CreatureFeat, 'id' | 'name' | 'featSourceType'>,
  identity: Pick<CreatureFeat, 'id' | 'name' | 'featSourceType'>,
): boolean {
  if (String(row.id) !== String(identity.id)) return false;
  if (row.featSourceType && identity.featSourceType) {
    return row.featSourceType === identity.featSourceType;
  }
  const rowName = row.name?.trim();
  const identityName = identity.name?.trim();
  if (rowName && identityName) return rowName === identityName;
  return !row.featSourceType && !identity.featSourceType;
}

export function storedFeatRowKey(
  feat: Pick<CreatureFeat, 'id' | 'name' | 'featSourceType'>,
): string {
  return `${feat.featSourceType ?? 'unset'}:${feat.id}:${feat.name}`;
}

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
  lookup?: FeatSourceLookup,
): CharacterForFeatRequirement {
  const playerFeats = creature.feats.filter((feat) => {
    if (lookup) return classifyStoredFeatCatalog(feat, lookup) === 'player';
    return feat.featSourceType === 'character' || feat.featSourceType === 'archetype';
  });
  return {
    level: effectiveCreatureLevelForFeatReq(creature.level),
    abilities: creature.abilities,
    defenseVals: creature.defenses,
    skills: creatureSkillsToFeatReqRecord(creature.skills),
    feats: playerFeats.map((f) => ({ id: f.id, name: f.name })),
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
