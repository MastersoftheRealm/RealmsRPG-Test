/**
 * Creature Movement controls.
 * Speed, fly, and burrow are bound to feat families. Other on/off controls are toggles.
 * Category is not decided here. A Speedy, Slow, Flying, or Burrow family row is this
 * section's control, even when its mechanic flag is false. Other mechanic-false
 * Movement rows stay normal picks.
 * Saved Speedy and Slow names still load an old speed. A family level those names
 * cannot spell is stored as walk:+N or walk:-N, one space per level.
 */

import { CREATURE_FEAT_IDS } from '@/lib/id-constants';
import { getFeatLevel } from '@/lib/leveled-feats';
import {
  creatureWalkLevel,
  isLegacyWalkMovementName,
  walkMovementToken,
} from '@/lib/game/calculations';
import type { CreatureFeat as CodexCreatureFeat } from '@/hooks';
import { codexCreatureFeatToCreatureFeat } from './creature-feat-utils';
import type { CreatureState } from './creature-creator-types';
import type { CreatureFeat } from './transformers';

const FLY_NAMES = ['Fly Half', 'Fly'] as const;
const SWIM_NAMES = ['Swim Half', 'Swim'] as const;
const BURROW_NAMES = ['Burrow', 'Burrow II'] as const;

const SPEEDY_IDS = [
  CREATURE_FEAT_IDS.SPEEDY,
  CREATURE_FEAT_IDS.SPEEDY_II,
  CREATURE_FEAT_IDS.SPEEDY_III,
] as const;
const SLOW_IDS = [
  CREATURE_FEAT_IDS.SLOW,
  CREATURE_FEAT_IDS.SLOW_II,
  CREATURE_FEAT_IDS.SLOW_III,
] as const;
const FLY_IDS = [CREATURE_FEAT_IDS.FLYING, CREATURE_FEAT_IDS.FLYING_II] as const;
const BURROW_IDS = [CREATURE_FEAT_IDS.BURROW, CREATURE_FEAT_IDS.BURROW_II] as const;

/** On/off controls. Terrain Bound is the named example; it has no Movement category yet. */
const TOGGLE_IDS = [
  CREATURE_FEAT_IDS.ALL_SURFACE_CLIMBER,
  CREATURE_FEAT_IDS.WATER_MOVEMENT,
  CREATURE_FEAT_IDS.UNRESTRAINED_MOVEMENT,
  CREATURE_FEAT_IDS.HOVER,
  98,
] as const;

const WALK_FAMILY_ROOTS = new Set<string>([
  String(CREATURE_FEAT_IDS.SPEEDY),
  String(CREATURE_FEAT_IDS.SLOW),
  String(CREATURE_FEAT_IDS.FLYING),
  String(CREATURE_FEAT_IDS.BURROW),
]);
const SPEED_ROOTS = new Set<string>([
  String(CREATURE_FEAT_IDS.SPEEDY),
  String(CREATURE_FEAT_IDS.SLOW),
]);

function idString(id: number): string {
  return String(id);
}

const CONTROL_IDS = new Set<string>([
  ...SPEEDY_IDS.map(idString),
  ...SLOW_IDS.map(idString),
  ...FLY_IDS.map(idString),
  ...BURROW_IDS.map(idString),
  ...TOGGLE_IDS.map(idString),
]);

export function isCreatureMovementControlFeatId(id: string | number): boolean {
  return CONTROL_IDS.has(String(id));
}

/** A family row the Movement steppers own, including a mechanic-false child such as a further Speedy level. */
function isMovementBoundFamilyFeat(feat: {
  id: string | number;
  base_feat_id?: string | number | null | undefined;
}): boolean {
  const id = String(feat.id);
  const base =
    feat.base_feat_id == null || feat.base_feat_id === '' ? '' : String(feat.base_feat_id);
  return WALK_FAMILY_ROOTS.has(id) || WALK_FAMILY_ROOTS.has(base);
}

/** Hidden from the feat list: a known control id, a bound row, or any speed-family child in the codex. */
export function isCreatureMovementEffectFeat(
  feat: {
    id?: string | number | undefined;
    base_feat_id?: string | number | null | undefined;
    boundControl?: boolean | undefined;
  },
  catalogRow?: Pick<CodexCreatureFeat, 'id' | 'base_feat_id'> | null,
): boolean {
  if (feat.boundControl) return true;
  if (feat.id == null) return false;
  if (isCreatureMovementControlFeatId(feat.id)) return true;
  if (catalogRow && isMovementBoundFamilyFeat(catalogRow)) return true;
  if (
    feat.base_feat_id != null &&
    feat.base_feat_id !== '' &&
    isMovementBoundFamilyFeat({ id: String(feat.id), base_feat_id: feat.base_feat_id })
  ) {
    return true;
  }
  return false;
}

