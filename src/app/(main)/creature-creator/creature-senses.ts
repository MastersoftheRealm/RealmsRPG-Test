/**
 * Creature Senses controls.
 * Tiered mechanic-true families bind to the codex. Other Senses rows are toggles.
 * Saved sense names and level tokens load creatures written before this section.
 */

import { CREATURE_FEAT_IDS } from '@/lib/id-constants';
import { getFeatLevel } from '@/lib/leveled-feats';
import type { CreatureFeat as CodexCreatureFeat } from '@/hooks';
import { codexCreatureFeatToCreatureFeat } from './creature-feat-utils';
import type { CreatureState } from './creature-creator-types';
import type { CreatureFeat } from './transformers';
import { formatMovementPointCost } from './creature-movement';

const DARKVISION_NAMES = ['Darkvision', 'Darkvision II', 'Darkvision III'] as const;
const BLINDSENSE_NAMES = [
  'Blindsense',
  'Blindsense II',
  'Blindsense III',
  'Blindsense IV',
] as const;

const DARKVISION_IDS = [
  CREATURE_FEAT_IDS.DARKVISION,
  CREATURE_FEAT_IDS.DARKVISION_II,
  CREATURE_FEAT_IDS.DARKVISION_III,
] as const;
const BLINDSENSE_IDS = [
  CREATURE_FEAT_IDS.BLINDSENSE,
  CREATURE_FEAT_IDS.BLINDSENSE_II,
  CREATURE_FEAT_IDS.BLINDSENSE_III,
  CREATURE_FEAT_IDS.BLINDSENSE_IV,
] as const;
const LIFESENSE_IDS = [
  CREATURE_FEAT_IDS.LIFESENSE,
  CREATURE_FEAT_IDS.LIFESENSE_II,
  CREATURE_FEAT_IDS.LIFESENSE_III,
  CREATURE_FEAT_IDS.LIFESENSE_IV,
] as const;
const EARTHSENSE_IDS = [
  CREATURE_FEAT_IDS.EARTHSENSE,
  CREATURE_FEAT_IDS.EARTHSENSE_II,
  CREATURE_FEAT_IDS.EARTHSENSE_III,
  CREATURE_FEAT_IDS.EARTHSENSE_IV,
] as const;
const LIQUIDSENSE_IDS = [
  CREATURE_FEAT_IDS.LIQUIDSENSE,
  CREATURE_FEAT_IDS.LIQUIDSENSE_II,
  CREATURE_FEAT_IDS.LIQUIDSENSE_III,
  CREATURE_FEAT_IDS.LIQUIDSENSE_IV,
] as const;

const DARKVISION_TOKEN = /^darkvision:(\d+)$/;
const BLINDSENSE_TOKEN = /^blindsense:(\d+)$/;
const LIFESENSE_TOKEN = /^lifesense:(\d+)$/;
const EARTHSENSE_TOKEN = /^earthsense:(\d+)$/;
const LIQUIDSENSE_TOKEN = /^liquidsense:(\d+)$/;

type BuiltInSenseKind = 'darkvision' | 'blindsense' | 'lifesense' | 'earthsense' | 'liquidsense';

type SenseFamilyConfig = {
  kind: BuiltInSenseKind;
  label: string;
  baseId: number;
  knownIds: readonly number[];
  legacyNames: readonly string[];
  token: RegExp;
  tokenPrefix: string;
  useLegacyNames: boolean;
};

