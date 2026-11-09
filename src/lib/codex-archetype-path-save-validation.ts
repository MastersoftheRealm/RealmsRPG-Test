/**
 * Server-side validation for `saveArchetypeWithPath` (admin path workspace save).
 * Reuses the codex persisted write contract used by `createCodexDoc` / `updateCodexDoc`.
 */

import type {
  ArchetypeLevelPayload,
  SaveArchetypeWithPathInput,
} from '@/app/(main)/admin/codex/codex-archetype-write';
import type { ItemPropertyTpRow } from '@/lib/calculators/item-calc';
import { CODEX_DESC_MAX_LENGTH } from '@/lib/codex-columnar-keys';
import { selectPowerParts } from '@/lib/codex/part-type';
import {
  mapCodexEquipment,
  mapCodexPart,
  mapCodexProperty,
  mapCodexSkill,
} from '@/lib/codex/row-map';
import {
  codexAdminCamelBodyShapeError,
  codexPersistedFieldShapeError,
} from '@/lib/codex-persisted-contract';
import { parseNumericId } from '@/lib/codex/id-allocation';
import {
  parseArchetypePathData,
  parseLevel1LoadoutsField,
  parseRecommendedAbilities,
} from '@/lib/game/archetype-path';
import { snapshotOfficialPowerForInnate } from '@/lib/game/innate-eligibility';
import { validatePathDataForPublish, type PathValidationContext } from '@/lib/game/path-validation';
import {
  createItemTpResolver,
  trainingPointLimitFromRecommendedAbilities,
} from '@/lib/guided-creator/loadout-tp';
import { fetchCachedOfficialColumnarItems } from '@/lib/official-library-get-payload';
import type { TypedSupabaseClient } from '@/lib/supabase/database';
import type { ArchetypePathData } from '@/types/archetype';
import type { LibraryItem, LibraryPower } from '@/types/library';
import type { PowerPart } from '@/hooks/codex-types';

const ARCHETYPE_TYPES = new Set<SaveArchetypeWithPathInput['type']>([
  'power',
  'martial',
  'powered-martial',
]);

/** Lowest level stored in `codex_archetype_levels` (level 1 is columnar on the archetype row). */
const MIN_PROGRESSION_LEVEL = 2;
const MAX_PROGRESSION_ROWS = 200;
/** `codex_archetype_levels.level` is Postgres `int4`. */
const POSTGRES_INT4_MAX = 2_147_483_647;

const LEVEL1_COMMA_FIELDS = [
  'level1_feats',
  'level1_skills',
  'level1_powers',
  'level1_innate_powers',
  'level1_techniques',
  'level1_armaments',
  'level1_equipment',
  'level1_remove_feats',
  'level1_remove_powers',
  'level1_remove_techniques',
  'level1_remove_armaments',
] as const satisfies readonly (keyof SaveArchetypeWithPathInput)[];

const SAVE_INPUT_KEYS = new Set([
  'id',
  'name',
  'type',
  'description',
  'sources',
  'archetype_ability',
  'secondary_ability',
  'power_prof_start',
  'martial_prof_start',
  'power_prof_level5',
  'martial_prof_level5',
  'level1_feats',
  'level1_skills',
  'level1_powers',
  'level1_innate_powers',
  'level1_techniques',
  'level1_armaments',
  'level1_equipment',
  'level1_recommend_unarmed_prowess',
  'level1_remove_feats',
  'level1_remove_powers',
  'level1_remove_techniques',
  'level1_remove_armaments',
  'level1_notes',
  'level1_guidance_groups',
  'level1_recommended_abilities',
  'level1_loadouts',
  'levels',
]);

const LEVEL_ROW_KEYS = new Set([
  'level',
  'feats',
  'skills',
  'powers',
  'techniques',
  'armaments',
  'equipment',
  'remove_feats',
  'remove_powers',
  'remove_techniques',
  'remove_armaments',
  'notes',
]);

const LEVEL_COMMA_FIELDS: { key: keyof ArchetypeLevelPayload; contractKey: string }[] = [
  { key: 'feats', contractKey: 'level1Feats' },
  { key: 'skills', contractKey: 'level1Skills' },
  { key: 'powers', contractKey: 'level1Powers' },
  { key: 'techniques', contractKey: 'level1Techniques' },
  { key: 'armaments', contractKey: 'level1Armaments' },
  { key: 'equipment', contractKey: 'level1Equipment' },
  { key: 'remove_feats', contractKey: 'level1RemoveFeats' },
  { key: 'remove_powers', contractKey: 'level1RemovePowers' },
  { key: 'remove_techniques', contractKey: 'level1RemoveTechniques' },
  { key: 'remove_armaments', contractKey: 'level1RemoveArmaments' },
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function commaListParts(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter((part) => part.length > 0);
  }
  if (typeof value === 'string') {
    if (value.trim() === '') return [];
    return value
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }
  return [];
}

