/**
 * Codex API — returns all game reference data from Supabase (public schema).
 * All codex tables (codex_feats, codex_skills, …) and core_rules live in public;
 * columnar tables (see src/docs/SUPABASE_SCHEMA.md).
 */

import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { logApiError } from '@/lib/api-error';
import { getSession } from '@/lib/supabase/session';
import { coerceJsonRecord, parseArchetypePathData } from '@/lib/game/archetype-path';
import { fetchCoreRules } from '@/lib/core-rules-server';
import { enrichRowsWithBankImageUrls } from '@/lib/entity-image-enrich-server';
import { selectPowerParts, selectTechniqueParts } from '@/lib/codex/part-type';
import {
  mapCodexCreatureFeat,
  mapCodexEquipment,
  mapCodexFeat,
  mapCodexPart,
  mapCodexProperty,
  mapCodexSkill,
  mapCodexSpecies,
  mapCodexTrait,
  toNum,
  toStrArray,
} from '@/lib/codex/row-map';
import {
  CODEX_PAYLOAD_KEYS,
  isCodexPayloadKey,
  type CodexPayload,
  type CodexPayloadKey,
} from '@/types/codex';
import type { ArchetypeCategory } from '@/types/archetype';

/** Codex tables behind the payload keys — `?collection=` only queries what it returns. */
const CODEX_TABLES = [
  'codex_feats',
  'codex_skills',
  'codex_species',
  'codex_traits',
  'codex_parts',
  'codex_properties',
  'codex_equipment',
  'codex_archetypes',
  'codex_archetype_levels',
  'codex_creature_feats',
] as const;

type CodexTable = (typeof CODEX_TABLES)[number];

const COLLECTION_TABLES: Record<CodexPayloadKey, readonly CodexTable[]> = {
  feats: ['codex_feats'],
  skills: ['codex_skills'],
  species: ['codex_species'],
  traits: ['codex_traits'],
  powerParts: ['codex_parts'],
  techniqueParts: ['codex_parts'],
  parts: ['codex_parts'],
  itemProperties: ['codex_properties'],
  equipment: ['codex_equipment'],
  archetypes: ['codex_archetypes', 'codex_archetype_levels'],
  creatureFeats: ['codex_creature_feats'],
  coreRules: [],
};

/** Normalize DB archetype type to a known category (defaults to martial when missing/unknown). */
function toArchetypeCategory(raw: unknown): ArchetypeCategory {
  const t = String(raw ?? '').toLowerCase();
  if (t === 'power' || t === 'powered-martial' || t === 'martial') return t;
  return 'martial';
}

/** DB row shape (snake_case from Supabase) */
type Row = Record<string, unknown>;

/** Row version for the admin optimistic lock; absent on tables without the column. */
function toVersion(val: unknown): string | undefined {
  return typeof val === 'string' && val ? val : undefined;
}

function withRowVersion<T extends object>(mapped: T, r: Row): T & { updated_at?: string } {
  const updated_at = toVersion(r.updated_at);
  return updated_at ? { ...mapped, updated_at } : { ...mapped };
}

type TableError = { message?: string; code?: string } | null;
type TableResult = { data: Row[] | null; error: TableError };

/** Skipped tables resolve empty so the mapping below stays one code path. */
function selectTable(
  supabase: SupabaseClient,
  table: CodexTable,
  needed: ReadonlySet<CodexTable>,
): PromiseLike<TableResult> {
  if (!needed.has(table)) return Promise.resolve({ data: [], error: null });
  return supabase.from(table).select('*') as unknown as PromiseLike<TableResult>;
}