const BUILTIN_SENSE_FAMILIES: readonly SenseFamilyConfig[] = [
  {
    kind: 'darkvision',
    label: 'Darkvision',
    baseId: CREATURE_FEAT_IDS.DARKVISION,
    knownIds: DARKVISION_IDS,
    legacyNames: DARKVISION_NAMES,
    token: DARKVISION_TOKEN,
    tokenPrefix: 'darkvision',
    useLegacyNames: true,
  },
  {
    kind: 'blindsense',
    label: 'Blindsense',
    baseId: CREATURE_FEAT_IDS.BLINDSENSE,
    knownIds: BLINDSENSE_IDS,
    legacyNames: BLINDSENSE_NAMES,
    token: BLINDSENSE_TOKEN,
    tokenPrefix: 'blindsense',
    useLegacyNames: true,
  },
  {
    kind: 'lifesense',
    label: 'Lifesense',
    baseId: CREATURE_FEAT_IDS.LIFESENSE,
    knownIds: LIFESENSE_IDS,
    legacyNames: [],
    token: LIFESENSE_TOKEN,
    tokenPrefix: 'lifesense',
    useLegacyNames: false,
  },
  {
    kind: 'earthsense',
    label: 'Earthsense',
    baseId: CREATURE_FEAT_IDS.EARTHSENSE,
    knownIds: EARTHSENSE_IDS,
    legacyNames: [],
    token: EARTHSENSE_TOKEN,
    tokenPrefix: 'earthsense',
    useLegacyNames: false,
  },
  {
    kind: 'liquidsense',
    label: 'Liquidsense',
    baseId: CREATURE_FEAT_IDS.LIQUIDSENSE,
    knownIds: LIQUIDSENSE_IDS,
    legacyNames: [],
    token: LIQUIDSENSE_TOKEN,
    tokenPrefix: 'liquidsense',
    useLegacyNames: false,
  },
] as const;

const SENSE_FAMILY_BY_KIND = new Map(BUILTIN_SENSE_FAMILIES.map((family) => [family.kind, family]));

const SENSE_FAMILY_ROOTS = new Set<string>(
  BUILTIN_SENSE_FAMILIES.map((family) => String(family.baseId)),
);

const LEGACY_SENSE_NAMES = new Set<string>([
  ...DARKVISION_NAMES,
  ...BLINDSENSE_NAMES,
  ...BUILTIN_SENSE_FAMILIES.flatMap((family) => (family.useLegacyNames ? family.legacyNames : [])),
]);

function idString(id: number): string {
  return String(id);
}

const CONTROL_IDS = new Set<string>(
  BUILTIN_SENSE_FAMILIES.flatMap((family) => family.knownIds.map(idString)),
);

export function isCreatureSensesControlFeatId(id: string | number): boolean {
  return CONTROL_IDS.has(String(id));
}

function isSensesBoundFamilyFeat(feat: {
  id: string | number;
  base_feat_id?: string | number | null | undefined;
}): boolean {
  const id = String(feat.id);
  const base =
    feat.base_feat_id == null || feat.base_feat_id === '' ? '' : String(feat.base_feat_id);
  return SENSE_FAMILY_ROOTS.has(id) || SENSE_FAMILY_ROOTS.has(base);
}

/** Hidden from the feat list: control ids and bound Senses family rows. */
export function isCreatureSensesEffectFeat(
  feat: {
    id?: string | number | undefined;
    base_feat_id?: string | number | null | undefined;
    boundControl?: boolean | undefined;
  },
  catalogRow?: Pick<CodexCreatureFeat, 'id' | 'base_feat_id'> | null,
): boolean {
  if (feat.boundControl) return true;
  if (feat.id == null) return false;
  if (isCreatureSensesControlFeatId(feat.id)) return true;
  if (catalogRow && isSensesBoundFamilyFeat(catalogRow)) return true;
  if (
    feat.base_feat_id != null &&
    feat.base_feat_id !== '' &&
    isSensesBoundFamilyFeat({ id: String(feat.id), base_feat_id: feat.base_feat_id })
  ) {
    return true;
  }
  return false;
}

export { formatMovementPointCost as formatSensesPointCost };

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

