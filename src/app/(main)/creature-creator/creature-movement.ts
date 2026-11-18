/**
 * Creature Movement controls.
 * Speed, fly, swim, burrow, and jump are embedded families on the Movement card.
 * Plain on/off rows use the named ids in `MOVEMENT_PLAIN_TOGGLE_IDS` (Kadin's movement
 * feat control list). Movement rows with `category === 'Movement'` and `mechanic !== true`
 * that are not controls stay checkbox toggles. Speedy/Slow families include level 166
 * without changing its stored mechanic flag.
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
import type { CreatureFeat, CreatureFeatSourceType } from './transformers';
import { isCreatureSensesEffectFeat } from './creature-senses';

const FLY_NAMES = ['Fly Half', 'Fly'] as const;
const SWIM_NAMES = ['Swim Half', 'Swim'] as const;
const BURROW_NAMES = ['Burrow', 'Burrow II'] as const;
const JUMP_NAMES = ['Jump', 'Jump II', 'Jump III'] as const;

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
const SWIM_IDS = [CREATURE_FEAT_IDS.SWIMMING, CREATURE_FEAT_IDS.SWIMMING_II] as const;
const BURROW_IDS = [CREATURE_FEAT_IDS.BURROW, CREATURE_FEAT_IDS.BURROW_II] as const;
const JUMP_IDS = [
  CREATURE_FEAT_IDS.JUMP,
  CREATURE_FEAT_IDS.JUMP_II,
  CREATURE_FEAT_IDS.JUMP_III,
] as const;

const MOVEMENT_PLAIN_TOGGLE_IDS = new Set<string>([
  String(CREATURE_FEAT_IDS.SLOW_WALKER),
  String(CREATURE_FEAT_IDS.ALL_SURFACE_CLIMBER),
  String(CREATURE_FEAT_IDS.WATER_MOVEMENT),
  String(CREATURE_FEAT_IDS.UNRESTRAINED_MOVEMENT),
  String(CREATURE_FEAT_IDS.HOVER),
  String(CREATURE_FEAT_IDS.TERRAIN_BOUND),
]);

const FLY_TOKEN = /^fly:(\d+)$/;
const SWIM_TOKEN = /^swim:(\d+)$/;
const BURROW_TOKEN = /^burrow:(\d+)$/;
const JUMP_TOKEN = /^jump:(\d+)$/;

const WALK_FAMILY_ROOTS = new Set<string>([
  String(CREATURE_FEAT_IDS.SPEEDY),
  String(CREATURE_FEAT_IDS.SLOW),
  String(CREATURE_FEAT_IDS.FLYING),
  String(CREATURE_FEAT_IDS.SWIMMING),
  String(CREATURE_FEAT_IDS.BURROW),
  String(CREATURE_FEAT_IDS.JUMP),
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
  ...SWIM_IDS.map(idString),
  ...BURROW_IDS.map(idString),
  ...JUMP_IDS.map(idString),
]);

export function isCreatureMovementControlFeatId(id: string | number): boolean {
  return CONTROL_IDS.has(String(id));
}

export function isCreatureMovementPlainToggleFeatId(id: string | number): boolean {
  return MOVEMENT_PLAIN_TOGGLE_IDS.has(String(id));
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

/** A Movement control, plain toggle, or bound family row. `boundControl` is not membership. */
export function isCreatureMovementEffectFeat(
  feat: {
    id?: string | number | undefined;
    base_feat_id?: string | number | null | undefined;
    featSourceType?: CreatureFeatSourceType | undefined;
  },
  catalogRow?: Pick<CodexCreatureFeat, 'id' | 'base_feat_id'> | null,
): boolean {
  if (feat.featSourceType && feat.featSourceType !== 'creature') return false;
  if (feat.id == null) return false;
  if (isCreatureMovementControlFeatId(feat.id)) return true;
  if (isCreatureMovementPlainToggleFeatId(feat.id)) return true;
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

/** Half at tier 1, full at tier 2+ of a movement mode family tied to walk speed. */
export function movementTravelSpeed(walkSpeed: number, level: number): number {
  return level <= 1 ? walkSpeed / 2 : walkSpeed;
}

/** Creator and published speed lines round half-speed up (`calculations.ts` is unchanged). */
export function movementTravelSpeedCreatorDisplay(walkSpeed: number, level: number): number {
  if (level <= 0) return 0;
  if (level <= 1) return Math.ceil(walkSpeed / 2);
  return walkSpeed;
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

function readModeLevel(
  movementTypes: readonly string[],
  names: readonly string[],
  token: RegExp,
): number {
  let level = 0;
  for (const name of movementTypes) {
    const index = names.indexOf(name);
    if (index >= 0) level = Math.max(level, index + 1);
    const parsed = token.exec(name);
    if (parsed) level = Math.max(level, Number(parsed[1]));
  }
  return level;
}

function modeMovementToken(prefix: string, level: number, names: readonly string[]): string | null {
  if (level <= 0) return null;
  return names[level - 1] ?? `${prefix}:${level}`;
}

function modeFamilyIdSet(
  catalog: readonly CodexCreatureFeat[],
  baseId: number,
  knownIds: FamilyIds,
): Set<string> {
  const base = String(baseId);
  const ids = new Set<string>(knownIds.map(idString));
  for (const feat of catalog) {
    const id = String(feat.id);
    const featBase =
      feat.base_feat_id == null || feat.base_feat_id === '' ? '' : String(feat.base_feat_id);
    if (id === base || featBase === base) ids.add(id);
  }
  return ids;
}

function readFlyLevel(movementTypes: readonly string[]): number {
  return readModeLevel(movementTypes, FLY_NAMES, FLY_TOKEN);
}

function readBurrowLevel(movementTypes: readonly string[]): number {
  return readModeLevel(movementTypes, BURROW_NAMES, BURROW_TOKEN);
}

function readJumpLevel(movementTypes: readonly string[]): number {
  return readModeLevel(movementTypes, JUMP_NAMES, JUMP_TOKEN);
}

export function readSwimLevel(movementTypes: readonly string[]): number {
  return readModeLevel(movementTypes, SWIM_NAMES, SWIM_TOKEN);
}

export function swimLevelCap(catalog: readonly CodexCreatureFeat[]): number {
  return familyCap(catalog, CREATURE_FEAT_IDS.SWIMMING, SWIM_IDS);
}

function flyLevelCap(catalog: readonly CodexCreatureFeat[]): number {
  return familyCap(catalog, CREATURE_FEAT_IDS.FLYING, FLY_IDS);
}

function burrowLevelCap(catalog: readonly CodexCreatureFeat[]): number {
  return familyCap(catalog, CREATURE_FEAT_IDS.BURROW, BURROW_IDS);
}

export function movementModeStepperLabel(
  _catalog: readonly CodexCreatureFeat[],
  _baseId: number,
  level: number,
): string {
  if (level <= 0) return '';
  return String(level);
}

export function movementModeDescription(
  catalog: readonly CodexCreatureFeat[],
  baseId: number,
  level: number,
  knownIds: FamilyIds,
): string {
  if (level <= 0) return '';
  const id = featIdForLevel(catalog, baseId, level, knownIds);
  return catalog.find((feat) => String(feat.id) === id)?.description?.trim() ?? '';
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
  level: number,
  names: readonly string[],
  nameSet: Set<string>,
  token: RegExp,
  tokenPrefix: string,
  baseId: number,
  knownIds: FamilyIds,
  catalog: readonly CodexCreatureFeat[],
): Pick<CreatureState, 'movementTypes' | 'feats'> {
  const cap = familyCap(catalog, baseId, knownIds);
  const nextLevel = Math.max(0, Math.min(cap, level));
  const familyIds = modeFamilyIdSet(catalog, baseId, knownIds);
  let movementTypes = stripNames(creature.movementTypes, nameSet);
  movementTypes = movementTypes.filter((name) => !token.test(name));
  let feats = withoutIds(creature.feats, familyIds);
  if (nextLevel > 0) {
    const modeName = modeMovementToken(tokenPrefix, nextLevel, names);
    if (modeName) movementTypes = [...movementTypes, modeName];
    feats = withFeat(feats, catalog, featIdForLevel(catalog, baseId, nextLevel, knownIds));
  }
  return { movementTypes, feats };
}

export function movementAfterFlyLevel(
  creature: Pick<CreatureState, 'movementTypes' | 'feats'>,
  level: number,
  catalog: readonly CodexCreatureFeat[],
): Pick<CreatureState, 'movementTypes' | 'feats'> {
  return movementAfterMode(
    creature,
    level,
    FLY_NAMES,
    new Set(FLY_NAMES),
    FLY_TOKEN,
    'fly',
    CREATURE_FEAT_IDS.FLYING,
    FLY_IDS,
    catalog,
  );
}

export function movementAfterBurrowLevel(
  creature: Pick<CreatureState, 'movementTypes' | 'feats'>,
  level: number,
  catalog: readonly CodexCreatureFeat[],
): Pick<CreatureState, 'movementTypes' | 'feats'> {
  return movementAfterMode(
    creature,
    level,
    BURROW_NAMES,
    new Set(BURROW_NAMES),
    BURROW_TOKEN,
    'burrow',
    CREATURE_FEAT_IDS.BURROW,
    BURROW_IDS,
    catalog,
  );
}

export function movementAfterSwimLevel(
  creature: Pick<CreatureState, 'movementTypes' | 'feats'>,
  level: number,
  catalog: readonly CodexCreatureFeat[],
): Pick<CreatureState, 'movementTypes' | 'feats'> {
  return movementAfterMode(
    creature,
    level,
    SWIM_NAMES,
    new Set(SWIM_NAMES),
    SWIM_TOKEN,
    'swim',
    CREATURE_FEAT_IDS.SWIMMING,
    SWIM_IDS,
    catalog,
  );
}

export function movementAfterJumpLevel(
  creature: Pick<CreatureState, 'movementTypes' | 'feats'>,
  level: number,
  catalog: readonly CodexCreatureFeat[],
): Pick<CreatureState, 'movementTypes' | 'feats'> {
  return movementAfterMode(
    creature,
    level,
    JUMP_NAMES,
    new Set(JUMP_NAMES),
    JUMP_TOKEN,
    'jump',
    CREATURE_FEAT_IDS.JUMP,
    JUMP_IDS,
    catalog,
  );
}

type BuiltInMovementKind = 'fly' | 'swim' | 'burrow' | 'jump';

type BuiltInMovementModeConfig = {
  kind: BuiltInMovementKind;
  label: string;
  speedLabel: string;
  baseId: number;
  knownIds: readonly number[];
};

const BUILTIN_MOVEMENT_MODES: readonly BuiltInMovementModeConfig[] = [
  {
    kind: 'fly',
    label: 'Flying',
    speedLabel: 'Flying Speed',
    baseId: CREATURE_FEAT_IDS.FLYING,
    knownIds: FLY_IDS,
  },
  {
    kind: 'swim',
    label: 'Swimming',
    speedLabel: 'Swimming Speed',
    baseId: CREATURE_FEAT_IDS.SWIMMING,
    knownIds: SWIM_IDS,
  },
  {
    kind: 'burrow',
    label: 'Burrow',
    speedLabel: 'Burrow Speed',
    baseId: CREATURE_FEAT_IDS.BURROW,
    knownIds: BURROW_IDS,
  },
  {
    kind: 'jump',
    label: 'Jump',
    speedLabel: 'Jump',
    baseId: CREATURE_FEAT_IDS.JUMP,
    knownIds: JUMP_IDS,
  },
] as const;

function catalogHasMovementFamily(catalog: readonly CodexCreatureFeat[], baseId: number): boolean {
  const base = String(baseId);
  return catalog.some(
    (feat) => String(feat.id) === base || String(feat.base_feat_id ?? '') === base,
  );
}

export function movementModesInCatalog(
  catalog: readonly CodexCreatureFeat[],
): readonly BuiltInMovementModeConfig[] {
  return BUILTIN_MOVEMENT_MODES.filter((mode) => catalogHasMovementFamily(catalog, mode.baseId));
}

export function readBuiltInMovementLevel(
  movementTypes: readonly string[],
  kind: BuiltInMovementKind,
): number {
  switch (kind) {
    case 'fly':
      return readFlyLevel(movementTypes);
    case 'swim':
      return readSwimLevel(movementTypes);
    case 'burrow':
      return readBurrowLevel(movementTypes);
    case 'jump':
      return readJumpLevel(movementTypes);
    default:
      return 0;
  }
}

export function movementAfterBuiltInMode(
  creature: Pick<CreatureState, 'movementTypes' | 'feats'>,
  kind: BuiltInMovementKind,
  level: number,
  catalog: readonly CodexCreatureFeat[],
): Pick<CreatureState, 'movementTypes' | 'feats'> {
  switch (kind) {
    case 'fly':
      return movementAfterFlyLevel(creature, level, catalog);
    case 'swim':
      return movementAfterSwimLevel(creature, level, catalog);
    case 'burrow':
      return movementAfterBurrowLevel(creature, level, catalog);
    case 'jump':
      return movementAfterJumpLevel(creature, level, catalog);
    default:
      return creature;
  }
}

export function movementModeCap(
  catalog: readonly CodexCreatureFeat[],
  kind: BuiltInMovementKind,
): number {
  switch (kind) {
    case 'fly':
      return flyLevelCap(catalog);
    case 'swim':
      return swimLevelCap(catalog);
    case 'burrow':
      return burrowLevelCap(catalog);
    case 'jump':
      return familyCap(catalog, CREATURE_FEAT_IDS.JUMP, JUMP_IDS);
    default:
      return 0;
  }
}

function isMovementSectionToggleRow(
  row: Pick<CodexCreatureFeat, 'id' | 'base_feat_id' | 'category' | 'mechanic'>,
): boolean {
  return (
    row.category === 'Movement' &&
    row.mechanic !== true &&
    !isCreatureMovementControlFeatId(row.id) &&
    !isMovementBoundFamilyFeat(row)
  );
}

export function movementCheckboxFeats(catalog: readonly CodexCreatureFeat[]): CodexCreatureFeat[] {
  return catalog.filter((feat) => isMovementSectionToggleRow(feat));
}

export function movementPlainToggleFeats(
  catalog: readonly CodexCreatureFeat[],
): CodexCreatureFeat[] {
  return catalog.filter((feat) => isCreatureMovementPlainToggleFeatId(feat.id));
}

export function movementToggleFeats(catalog: readonly CodexCreatureFeat[]): CodexCreatureFeat[] {
  return [...movementPlainToggleFeats(catalog), ...movementCheckboxFeats(catalog)];
}

export function movementDropdownFeats(catalog: readonly CodexCreatureFeat[]): CodexCreatureFeat[] {
  return movementToggleFeats(catalog);
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
  if (fly > 0) {
    ids.push(featIdForLevel(catalog, CREATURE_FEAT_IDS.FLYING, fly, FLY_IDS));
  }
  const swim = readSwimLevel(movementTypes);
  if (swim > 0) {
    ids.push(featIdForLevel(catalog, CREATURE_FEAT_IDS.SWIMMING, swim, SWIM_IDS));
  }
  const burrow = readBurrowLevel(movementTypes);
  if (burrow > 0) {
    ids.push(featIdForLevel(catalog, CREATURE_FEAT_IDS.BURROW, burrow, BURROW_IDS));
  }
  const jump = readJumpLevel(movementTypes);
  if (jump > 0) {
    ids.push(featIdForLevel(catalog, CREATURE_FEAT_IDS.JUMP, jump, JUMP_IDS));
  }
  return ids;
}

export function movementSectionPointTotal(
  creature: Pick<CreatureState, 'feats' | 'movementTypes'>,
  catalog: readonly CodexCreatureFeat[],
): number {
  const sectionToggleIds = new Set(movementToggleFeats(catalog).map((feat) => String(feat.id)));
  const byId = new Map(catalog.map((feat) => [String(feat.id), feat]));
  const onCreature = new Set(creature.feats.map((feat) => String(feat.id)));
  let sum = 0;
  for (const feat of creature.feats) {
    const id = String(feat.id);
    if (feat.featSourceType && feat.featSourceType !== 'creature') continue;
    const row = byId.get(id) ?? null;
    if (!isCreatureMovementEffectFeat(feat, row) && !sectionToggleIds.has(id)) continue;
    const points = feat.points ?? row?.points ?? 0;
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

/** Flying, swimming, burrow, and jump for the published block. Labels match the creator. */
export function movementTravelLines(
  movementTypes: readonly string[],
  walkSpeed: number,
  catalog?: readonly CodexCreatureFeat[],
): MovementSpeedLine[] {
  const lines: MovementSpeedLine[] = [];
  const fly = readFlyLevel(movementTypes);
  if (fly > 0) {
    lines.push({
      label: 'Flying Speed',
      value: formatMovementSpeed(movementTravelSpeedCreatorDisplay(walkSpeed, fly)),
    });
  }
  const swim = readSwimLevel(movementTypes);
  if (swim > 0) {
    lines.push({
      label: 'Swimming Speed',
      value: formatMovementSpeed(movementTravelSpeedCreatorDisplay(walkSpeed, swim)),
    });
  }
  const burrow = readBurrowLevel(movementTypes);
  if (burrow > 0) {
    lines.push({
      label: 'Burrow Speed',
      value: formatMovementSpeed(movementTravelSpeedCreatorDisplay(walkSpeed, burrow)),
    });
  }
  const jump = readJumpLevel(movementTypes);
  if (jump > 0 && catalog) {
    const description = movementModeDescription(catalog, CREATURE_FEAT_IDS.JUMP, jump, JUMP_IDS);
    if (description) {
      lines.push({ label: 'Jump', value: description });
    }
  }
  return lines;
}

export { builtInSenseSummaryLines } from './creature-senses';

export function isCreatureCreatorHiddenFeat(
  feat: Parameters<typeof isCreatureMovementEffectFeat>[0] & {
    boundControl?: boolean | undefined;
  },
  catalogRow?: Pick<CodexCreatureFeat, 'id' | 'base_feat_id' | 'category' | 'mechanic'> | null,
): boolean {
  if (feat.featSourceType && feat.featSourceType !== 'creature') return false;
  if (feat.boundControl) return true;
  if (isCreatureMovementEffectFeat(feat, catalogRow)) return true;
  if (isCreatureSensesEffectFeat(feat, catalogRow ?? null)) return true;
  if (catalogRow && isMovementSectionToggleRow(catalogRow)) return true;
  if (catalogRow && isCreatureMovementPlainToggleFeatId(catalogRow.id)) return true;
  return false;
}

export type MovementToggleLine = { id: string; name: string; description?: string };

/** Movement checkboxes and plain toggles stay off the feat list and show here by saved name and description. */
export function movementToggleLines(
  feats: readonly {
    id?: string | number | undefined;
    name?: string | undefined;
    description?: string | undefined;
  }[],
  catalogById?: ReadonlyMap<
    string,
    Pick<
      CodexCreatureFeat,
      'id' | 'base_feat_id' | 'category' | 'mechanic' | 'name' | 'description'
    >
  >,
): MovementToggleLine[] {
  const lines: MovementToggleLine[] = [];
  for (const feat of feats) {
    if (feat.id == null) continue;
    const id = String(feat.id);
    const row = catalogById?.get(id);
    const plainToggle = isCreatureMovementPlainToggleFeatId(id);
    const checkboxToggle = row ? isMovementSectionToggleRow(row) : false;
    if (!plainToggle && !checkboxToggle) continue;
    const name = feat.name?.trim() || row?.name?.trim();
    if (!name) continue;
    const line: MovementToggleLine = { id, name };
    const description = feat.description?.trim() || row?.description?.trim();
    if (description) line.description = description;
    lines.push(line);
  }
  return lines;
}