async function fetchCodexFromClient(
  supabase: SupabaseClient,
  keys: ReadonlySet<CodexPayloadKey>,
): Promise<Partial<CodexPayload>> {
  const needed = new Set<CodexTable>();
  for (const key of keys) {
    for (const table of COLLECTION_TABLES[key]) needed.add(table);
  }

  const [
    { data: feats, error: eFeats },
    { data: skills, error: eSkills },
    { data: species, error: eSpecies },
    { data: traits, error: eTraits },
    { data: parts, error: eParts },
    { data: properties, error: eProps },
    { data: equipment, error: eEquip },
    { data: archetypes, error: eArch },
    { data: archetypeLevels, error: eArchLevels },
    { data: creatureFeats, error: eCreature },
    coreRules,
  ] = await Promise.all([
    selectTable(supabase, 'codex_feats', needed),
    selectTable(supabase, 'codex_skills', needed),
    selectTable(supabase, 'codex_species', needed),
    selectTable(supabase, 'codex_traits', needed),
    selectTable(supabase, 'codex_parts', needed),
    selectTable(supabase, 'codex_properties', needed),
    selectTable(supabase, 'codex_equipment', needed),
    selectTable(supabase, 'codex_archetypes', needed),
    selectTable(supabase, 'codex_archetype_levels', needed),
    selectTable(supabase, 'codex_creature_feats', needed),
    keys.has('coreRules')
      ? fetchCoreRules(supabase)
      : Promise.resolve({} as Awaited<ReturnType<typeof fetchCoreRules>>),
  ]);

  /** If table is missing (e.g. codex_* still in codex schema), treat as empty instead of 500. Run sql/path-c-phase0-consolidate-to-public-part1c.sql to move codex_* to public. */
  function isTableMissing(e: { message?: string; code?: string } | null): boolean {
    if (!e) return false;
    return e.code === '42P01' || /does not exist|relation.*not found/i.test(e.message ?? '');
  }

  const tableNames = CODEX_TABLES;
  const errors = [
    eFeats,
    eSkills,
    eSpecies,
    eTraits,
    eParts,
    eProps,
    eEquip,
    eArch,
    eArchLevels,
    eCreature,
  ];
  errors.forEach((e, i) => {
    if (e && isTableMissing(e)) {
      console.warn('[Codex API] Table missing (use empty):', tableNames[i], e.message);
    }
  });
  const firstRealError = errors.find((e) => e && !isTableMissing(e)) as
    | { message?: string; code?: string }
    | undefined;
  if (firstRealError) {
    const err = new Error(firstRealError.message ?? 'Codex fetch failed') as Error & {
      code?: string;
    };
    err.code = firstRealError.code;
    throw err;
  }

  const featRows = ((isTableMissing(eFeats) ? [] : feats) ?? []) as Row[];
  const skillRows = ((isTableMissing(eSkills) ? [] : skills) ?? []) as Row[];
  const speciesRows = ((isTableMissing(eSpecies) ? [] : species) ?? []) as Row[];
  const equipRowsRaw = ((isTableMissing(eEquip) ? [] : equipment) ?? []) as Row[];
  await enrichRowsWithBankImageUrls(supabase, speciesRows);
  await enrichRowsWithBankImageUrls(supabase, equipRowsRaw);
  const traitRows = ((isTableMissing(eTraits) ? [] : traits) ?? []) as Row[];
  const partRows = ((isTableMissing(eParts) ? [] : parts) ?? []) as Row[];
  const propRows = ((isTableMissing(eProps) ? [] : properties) ?? []) as Row[];
  const equipRows = equipRowsRaw;
  const archRows = ((isTableMissing(eArch) ? [] : archetypes) ?? []) as Row[];
  const archLevelRows = ((isTableMissing(eArchLevels) ? [] : archetypeLevels) ?? []) as Row[];
  const creatureRows = ((isTableMissing(eCreature) ? [] : creatureFeats) ?? []) as Row[];

  const codexFeats = featRows.map((r) => withRowVersion(mapCodexFeat(r), r));
  const codexSkills = skillRows.map((r) => withRowVersion(mapCodexSkill(r), r));
  const codexSpecies = speciesRows.map((r) => withRowVersion(mapCodexSpecies(r), r));
  const codexTraits = traitRows.map((r) => withRowVersion(mapCodexTrait(r), r));
  const allParts = partRows.map((r) => withRowVersion(mapCodexPart(r), r));
  const codexPowerParts = selectPowerParts(allParts);
  const codexTechniqueParts = selectTechniqueParts(allParts);
  const codexProperties = propRows.map((r) => withRowVersion(mapCodexProperty(r), r));
  const codexEquipment = equipRows.map((r) => withRowVersion(mapCodexEquipment(r), r));

  const levelsByArchetype = new Map<string, Row[]>();
  archLevelRows.forEach((levelRow) => {
    const archetypeId = levelRow.archetype_id != null ? String(levelRow.archetype_id) : '';
    if (!archetypeId) return;
    const existing = levelsByArchetype.get(archetypeId) || [];
    existing.push(levelRow);
    levelsByArchetype.set(archetypeId, existing);
  });

  const codexArchetypes = archRows.map((r) => {
    const archetypeId = String(r.id ?? '');
    const levelRows = (levelsByArchetype.get(archetypeId) || [])
      .map((entry) => ({
        level: toNum(entry.level),
        feats: toStrArray(entry.feats),
        skills: toStrArray(entry.skills),
        powers: toStrArray(entry.powers),
        techniques: toStrArray(entry.techniques),
        armaments: toStrArray(entry.armaments),
        equipment: toStrArray(entry.equipment),
        removeFeats: toStrArray(entry.remove_feats),
        removePowers: toStrArray(entry.remove_powers),
        removeTechniques: toStrArray(entry.remove_techniques),
        removeArmaments: toStrArray(entry.remove_armaments),
        notes: entry.notes ? String(entry.notes) : undefined,
      }))
      .filter((entry) => typeof entry.level === 'number')
      .sort((a, b) => Number(a.level) - Number(b.level));

    const legacyPath = coerceJsonRecord(r.path_data);
    const level1FromLegacy =
      legacyPath && typeof legacyPath.level1 === 'object' && legacyPath.level1 !== null
        ? (legacyPath.level1 as Record<string, unknown>)
        : undefined;

    const level1Raw: Record<string, unknown> = {
      feats: toStrArray(r.level1_feats),
      skills: toStrArray(r.level1_skills),
      powers: toStrArray(r.level1_powers),
      innatePowers: toStrArray(
        r.level1_innate_powers ?? level1FromLegacy?.innatePowers ?? level1FromLegacy?.innate_powers,
      ),
      techniques: toStrArray(r.level1_techniques),
      armaments: toStrArray(r.level1_armaments),
      equipment: toStrArray(r.level1_equipment),
      recommendUnarmedProwess: r.level1_recommend_unarmed_prowess === true,
      removeFeats: toStrArray(r.level1_remove_feats),
      removePowers: toStrArray(r.level1_remove_powers),
      removeTechniques: toStrArray(r.level1_remove_techniques),
      removeArmaments: toStrArray(r.level1_remove_armaments),
      notes: r.level1_notes ? String(r.level1_notes) : undefined,
      guidance_groups: r.level1_guidance_groups ?? level1FromLegacy?.guidance_groups,
      recommended_abilities:
        r.level1_recommended_abilities ?? level1FromLegacy?.recommended_abilities,
      loadouts: r.level1_loadouts ?? level1FromLegacy?.loadouts,
    };
    const level1FromColumns = parseArchetypePathData({ level1: level1Raw })?.level1 ?? {
      feats: level1Raw.feats as string[],
      skills: level1Raw.skills as string[],
      powers: level1Raw.powers as string[],
      innatePowers: level1Raw.innatePowers as string[],
      techniques: level1Raw.techniques as string[],
      armaments: level1Raw.armaments as string[],
      equipment: level1Raw.equipment as string[],
      recommendUnarmedProwess: level1Raw.recommendUnarmedProwess as boolean,
      removeFeats: level1Raw.removeFeats as string[],
      removePowers: level1Raw.removePowers as string[],
      removeTechniques: level1Raw.removeTechniques as string[],
      removeArmaments: level1Raw.removeArmaments as string[],
      notes: level1Raw.notes as string | undefined,
      guidance_groups: parseArchetypePathData({
        level1: { guidance_groups: level1Raw.guidance_groups },
      })?.level1?.guidance_groups,
    };
    const hasLevel1Columns = Object.entries(level1FromColumns).some(([key, value]) => {
      if (key === 'recommendUnarmedProwess') return value === true;
      if (key === 'armamentRecommendations' || key === 'equipmentRecommendations') return false;
      if (Array.isArray(value)) return value.length > 0;
      return Boolean(value);
    });

    return {
      id: r.id,
      name: r.name ?? '',
      type: toArchetypeCategory(r.type),
      description: r.description ?? '',
      archetype_ability: (r.archetype_ability as string | undefined) ?? undefined,
      secondary_ability: (r.secondary_ability as string | undefined) ?? undefined,
      power_prof_start: toNum(r.power_prof_start),
      martial_prof_start: toNum(r.martial_prof_start),
      power_prof_level5: toNum(r.power_prof_level5),
      martial_prof_level5: toNum(r.martial_prof_level5),
      path_data:
        hasLevel1Columns || levelRows.length > 0
          ? {
              ...(hasLevel1Columns ? { level1: level1FromColumns } : {}),
              ...(levelRows.length > 0 ? { levels: levelRows } : {}),
            }
          : legacyPath,
      level1_feats: toStrArray(r.level1_feats),
      level1_skills: toStrArray(r.level1_skills),
      level1_powers: toStrArray(r.level1_powers),
      level1_innate_powers: toStrArray(
        r.level1_innate_powers ?? level1FromLegacy?.innatePowers ?? level1FromLegacy?.innate_powers,
      ),
      level1_techniques: toStrArray(r.level1_techniques),
      level1_armaments: toStrArray(r.level1_armaments),
      level1_equipment: toStrArray(r.level1_equipment),
      level1_remove_feats: toStrArray(r.level1_remove_feats),
      level1_remove_powers: toStrArray(r.level1_remove_powers),
      level1_remove_techniques: toStrArray(r.level1_remove_techniques),
      level1_remove_armaments: toStrArray(r.level1_remove_armaments),
      level1_notes: r.level1_notes ?? level1FromLegacy?.notes ?? '',
      level1_guidance_groups: level1FromColumns.guidance_groups ?? null,
      updated_at: toVersion(r.updated_at),
    };
  });

  const codexCreatureFeats = creatureRows.map((r) => withRowVersion(mapCodexCreatureFeat(r), r));

  const full = {
    feats: codexFeats,
    skills: codexSkills,
    species: codexSpecies,
    traits: codexTraits,
    powerParts: codexPowerParts,
    techniqueParts: codexTechniqueParts,
    parts: allParts,
    itemProperties: codexProperties,
    equipment: codexEquipment,
    archetypes: codexArchetypes,
    creatureFeats: codexCreatureFeats,
    coreRules,
  } as unknown as CodexPayload;

  if (keys.size === CODEX_PAYLOAD_KEYS.length) return full;

  const slice: Partial<CodexPayload> = {};
  for (const key of keys) {
    slice[key] = full[key] as never;
  }
  return slice;
}