export function senseFamilyCap(
  catalog: readonly CodexCreatureFeat[],
  kind: BuiltInSenseKind,
): number {
  const family = SENSE_FAMILY_BY_KIND.get(kind);
  if (!family) return 0;
  return familyCap(catalog, family.baseId, family.knownIds);
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

function readFamilyLevel(
  senses: readonly string[],
  legacyNames: readonly string[],
  token: RegExp,
): number {
  let level = 0;
  for (const name of senses) {
    const index = legacyNames.indexOf(name);
    if (index >= 0) level = Math.max(level, index + 1);
    const parsed = token.exec(name);
    if (parsed) level = Math.max(level, Number(parsed[1]));
  }
  return level;
}

function senseStorageToken(family: SenseFamilyConfig, level: number): string | null {
  if (level <= 0) return null;
  if (family.useLegacyNames) {
    return family.legacyNames[level - 1] ?? `${family.tokenPrefix}:${level}`;
  }
  return `${family.tokenPrefix}:${level}`;
}

function stripFamilyMarkers(senses: readonly string[], family: SenseFamilyConfig): string[] {
  const legacy = new Set<string>(family.legacyNames);
  return senses.filter((name) => !legacy.has(name) && !family.token.test(name));
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

export function readBuiltInSenseLevel(senses: readonly string[], kind: BuiltInSenseKind): number {
  const family = SENSE_FAMILY_BY_KIND.get(kind);
  if (!family) return 0;
  return readFamilyLevel(senses, family.legacyNames, family.token);
}

export function readDarkvisionLevel(senses: readonly string[]): number {
  return readBuiltInSenseLevel(senses, 'darkvision');
}

export function readLifesenseLevel(senses: readonly string[]): number {
  return readBuiltInSenseLevel(senses, 'lifesense');
}

export function sensesAfterBuiltInLevel(
  creature: Pick<CreatureState, 'senses' | 'feats'>,
  kind: BuiltInSenseKind,
  level: number,
  catalog: readonly CodexCreatureFeat[],
): Pick<CreatureState, 'senses' | 'feats'> {
  const family = SENSE_FAMILY_BY_KIND.get(kind);
  if (!family) return creature;
  const cap = familyCap(catalog, family.baseId, family.knownIds);
  const nextLevel = Math.max(0, Math.min(cap, level));
  const familyIds = modeFamilyIdSet(catalog, family.baseId, family.knownIds);
  let senses = stripFamilyMarkers(creature.senses, family);
  let feats = withoutIds(creature.feats, familyIds);
  if (nextLevel > 0) {
    const token = senseStorageToken(family, nextLevel);
    if (token) senses = [...senses, token];
    feats = withFeat(
      feats,
      catalog,
      featIdForLevel(catalog, family.baseId, nextLevel, family.knownIds),
    );
  }
  return { senses, feats };
}

export function sensesAfterDarkvisionLevel(
  creature: Pick<CreatureState, 'senses' | 'feats'>,
  level: number,
  catalog: readonly CodexCreatureFeat[],
): Pick<CreatureState, 'senses' | 'feats'> {
  return sensesAfterBuiltInLevel(creature, 'darkvision', level, catalog);
}

export function sensesAfterLifesenseLevel(
  creature: Pick<CreatureState, 'senses' | 'feats'>,
  level: number,
  catalog: readonly CodexCreatureFeat[],
): Pick<CreatureState, 'senses' | 'feats'> {
  return sensesAfterBuiltInLevel(creature, 'lifesense', level, catalog);
}

export function sensesToggleFeats(catalog: readonly CodexCreatureFeat[]): CodexCreatureFeat[] {
  return catalog.filter(
    (feat) =>
      feat.category === 'Senses' &&
      feat.mechanic !== true &&
      !isCreatureSensesControlFeatId(feat.id) &&
      !isSensesBoundFamilyFeat(feat),
  );
}

export function sensesControlFeatIdsFromNames(
  senses: readonly string[],
  catalog: readonly CodexCreatureFeat[],
): string[] {
  const ids: string[] = [];
  for (const family of BUILTIN_SENSE_FAMILIES) {
    const level = readBuiltInSenseLevel(senses, family.kind);
    if (level > 0) {
      ids.push(featIdForLevel(catalog, family.baseId, level, family.knownIds));
    }
  }
  return ids;
}

function activeSenseControlFeat(
  senses: readonly string[],
  kind: BuiltInSenseKind,
  catalog: readonly CodexCreatureFeat[],
): CodexCreatureFeat | undefined {
  const family = SENSE_FAMILY_BY_KIND.get(kind);
  if (!family) return undefined;
  const level = readBuiltInSenseLevel(senses, kind);
  if (level <= 0) return undefined;
  const id = featIdForLevel(catalog, family.baseId, level, family.knownIds);
  return catalog.find((feat) => String(feat.id) === id);
}

export function senseControlDisplayValue(
  senses: readonly string[],
  kind: BuiltInSenseKind,
  catalog: readonly CodexCreatureFeat[],
): string {
  const row = activeSenseControlFeat(senses, kind, catalog);
  if (!row) return '—';
  const text = row.description?.trim() ?? '';
  return text.length > 0 ? text : row.name;
}

export function sensesSectionPointTotal(
  creature: Pick<CreatureState, 'feats' | 'senses'>,
  catalog: readonly CodexCreatureFeat[],
): number {
  const toggleIds = new Set(sensesToggleFeats(catalog).map((feat) => String(feat.id)));
  const byId = new Map(catalog.map((feat) => [String(feat.id), feat]));
  const onCreature = new Set(creature.feats.map((feat) => String(feat.id)));
  let sum = 0;
  for (const feat of creature.feats) {
    const id = String(feat.id);
    if (!isCreatureSensesEffectFeat(feat, byId.get(id) ?? null) && !toggleIds.has(id)) continue;
    const points = feat.points ?? byId.get(id)?.points ?? 0;
    if (Number.isFinite(points)) sum += points;
  }
  for (const id of sensesControlFeatIdsFromNames(creature.senses, catalog)) {
    if (onCreature.has(id)) continue;
    const points = byId.get(id)?.points ?? 0;
    if (Number.isFinite(points)) sum += points;
  }
  return sum;
}

export function toggleSenseFeat(
  creature: Pick<CreatureState, 'feats'>,
  feat: CodexCreatureFeat,
  on: boolean,
): CreatureFeat[] {
  const id = String(feat.id);
  const without = creature.feats.filter((row) => String(row.id) !== id);
  if (!on) return without;
  return [...without, codexCreatureFeatToCreatureFeat(feat)];
}

export function builtInSenseSummaryLines(
  creature: Pick<CreatureState, 'senses'>,
  catalog: readonly CodexCreatureFeat[],
): string[] {
  const lines: string[] = [];
  for (const family of BUILTIN_SENSE_FAMILIES) {
    if (readBuiltInSenseLevel(creature.senses, family.kind) <= 0) continue;
    const label =
      activeSenseControlFeat(creature.senses, family.kind, catalog)?.name ?? family.label;
    lines.push(`${label}: ${senseControlDisplayValue(creature.senses, family.kind, catalog)}`);
  }
  return lines;
}

function isStoredBuiltInSenseMarker(name: string): boolean {
  if (LEGACY_SENSE_NAMES.has(name)) return true;
  return BUILTIN_SENSE_FAMILIES.some((family) => family.token.test(name));
}

export function migrateLegacySenseNames(
  creature: CreatureState,
  catalog: readonly CodexCreatureFeat[],
): CreatureState {
  if (creature.senses.length === 0) return creature;
  const senses: string[] = [];
  let feats = [...creature.feats];
  for (const name of creature.senses) {
    if (isStoredBuiltInSenseMarker(name)) {
      senses.push(name);
      continue;
    }
    const row = catalog.find((feat) => feat.name === name);
    if (row && row.category === 'Senses' && !isCreatureSensesControlFeatId(row.id)) {
      if (!feats.some((feat) => String(feat.id) === String(row.id))) {
        feats = [...feats, codexCreatureFeatToCreatureFeat(row)];
      }
      continue;
    }
    senses.push(name);
  }
  let next: CreatureState = { ...creature, senses, feats };
  for (const family of BUILTIN_SENSE_FAMILIES) {
    const level = readBuiltInSenseLevel(next.senses, family.kind);
    if (level > 0) {
      next = { ...next, ...sensesAfterBuiltInLevel(next, family.kind, level, catalog) };
    }
  }
  return next;
}

export const builtInSenseFamilies = BUILTIN_SENSE_FAMILIES;

export function sensesAfterBuiltInHandler(
  kind: BuiltInSenseKind,
): (
  creature: Pick<CreatureState, 'senses' | 'feats'>,
  level: number,
  catalog: readonly CodexCreatureFeat[],
) => Pick<CreatureState, 'senses' | 'feats'> {
  return (creature, level, catalog) => sensesAfterBuiltInLevel(creature, kind, level, catalog);
}
