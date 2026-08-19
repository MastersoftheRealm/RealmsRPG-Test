import type {
  ArchetypePathData,
  ArchetypePathRecommendations,
  PathGuidanceAudience,
  PathGuidanceGroup,
  PathItemRecommendation,
  PathLoadout,
} from '@/types/archetype';
import type { AbilityName } from '@/types/abilities';
import { normalizeId } from '@/lib/utils/normalize-id';

export type { PathGuidanceAudience };

export function isPathGuidanceAudience(value: unknown): value is PathGuidanceAudience {
  return value === 'character' || value === 'archetype';
}

/**
 * Resolve feat-group audience. Prefers explicit `audience`; legacy rows without it
 * use the title heuristic (TASK-514 / ADR-0004).
 */
export function resolvePathGuidanceAudience(
  group: Pick<PathGuidanceGroup, 'title' | 'audience'>,
): PathGuidanceAudience {
  if (isPathGuidanceAudience(group.audience)) return group.audience;
  return group.title.toLowerCase().includes('character') ? 'character' : 'archetype';
}

/** Feat-bearing groups for a guided step audience. */
export function filterFeatGuidanceGroups(
  groups: PathGuidanceGroup[] | undefined,
  audience: PathGuidanceAudience,
): PathGuidanceGroup[] {
  return (groups ?? []).filter(
    (g) => (g.feats?.length ?? 0) > 0 && resolvePathGuidanceAudience(g) === audience,
  );
}

/** Union of feat ids across guidance groups that designate feats. */
export function unionFeatIdsFromGuidanceGroups(groups: PathGuidanceGroup[] | undefined): string[] {
  const ids = new Set<string>();
  for (const group of groups ?? []) {
    for (const id of group.feats ?? []) {
      const key = String(id).trim();
      if (key) ids.add(key);
    }
  }
  return Array.from(ids);
}

/**
 * Replace feat-bearing groups while preserving non-feat groups (powers, techniques, etc.).
 */
export function mergeFeatGuidanceGroups(
  existing: PathGuidanceGroup[] | undefined,
  featGroups: PathGuidanceGroup[],
): PathGuidanceGroup[] {
  const nonFeat = (existing ?? []).filter((g) => !g.feats?.length);
  return [...featGroups, ...nonFeat];
}

/** Seed a single archetype feat group when legacy paths only have flat `level1.feats`. */
export function seedFeatGroupsFromFlatFeats(
  flatFeats: string[],
  existingGroups?: PathGuidanceGroup[],
): PathGuidanceGroup[] {
  const featGroups = (existingGroups ?? []).filter((g) => (g.feats?.length ?? 0) > 0);
  if (featGroups.length > 0) return existingGroups ?? [];
  const ids = flatFeats.map(String).filter(Boolean);
  if (ids.length === 0) return existingGroups ?? [];
  const seeded: PathGuidanceGroup = {
    id: `seeded-feats-${Date.now().toString(36)}`,
    title: 'Recommended feats',
    audience: 'archetype',
    feats: ids,
  };
  return mergeFeatGuidanceGroups(existingGroups, [seeded]);
}

const ABILITY_NAMES: AbilityName[] = [
  'strength',
  'vitality',
  'agility',
  'acuity',
  'intelligence',
  'charisma',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Coerce JSON string or object to a plain record (admin/raw path_data editing). */
export function coerceJsonRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return isRecord(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return isRecord(value) ? value : undefined;
}

export type ParseJsonFieldResult = { ok: true; value: unknown } | { ok: false; error: string };

/**
 * Safe JSON parse for optional admin fields. Empty/whitespace string → `{ ok: true, value: null }`.
 * Invalid JSON → `{ ok: false, error: "<label> must be valid JSON." }`.
 */
export function parseOptionalJsonField(raw: string, label: string): ParseJsonFieldResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: null };
  try {
    return { ok: true, value: JSON.parse(trimmed) as unknown };
  } catch {
    return { ok: false, error: `${label} must be valid JSON.` };
  }
}

function toStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

/** Parse "id" or "id:qty" strings into { id, quantity } (qty default 1). */
export function parseIdQuantityStrings(arr: string[]): PathItemRecommendation[] {
  return arr
    .map((s) => {
      const colon = s.indexOf(':');
      if (colon < 0) return { id: s.trim(), quantity: 1 };
      const id = s.slice(0, colon).trim();
      const q = parseInt(s.slice(colon + 1).trim(), 10);
      return { id, quantity: Number.isFinite(q) && q >= 1 ? q : 1 };
    })
    .filter((e) => e.id.length > 0);
}