/** Canonical TEXT list storage (matches `toColumnarPayload` comma-join). */
export function normalizeCodexCommaListColumn(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const parts = commaListParts(value);
  if (parts.length === 0) return null;
  return parts.join(', ');
}

function progressionLevelInt4Error(rawLevel: number, prefix: string): string | null {
  if (typeof rawLevel !== 'number' || !Number.isInteger(rawLevel) || !Number.isFinite(rawLevel)) {
    return `${prefix}.level must be an integer`;
  }
  if (rawLevel < MIN_PROGRESSION_LEVEL) {
    return `${prefix}.level must be ${MIN_PROGRESSION_LEVEL} or higher (level 1 is stored on the archetype row)`;
  }
  if (rawLevel > POSTGRES_INT4_MAX) {
    return `${prefix}.level exceeds the maximum value allowed for database storage`;
  }
  return null;
}

function archetypePathPayloadToCamelBody(
  payload: SaveArchetypeWithPathInput,
): Record<string, unknown> {
  return {
    name: payload.name,
    type: payload.type,
    description: payload.description,
    sources: payload.sources,
    archetypeAbility: payload.archetype_ability,
    secondaryAbility: payload.secondary_ability,
    powerProfStart: payload.power_prof_start,
    martialProfStart: payload.martial_prof_start,
    powerProfLevel5: payload.power_prof_level5,
    martialProfLevel5: payload.martial_prof_level5,
    level1Feats: payload.level1_feats,
    level1Skills: payload.level1_skills,
    level1Powers: payload.level1_powers,
    level1InnatePowers: payload.level1_innate_powers,
    level1Techniques: payload.level1_techniques,
    level1Armaments: payload.level1_armaments,
    level1Equipment: payload.level1_equipment,
    level1RecommendUnarmedProwess: payload.level1_recommend_unarmed_prowess,
    level1RemoveFeats: payload.level1_remove_feats,
    level1RemovePowers: payload.level1_remove_powers,
    level1RemoveTechniques: payload.level1_remove_techniques,
    level1RemoveArmaments: payload.level1_remove_armaments,
    level1Notes: payload.level1_notes,
    level1GuidanceGroups: payload.level1_guidance_groups,
    level1RecommendedAbilities: payload.level1_recommended_abilities,
    level1Loadouts: payload.level1_loadouts,
  };
}

function progressionLevelRowsError(levels: unknown): string | null {
  if (!Array.isArray(levels)) return 'levels must be an array';
  if (levels.length > MAX_PROGRESSION_ROWS) {
    return `levels exceeds maximum of ${MAX_PROGRESSION_ROWS} progression rows`;
  }

  for (let index = 0; index < levels.length; index++) {
    const entry = levels[index];
    const prefix = `levels[${index}]`;
    if (!isPlainObject(entry)) return `${prefix} must be an object`;

    const unknownKeys = Object.keys(entry).filter((key) => !LEVEL_ROW_KEYS.has(key));
    if (unknownKeys.length > 0) {
      return `${prefix} contains unsupported fields: ${unknownKeys.join(', ')}`;
    }

    if (!('level' in entry)) return `${prefix}.level is required`;
    const rawLevel = entry.level;
    const levelErr =
      typeof rawLevel === 'number'
        ? progressionLevelInt4Error(rawLevel, prefix)
        : `${prefix}.level must be an integer`;
    if (levelErr) return levelErr;

    for (const { key, contractKey } of LEVEL_COMMA_FIELDS) {
      if (!(key in entry)) continue;
      const err = codexPersistedFieldShapeError('codex_archetypes', contractKey, entry[key]);
      if (err) return `${prefix}.${String(key)}: ${err}`;
    }

    if ('notes' in entry && entry.notes != null) {
      if (typeof entry.notes !== 'string') return `${prefix}.notes must be a string`;
      if (entry.notes.length > CODEX_DESC_MAX_LENGTH)
        return `${prefix}.notes exceeds maximum length`;
    }
  }

  return null;
}