/** Codex is admin-editable; long public cache caused stale archetypes/feats after saves. */
const cacheControl = 'private, max-age=0, must-revalidate';

/** ?debug=1 is allowed in non-production or for authenticated admins only (SEC audit M1). */
async function canExposeCodexDebug(requested: boolean): Promise<boolean> {
  if (!requested) return false;
  if (process.env.NODE_ENV !== 'production') return true;
  const { user } = await getSession();
  return user?.uid ? isAdmin(user.uid) : false;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const debug = url.searchParams.get('debug') === '1';
  const collection = url.searchParams.get('collection');
  if (collection !== null && !isCodexPayloadKey(collection)) {
    return NextResponse.json({ error: 'Unknown codex collection' }, { status: 400 });
  }
  const keys: ReadonlySet<CodexPayloadKey> = collection
    ? new Set([collection])
    : new Set(CODEX_PAYLOAD_KEYS);
  try {
    // Public reference data: read through the cookie-aware anon client so the
    // "Anyone can read codex*/core_rules" RLS policies apply. The service-role
    // key (RLS bypass) is reserved for authorized admin writes only (SEC-01).
    const supabase = await createClient();
    const body = await fetchCodexFromClient(supabase, keys);
    return NextResponse.json(body, { headers: { 'Cache-Control': cacheControl } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: string }).code)
        : undefined;
    const stack = err instanceof Error ? err.stack : undefined;
    logApiError('GET /api/codex', { message, code, stack, err });
    const showDebug = await canExposeCodexDebug(debug);
    const hint =
      showDebug || process.env.NODE_ENV === 'development'
        ? message.includes('connect') || message.includes('connection')
          ? 'Database connection failed. Check NEXT_PUBLIC_SUPABASE_URL and keys in Vercel.'
          : message.includes('exist') || message.includes('relation')
            ? 'Codex tables may be missing in public. Run Supabase SQL migrations.'
            : message.includes('permission') ||
                message.includes('policy') ||
                message.includes('row-level') ||
                message.includes('denied')
              ? 'Permission denied: RLS may be blocking reads. Run sql/supabase-codex-rls-public.sql in Supabase Dashboard → SQL Editor.'
              : message
        : undefined;
    return NextResponse.json(
      {
        error: 'Failed to load codex',
        ...(hint && { hint }),
        ...(showDebug && { debug: { message, code } }),
      },
      { status: 500 },
    );
  }
}