export function formatMovementPointCost(points: number): string {
  const rounded = Math.round(points * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatMovementSpeed(speed: number): string {
  return Number.isInteger(speed) ? String(speed) : speed.toFixed(1);
}

/** Half or full of the walking speed already on the sheet. No extra rounding rule. */
export function movementTravelSpeed(walkSpeed: number, level: 1 | 2): number {
  return level === 1 ? walkSpeed / 2 : walkSpeed;
}

type FamilyIds = readonly number[];

function familyCap(
  catalog: readonly CodexCreatureFeat[],
  baseId: number,
  knownIds: FamilyIds,
): number {
  const base = String(baseId);
  const rows = catalog.filter(
    (feat) => String(feat.id) === base || String(feat.base_feat_id ?? '') === base,
  );
  if (rows.length === 0) return knownIds.length;
  return Math.max(...rows.map((feat) => getFeatLevel(feat)));
}

function featIdForLevel(
  catalog: readonly CodexCreatureFeat[],
  baseId: number,
  level: number,
  knownIds: FamilyIds,
): string {
  const base = String(baseId);
  const row = catalog.find(
    (feat) =>
      (String(feat.id) === base || String(feat.base_feat_id ?? '') === base) &&
      getFeatLevel(feat) === level,
  );
  if (row) return String(row.id);
  return String(knownIds[level - 1] ?? baseId);
}

export function walkLevelCap(catalog: readonly CodexCreatureFeat[]): { up: number; down: number } {
  return {
    up: familyCap(catalog, CREATURE_FEAT_IDS.SPEEDY, SPEEDY_IDS),
    down: familyCap(catalog, CREATURE_FEAT_IDS.SLOW, SLOW_IDS),
  };
}

export function readWalkLevel(movementTypes: readonly string[]): number {
  return creatureWalkLevel(movementTypes);
}

function readSpeedMode(
  movementTypes: readonly string[],
  names: readonly string[],
): 0 | 1 | 2 {
  let level = 0;
  for (const name of movementTypes) {
    const index = names.indexOf(name);
    if (index >= 0) level = Math.max(level, index + 1);
  }
  return level === 0 ? 0 : level >= 2 ? 2 : 1;
}

export function readFlyLevel(movementTypes: readonly string[]): 0 | 1 | 2 {
  return readSpeedMode(movementTypes, FLY_NAMES);
}

export function readBurrowLevel(movementTypes: readonly string[]): 0 | 1 | 2 {
  return readSpeedMode(movementTypes, BURROW_NAMES);
}

export function readSwimLevel(movementTypes: readonly string[]): 0 | 1 | 2 {
  return readSpeedMode(movementTypes, SWIM_NAMES);
}

function stripNames(movementTypes: readonly string[], names: Set<string>): string[] {
  return movementTypes.filter((name) => !names.has(name));
}

function withoutIds(feats: readonly CreatureFeat[], ids: Set<string>): CreatureFeat[] {
  return feats.filter((feat) => !ids.has(String(feat.id)));
}

function withFeat(
  feats: CreatureFeat[],
  catalog: readonly CodexCreatureFeat[],
  id: string,
): CreatureFeat[] {
  const row = catalog.find((feat) => String(feat.id) === id);
  if (!row) return feats;
  return [...feats, { ...codexCreatureFeatToCreatureFeat(row), boundControl: true }];
}

function withoutSpeedFamily(
  feats: readonly CreatureFeat[],
  catalog: readonly CodexCreatureFeat[],
): CreatureFeat[] {
  const family = new Set<string>(WALK_IDS);
  for (const feat of catalog) {
    const id = String(feat.id);
    const base =
      feat.base_feat_id == null || feat.base_feat_id === '' ? '' : String(feat.base_feat_id);
    if (SPEED_ROOTS.has(id) || SPEED_ROOTS.has(base)) family.add(id);
  }
  return feats.filter((feat) => !family.has(String(feat.id)));
}

const WALK_IDS = new Set<string>([...SPEEDY_IDS, ...SLOW_IDS].map(idString));
const FLY_ID_SET = new Set<string>(FLY_IDS.map(idString));
const BURROW_ID_SET = new Set<string>(BURROW_IDS.map(idString));

export function movementAfterWalkLevel(
  creature: Pick<CreatureState, 'movementTypes' | 'feats'>,
  level: number,
  catalog: readonly CodexCreatureFeat[],
): Pick<CreatureState, 'movementTypes' | 'feats'> {
  const caps = walkLevelCap(catalog);
  const nextLevel = Math.max(-caps.down, Math.min(caps.up, level));
  let movementTypes = creature.movementTypes.filter((name) => !isLegacyWalkMovementName(name));
  let feats = withoutSpeedFamily(creature.feats, catalog);
  const token = walkMovementToken(nextLevel);
  if (token) movementTypes = [...movementTypes, token];
  if (nextLevel > 0) {
    feats = withFeat(
      feats,
      catalog,
      featIdForLevel(catalog, CREATURE_FEAT_IDS.SPEEDY, nextLevel, SPEEDY_IDS),
    );
  } else if (nextLevel < 0) {
    feats = withFeat(
      feats,
      catalog,
      featIdForLevel(catalog, CREATURE_FEAT_IDS.SLOW, -nextLevel, SLOW_IDS),
    );
  }
  return { movementTypes, feats };
}

function movementAfterMode(
  creature: Pick<CreatureState, 'movementTypes' | 'feats'>,
  level: 0 | 1 | 2,
  names: readonly string[],
  nameSet: Set<string>,
  ids: Set<string>,
  baseId: number,
  knownIds: FamilyIds,
  catalog: readonly CodexCreatureFeat[],
): Pick<CreatureState, 'movementTypes' | 'feats'> {
  let movementTypes = stripNames(creature.movementTypes, nameSet);
  let feats = withoutIds(creature.feats, ids);
  if (level > 0) {
    const name = names[level - 1] ?? names[0];
    if (name) movementTypes = [...movementTypes, name];
    feats = withFeat(feats, catalog, featIdForLevel(catalog, baseId, level, knownIds));
  }
  return { movementTypes, feats };
}

export function movementAfterFlyLevel(
  creature: Pick<CreatureState, 'movementTypes' | 'feats'>,
  level: 0 | 1 | 2,
  catalog: readonly CodexCreatureFeat[],
): Pick<CreatureState, 'movementTypes' | 'feats'> {
  return movementAfterMode(
    creature,
    level,
    FLY_NAMES,
    new Set(FLY_NAMES),
    FLY_ID_SET,
    CREATURE_FEAT_IDS.FLYING,
    FLY_IDS,
    catalog,
  );
}

export function movementAfterBurrowLevel(
  creature: Pick<CreatureState, 'movementTypes' | 'feats'>,
  level: 0 | 1 | 2,
  catalog: readonly CodexCreatureFeat[],
): Pick<CreatureState, 'movementTypes' | 'feats'> {
  return movementAfterMode(
    creature,
    level,
    BURROW_NAMES,
    new Set(BURROW_NAMES),
    BURROW_ID_SET,
    CREATURE_FEAT_IDS.BURROW,
    BURROW_IDS,
    catalog,
  );
}

/** No swimming tier feat is in the codex yet. Half/full speeds are stored on movementTypes only. */
export function movementAfterSwimLevel(
  creature: Pick<CreatureState, 'movementTypes' | 'feats'>,
  level: 0 | 1 | 2,
): Pick<CreatureState, 'movementTypes' | 'feats'> {
  const swimNames = new Set<string>(SWIM_NAMES);
  let movementTypes = stripNames(creature.movementTypes, swimNames);
  if (level > 0) {
    movementTypes = [...movementTypes, SWIM_NAMES[level - 1] ?? 'Swim Half'];
  }
  return { movementTypes, feats: creature.feats };
}

export function nextSpeedType(movementTypes: readonly string[]): 'fly' | 'swim' | null {
  if (readFlyLevel(movementTypes) === 0) return 'fly';
  if (readSwimLevel(movementTypes) === 0) return 'swim';
  return null;
}

export function movementToggleFeats(catalog: readonly CodexCreatureFeat[]): CodexCreatureFeat[] {
  const byId = new Map(catalog.map((feat) => [String(feat.id), feat]));
  return TOGGLE_IDS.map((id) => byId.get(String(id))).filter((feat): feat is CodexCreatureFeat =>
    Boolean(feat),
  );
}

export function movementDropdownFeats(catalog: readonly CodexCreatureFeat[]): CodexCreatureFeat[] {
  return catalog.filter(
    (feat) =>
      feat.category === 'Movement' &&
      feat.mechanic !== true &&
      !isCreatureMovementControlFeatId(feat.id) &&
      !isMovementBoundFamilyFeat(feat),
  );
}

export function movementControlFeatIdsFromNames(
  movementTypes: readonly string[],
  catalog: readonly CodexCreatureFeat[],
): string[] {
  const ids: string[] = [];
  const walk = readWalkLevel(movementTypes);
  if (walk > 0) {
    ids.push(featIdForLevel(catalog, CREATURE_FEAT_IDS.SPEEDY, walk, SPEEDY_IDS));
  }
  if (walk < 0) {
    ids.push(featIdForLevel(catalog, CREATURE_FEAT_IDS.SLOW, -walk, SLOW_IDS));
  }
  const fly = readFlyLevel(movementTypes);
  if (fly > 0) ids.push(String(FLY_IDS[fly - 1]));
  const burrow = readBurrowLevel(movementTypes);
  if (burrow > 0) ids.push(String(BURROW_IDS[burrow - 1]));
  return ids;
}

export function movementSectionPointTotal(
  creature: Pick<CreatureState, 'feats' | 'movementTypes'>,
  catalog: readonly CodexCreatureFeat[],
): number {
  const dropdownIds = new Set(movementDropdownFeats(catalog).map((feat) => String(feat.id)));
  const byId = new Map(catalog.map((feat) => [String(feat.id), feat]));
  const onCreature = new Set(creature.feats.map((feat) => String(feat.id)));
  let sum = 0;
  for (const feat of creature.feats) {
    const id = String(feat.id);
    if (!isCreatureMovementEffectFeat(feat) && !dropdownIds.has(id)) continue;
    const points = feat.points ?? byId.get(id)?.points ?? 0;
    if (Number.isFinite(points)) sum += points;
  }
  for (const id of movementControlFeatIdsFromNames(creature.movementTypes, catalog)) {
    if (onCreature.has(id)) continue;
    const points = byId.get(id)?.points ?? 0;
    if (Number.isFinite(points)) sum += points;
  }
  return sum;
}

export function toggleMovementFeat(
  creature: Pick<CreatureState, 'feats'>,
  feat: CodexCreatureFeat,
  on: boolean,
): CreatureFeat[] {
  const id = String(feat.id);
  const rest = creature.feats.filter((row) => String(row.id) !== id);
  if (!on) return rest;
  return [...rest, codexCreatureFeatToCreatureFeat(feat)];
}

export type MovementSpeedLine = { label: string; value: string };

/** Flying, swimming, and burrow speeds for the published block. Labels match the creator. */
export function movementTravelLines(
  movementTypes: readonly string[],
  walkSpeed: number,
): MovementSpeedLine[] {
  const lines: MovementSpeedLine[] = [];
  const fly = readFlyLevel(movementTypes);
  if (fly === 1 || fly === 2) {
    lines.push({
      label: 'Flying Speed',
      value: formatMovementSpeed(movementTravelSpeed(walkSpeed, fly)),
    });
  }
  const swim = readSwimLevel(movementTypes);
  if (swim === 1 || swim === 2) {
    lines.push({
      label: 'Swimming Speed',
      value: formatMovementSpeed(movementTravelSpeed(walkSpeed, swim)),
    });
  }
  const burrow = readBurrowLevel(movementTypes);
  if (burrow === 1 || burrow === 2) {
    lines.push({
      label: 'Burrow Speed',
      value: formatMovementSpeed(movementTravelSpeed(walkSpeed, burrow)),
    });
  }
  return lines;
}

export type MovementToggleLine = { id: string; name: string; description?: string };

const TOGGLE_ID_SET = new Set<string>(TOGGLE_IDS.map(idString));

/** Toggle controls stay off the feat list and show here by their saved name and description. */
export function movementToggleLines(
  feats: readonly {
    id?: string | number | undefined;
    name?: string | undefined;
    description?: string | undefined;
  }[],
): MovementToggleLine[] {
  const lines: MovementToggleLine[] = [];
  for (const feat of feats) {
    if (feat.id == null || !TOGGLE_ID_SET.has(String(feat.id))) continue;
    const name = feat.name?.trim();
    if (!name) continue;
    const line: MovementToggleLine = { id: String(feat.id), name };
    if (feat.description) line.description = feat.description;
    lines.push(line);
  }
  return lines;
}