/** Serialize { id, quantity } entries into "id" or "id:qty" strings (qty>1 keeps the suffix). */
export function serializeIdQuantityStrings(entries: PathItemRecommendation[]): string[] {
  return entries.map((e) => (e.quantity > 1 ? `${e.id}:${e.quantity}` : e.id));
}

function parseLevel(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Parse a recommended-abilities map (`{ strength: 3, ... }`) from JSON/object input.
 * Ignores unknown keys and non-finite values; returns `undefined` when nothing valid remains.
 */
export function parseRecommendedAbilities(
  value: unknown,
): Partial<Record<AbilityName, number>> | undefined {
  if (!isRecord(value)) return undefined;
  const result: Partial<Record<AbilityName, number>> = {};
  for (const ability of ABILITY_NAMES) {
    const raw = value[ability];
    if (raw == null) continue;
    const num = Number(raw);
    if (Number.isFinite(num)) result[ability] = num;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function parseIdQuantityObjects(value: unknown): PathItemRecommendation[] {
  if (Array.isArray(value)) {
    const fromObjects = value
      .map((entry) => {
        if (!isRecord(entry)) return null;
        const id = entry.id != null ? String(entry.id).trim() : '';
        if (!id) return null;
        const q = entry.quantity != null ? Number(entry.quantity) : 1;
        return { id, quantity: Number.isFinite(q) && q >= 1 ? q : 1 };
      })
      .filter((entry): entry is PathItemRecommendation => entry !== null);
    if (fromObjects.length > 0) return fromObjects;
  }
  return parseIdQuantityStrings(toStringArray(value));
}

function parseLoadouts(value: unknown): PathLoadout[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const loadouts = value
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const id =
        typeof entry.id === 'string'
          ? entry.id
          : typeof entry.title === 'string'
            ? entry.title
            : null;
      const title = typeof entry.title === 'string' ? entry.title : id;
      if (!id || !title) return null;
      const loadout: PathLoadout = {
        id,
        title,
        ...(typeof entry.why === 'string' ? { why: entry.why } : {}),
        armaments: parseIdQuantityObjects(entry.armaments),
        armor: parseIdQuantityObjects(entry.armor),
        equipment: parseIdQuantityObjects(entry.equipment),
      };
      return loadout;
    })
    .filter((l): l is PathLoadout => l !== null);
  return loadouts.length > 0 ? loadouts : undefined;
}

export type Level1ArmorStep = 'required' | 'optional' | 'none';

export interface Level1LoadoutsField {
  loadouts?: PathLoadout[] | undefined;
  armorStep?: Level1ArmorStep | undefined;
  sharedEquipment?: PathItemRecommendation[] | undefined;
}

function parseArmorStep(value: unknown): Level1ArmorStep | undefined {
  return value === 'required' || value === 'optional' || value === 'none' ? value : undefined;
}

/** Parse `level1_loadouts` column — metadata `{ armorStep?, sharedEquipment? }` or legacy kit array. */
export function parseLevel1LoadoutsField(value: unknown): Level1LoadoutsField {
  if (value == null) return {};
  if (Array.isArray(value)) {
    // Legacy kit arrays (cleared in live DB — TASK-442). Still parsed for stale offline JSON.
    return { loadouts: parseLoadouts(value) };
  }
  if (!isRecord(value)) return {};
  const kitsRaw = value.kits ?? value.loadouts;
  const shared = parseIdQuantityObjects(value.sharedEquipment);
  return {
    loadouts: parseLoadouts(kitsRaw),
    armorStep: parseArmorStep(value.armorStep),
    sharedEquipment: shared.length > 0 ? shared : undefined,
  };
}

/** Serialize for `level1_loadouts` — prefer metadata-only; omit empty kit arrays. */
export function serializeLevel1LoadoutsField(field: Level1LoadoutsField): unknown | null {
  const { armorStep, sharedEquipment } = field;
  // Do not persist kit arrays (TASK-442). Metadata only.
  const hasMeta = Boolean(armorStep) || (sharedEquipment?.length ?? 0) > 0;
  if (!hasMeta) return null;
  return {
    ...(armorStep ? { armorStep } : {}),
    ...(sharedEquipment?.length ? { sharedEquipment } : {}),
  };
}

function parseGuidanceGroups(value: unknown): PathGuidanceGroup[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const groups = value
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const id =
        typeof entry.id === 'string'
          ? entry.id
          : typeof entry.title === 'string'
            ? entry.title
            : null;
      const title = typeof entry.title === 'string' ? entry.title : id;
      if (!id || !title) return null;
      const feats = toStringArray(entry.feats);
      const explicitAudience = isPathGuidanceAudience(entry.audience) ? entry.audience : undefined;
      // Backfill audience on feat groups so consumers never need title heuristics.
      const audience =
        explicitAudience ??
        (feats.length > 0
          ? resolvePathGuidanceAudience({ title, audience: undefined })
          : undefined);
      const group: PathGuidanceGroup = {
        id,
        title,
        ...(typeof entry.why === 'string' ? { why: entry.why } : {}),
        ...(audience ? { audience } : {}),
        feats,
        powers: toStringArray(entry.powers),
        innatePowers: toStringArray(entry.innatePowers ?? entry.innate_powers),
        techniques: toStringArray(entry.techniques),
        armaments: toStringArray(entry.armaments),
        equipment: toStringArray(entry.equipment),
      };
      return group;
    })
    .filter((g): g is PathGuidanceGroup => g !== null);
  return groups.length > 0 ? groups : undefined;
}