/** Returns a user-safe error message, or null when the payload may be persisted. */
export function saveArchetypeWithPathInputError(
  payload: SaveArchetypeWithPathInput,
): string | null {
  const raw = payload as Record<string, unknown>;
  const unknownTopLevel = Object.keys(raw).filter((key) => !SAVE_INPUT_KEYS.has(key));
  if (unknownTopLevel.length > 0) {
    return `Payload contains unsupported fields: ${unknownTopLevel.join(', ')}`;
  }

  if (payload.id !== undefined && payload.id !== null && payload.id !== '') {
    const parsed = parseNumericId(payload.id);
    if (parsed === null) {
      return 'id must be a positive numeric codex id';
    }
    if (String(payload.id).trim() !== String(parsed)) {
      return 'id must be a canonical numeric codex id';
    }
  }

  if (typeof payload.name !== 'string' || payload.name.trim() === '') {
    return 'name is required';
  }

  if (!ARCHETYPE_TYPES.has(payload.type)) {
    return 'type must be power, martial, or powered-martial';
  }

  const levelsErr = progressionLevelRowsError(payload.levels);
  if (levelsErr) return levelsErr;

  return codexAdminCamelBodyShapeError(
    'codex_archetypes',
    archetypePathPayloadToCamelBody(payload),
  );
}

/** After validation, coerce JSONB cells to parsed values (never store JSON text in JSONB). */
function normalizeArchetypeJsonColumn(value: unknown): unknown | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value === '') return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    return JSON.parse(trimmed) as unknown;
  }
  return value;
}

function normalizeLevelRowCommaFields(entry: ArchetypeLevelPayload): ArchetypeLevelPayload {
  const out: ArchetypeLevelPayload = { ...entry, level: entry.level };
  for (const { key } of LEVEL_COMMA_FIELDS) {
    if (!(key in entry)) continue;
    const normalized = normalizeCodexCommaListColumn(entry[key]);
    if (normalized === undefined) continue;
    (
      out as Record<keyof ArchetypeLevelPayload, ArchetypeLevelPayload[keyof ArchetypeLevelPayload]>
    )[key] = normalized ?? undefined;
  }
  return out;
}

/** Apply persisted-contract normalization for values that pass `saveArchetypeWithPathInputError`. */
export function normalizeSaveArchetypeWithPathInput(
  payload: SaveArchetypeWithPathInput,
): SaveArchetypeWithPathInput {
  const level1CommaNormalized: Partial<
    Pick<SaveArchetypeWithPathInput, (typeof LEVEL1_COMMA_FIELDS)[number]>
  > = {};
  for (const key of LEVEL1_COMMA_FIELDS) {
    if (!(key in payload)) continue;
    const normalized = normalizeCodexCommaListColumn(payload[key]);
    if (normalized === undefined) continue;
    level1CommaNormalized[key] = normalized ?? undefined;
  }

  return {
    ...payload,
    ...level1CommaNormalized,
    levels: payload.levels.map(normalizeLevelRowCommaFields),
    level1_guidance_groups: normalizeArchetypeJsonColumn(payload.level1_guidance_groups),
    level1_recommended_abilities: normalizeArchetypeJsonColumn(
      payload.level1_recommended_abilities,
    ),
    level1_loadouts: normalizeArchetypeJsonColumn(payload.level1_loadouts),
  };
}

/** Resolve a trusted archetype id for writes (new rows allocate separately). */
export function parseSaveArchetypeNumericId(id: string | undefined): string | null {
  if (id === undefined || id === null || id === '') return null;
  const parsed = parseNumericId(id);
  if (parsed === null || String(id).trim() !== String(parsed)) return null;
  return String(parsed);
}

/** Build `path_data` the same way persisted columns are read after `normalizeSaveArchetypeWithPathInput`. */
export function archetypePathDataFromSaveInput(
  payload: SaveArchetypeWithPathInput,
): ArchetypePathData | undefined {
  const loadoutsField = parseLevel1LoadoutsField(payload.level1_loadouts);
  const level1Raw: Record<string, unknown> = {
    feats: payload.level1_feats,
    skills: payload.level1_skills,
    powers: payload.level1_powers,
    innatePowers: payload.level1_innate_powers,
    techniques: payload.level1_techniques,
    armaments: payload.level1_armaments,
    equipment: payload.level1_equipment,
    recommendUnarmedProwess: payload.level1_recommend_unarmed_prowess === true,
    removeFeats: payload.level1_remove_feats,
    removePowers: payload.level1_remove_powers,
    removeTechniques: payload.level1_remove_techniques,
    removeArmaments: payload.level1_remove_armaments,
    notes: payload.level1_notes,
    guidance_groups: payload.level1_guidance_groups,
    recommended_abilities: payload.level1_recommended_abilities,
    ...(loadoutsField.loadouts != null ? { loadouts: loadoutsField.loadouts } : {}),
    ...(loadoutsField.armorStep != null ? { armorStep: loadoutsField.armorStep } : {}),
    ...(loadoutsField.sharedEquipment != null
      ? { sharedEquipment: loadoutsField.sharedEquipment }
      : {}),
  };

  const levelsRaw = payload.levels.map((entry) => ({
    level: entry.level,
    feats: entry.feats,
    skills: entry.skills,
    powers: entry.powers,
    techniques: entry.techniques,
    armaments: entry.armaments,
    equipment: entry.equipment,
    removeFeats: entry.remove_feats,
    removePowers: entry.remove_powers,
    removeTechniques: entry.remove_techniques,
    removeArmaments: entry.remove_armaments,
    notes: entry.notes,
  }));

  return parseArchetypePathData({ level1: level1Raw, levels: levelsRaw });
}

/** Layer-1 publish rules from `validatePathDataForPublish`; blocks on severity `error` only. */
export function saveArchetypeWithPathPublishError(
  payload: SaveArchetypeWithPathInput,
  context: PathValidationContext,
): string | null {
  const pathData = archetypePathDataFromSaveInput(payload);
  if (!pathData?.level1) return null;
  const errors = validatePathDataForPublish(pathData, context).filter(
    (i) => i.severity === 'error',
  );
  if (errors.length === 0) return null;
  return errors.map((i) => i.message).join(' ');
}

/** Same reference data the admin archetype workspace uses for `validatePathDataForPublish`. */
export async function buildSaveArchetypePathValidationContext(
  supabase: TypedSupabaseClient,
  payload: SaveArchetypeWithPathInput,
): Promise<PathValidationContext> {
  const [
    officialItemsRows,
    officialPowersRows,
    equipmentResult,
    skillsResult,
    partsResult,
    propertiesResult,
  ] = await Promise.all([
    fetchCachedOfficialColumnarItems(supabase, 'items', false),
    fetchCachedOfficialColumnarItems(supabase, 'powers', false),
    supabase.from('codex_equipment').select('*'),
    supabase.from('codex_skills').select('*'),
    supabase.from('codex_parts').select('*'),
    supabase.from('codex_properties').select('*'),
  ]);

  for (const { error } of [equipmentResult, skillsResult, partsResult, propertiesResult] as const) {
    if (error) throw new Error(error.message);
  }

  const officialItems = officialItemsRows as unknown as LibraryItem[];
  const officialPowers = officialPowersRows as unknown as LibraryPower[];
  const codexEquipment = (equipmentResult.data ?? []).map((row) =>
    mapCodexEquipment(row as Record<string, unknown>),
  );
  const itemProperties = (propertiesResult.data ?? []).map((row) =>
    mapCodexProperty(row as Record<string, unknown>),
  ) as ItemPropertyTpRow[];
  const powerPartsDb = selectPowerParts(
    (partsResult.data ?? []).map((row) => mapCodexPart(row as Record<string, unknown>)),
  ) as PowerPart[];
  const skillById = new Map(
    (skillsResult.data ?? []).map((row) => {
      const skill = mapCodexSkill(row as Record<string, unknown>);
      return [String(skill.id), skill] as const;
    }),
  );
  const officialById = new Map(officialPowers.map((p) => [String(p.id ?? ''), p]));
  const recommended = parseRecommendedAbilities(payload.level1_recommended_abilities);

  return {
    resolveItemTrainingPoints: createItemTpResolver(officialItems, codexEquipment, itemProperties),
    trainingPointLimit: trainingPointLimitFromRecommendedAbilities(recommended),
    archetypeType: payload.type,
    powerProfStart: payload.power_prof_start ?? null,
    martialProfStart: payload.martial_prof_start ?? null,
    isSubSkill: (skillId) => {
      const skill = skillById.get(String(skillId));
      if (!skill) return null;
      return skill.base_skill_id != null;
    },
    resolveInnatePower: (powerId) => {
      const power = officialById.get(powerId);
      if (!power) return null;
      return snapshotOfficialPowerForInnate(power, powerPartsDb);
    },
  };
}