export function parseArchetypePathData(value: unknown): ArchetypePathData | undefined {
  if (!value) return undefined;

  let raw: unknown = value;
  if (typeof value === 'string') {
    try {
      raw = JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  if (!isRecord(raw)) return undefined;

  const level1Raw = isRecord(raw.level1) ? raw.level1 : undefined;
  const levelsRaw = Array.isArray(raw.levels) ? raw.levels : [];

  const level1: ArchetypePathData['level1'] | undefined = level1Raw
    ? (() => {
        const armamentsStr = toStringArray(level1Raw.armaments);
        const equipmentStr = toStringArray(level1Raw.equipment);
        const loadoutsField = parseLevel1LoadoutsField(level1Raw.loadouts);
        const sharedFromRaw = parseIdQuantityObjects(level1Raw.sharedEquipment);
        return {
          feats: toStringArray(level1Raw.feats),
          skills: toStringArray(level1Raw.skills),
          powers: toStringArray(level1Raw.powers),
          innatePowers: toStringArray(level1Raw.innatePowers ?? level1Raw.innate_powers),
          techniques: toStringArray(level1Raw.techniques),
          armaments: armamentsStr,
          equipment: equipmentStr,
          armamentRecommendations: parseIdQuantityStrings(armamentsStr),
          equipmentRecommendations: parseIdQuantityStrings(equipmentStr),
          recommendUnarmedProwess: level1Raw.recommendUnarmedProwess === true,
          armorStep: parseArmorStep(level1Raw.armorStep) ?? loadoutsField.armorStep,
          sharedEquipment: sharedFromRaw.length > 0 ? sharedFromRaw : loadoutsField.sharedEquipment,
          removeFeats: toStringArray(level1Raw.removeFeats),
          removePowers: toStringArray(level1Raw.removePowers),
          removeTechniques: toStringArray(level1Raw.removeTechniques),
          removeArmaments: toStringArray(level1Raw.removeArmaments),
          notes: typeof level1Raw.notes === 'string' ? level1Raw.notes : undefined,
          guidance_groups: parseGuidanceGroups(level1Raw.guidance_groups),
          recommended_abilities: parseRecommendedAbilities(level1Raw.recommended_abilities),
          loadouts: loadoutsField.loadouts,
          proficiency: isRecord(level1Raw.proficiency)
            ? {
                power:
                  level1Raw.proficiency.power != null
                    ? Number(level1Raw.proficiency.power)
                    : undefined,
                martial:
                  level1Raw.proficiency.martial != null
                    ? Number(level1Raw.proficiency.martial)
                    : undefined,
              }
            : undefined,
        };
      })()
    : undefined;

  const levels = levelsRaw
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const level = parseLevel(entry.level);
      if (level == null) return null;
      return {
        level,
        feats: toStringArray(entry.feats),
        skills: toStringArray(entry.skills),
        powers: toStringArray(entry.powers),
        techniques: toStringArray(entry.techniques),
        armaments: toStringArray(entry.armaments),
        equipment: toStringArray(entry.equipment),
        removeFeats: toStringArray(entry.removeFeats),
        removePowers: toStringArray(entry.removePowers),
        removeTechniques: toStringArray(entry.removeTechniques),
        removeArmaments: toStringArray(entry.removeArmaments),
        notes: typeof entry.notes === 'string' ? entry.notes : undefined,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => a.level - b.level);

  if (!level1 && levels.length === 0) return undefined;
  return { level1, levels };
}

export function getPathRecommendationsForLevel(
  archetype: { path_data?: ArchetypePathData | undefined } | undefined,
  level: number,
): ArchetypePathRecommendations | undefined {
  if (!archetype?.path_data) return undefined;
  if (level <= 1) return archetype.path_data.level1;
  return archetype.path_data.levels?.find((entry) => entry.level === level);
}

/** Level 1 has at least one add recommendation (feat/skill/power/technique/armament/equipment). */
export function pathLevel1HasAddRecommendations(
  level1: ArchetypePathRecommendations | undefined,
): boolean {
  if (!level1) return false;
  return Boolean(
    level1.feats?.length ||
    level1.skills?.length ||
    level1.powers?.length ||
    level1.innatePowers?.length ||
    level1.techniques?.length ||
    level1.armaments?.length ||
    level1.equipment?.length,
  );
}

/** Paths shown in character creator picker, public codex list, and path switcher. */
export function pathHasPlayerVisibleLevel1(pathData: ArchetypePathData | undefined): boolean {
  return pathLevel1HasAddRecommendations(pathData?.level1);
}

/** Level 1 has notes, remove lists, or unarmed prowess but no add recommendations. */
export function pathLevel1HasNonPickerContent(
  level1: ArchetypePathRecommendations | undefined,
): boolean {
  if (!level1) return false;
  return Boolean(
    level1.notes?.trim() ||
    level1.recommendUnarmedProwess ||
    level1.removeFeats?.length ||
    level1.removePowers?.length ||
    level1.removeTechniques?.length ||
    level1.removeArmaments?.length,
  );
}

/** Admin-only paths: saved in codex but hidden from player path pickers. */
export function pathHiddenFromPlayerPicker(pathData: ArchetypePathData | undefined): boolean {
  return pathLevel1HasNonPickerContent(pathData?.level1) && !pathHasPlayerVisibleLevel1(pathData);
}

/** Entity families a path can recommend (ADR-0014). */
export type PathRecommendationKind =
  | 'feats'
  | 'skills'
  | 'powers'
  | 'innatePowers'
  | 'techniques'
  | 'armaments'
  | 'equipment';

/** Kinds that guidance groups can also designate (groups have no skills list). */
const GUIDANCE_GROUP_RECOMMENDATION_KINDS: PathRecommendationKind[] = [
  'feats',
  'powers',
  'innatePowers',
  'techniques',
  'armaments',
  'equipment',
];

/** Kinds stored as `id` or `id:qty` refs. */
const QUANTITY_REF_KINDS: PathRecommendationKind[] = ['armaments', 'equipment'];

function recommendationRefs(
  source: ArchetypePathRecommendations | PathGuidanceGroup | undefined,
  kind: PathRecommendationKind,
): string[] {
  const raw = (source as Record<string, unknown> | undefined)?.[kind];
  return Array.isArray(raw) ? raw.map(String) : [];
}

/**
 * Union of recommended entity refs for one kind across every authored path level — ADR-0014.
 *
 * Browse/list filters read this. Guided L1 cards still use `level1.feats` /
 * `unionFeatIdsFromGuidanceGroups` until TASK-753. `remove*` lists are not recommendations.
 * Quantity refs (`sword:2`) collapse to the id via `parseIdQuantityStrings`.
 */
export function collectPathRecommendedIds(
  pathData: ArchetypePathData | undefined,
  kind: PathRecommendationKind,
): string[] {
  if (!pathData) return [];

  const stripQuantity = QUANTITY_REF_KINDS.includes(kind);
  const refs: string[] = [];
  for (const level of [pathData.level1, ...(pathData.levels ?? [])]) {
    if (!level) continue;
    refs.push(...recommendationRefs(level, kind));
  }
  // Parser only attaches `guidance_groups` on level 1 — do not walk later `levels[]` for them.
  if (GUIDANCE_GROUP_RECOMMENDATION_KINDS.includes(kind)) {
    for (const group of pathData.level1?.guidance_groups ?? []) {
      refs.push(...recommendationRefs(group, kind));
    }
  }

  const ids = stripQuantity ? parseIdQuantityStrings(refs).map((entry) => entry.id) : refs;

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const id of ids) {
    const trimmed = id.trim();
    const key = normalizeId(trimmed);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(trimmed);
  }
  return unique;
}
