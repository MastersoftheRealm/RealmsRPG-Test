/**
 * Codex API — returns all game reference data from Supabase (public schema).
 * All codex tables (codex_feats, codex_skills, …) and core_rules live in public;
 * columnar tables (see src/docs/SUPABASE_SCHEMA.md).
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { fromPublicTable, type TypedSupabaseClient } from '@/lib/supabase/database';
import {
  codexResponseMayUsePublicCdn,
  PRIVATE_MUST_REVALIDATE_CACHE_CONTROL,
  PRIVATE_NO_STORE_CACHE_CONTROL,
  PUBLIC_CDN_CACHE_CONTROL,
} from '@/lib/api/public-cdn-cache';
import { createPublicClient } from '@/lib/supabase/public-client';
import { createClient } from '@/lib/supabase/server';
import { logApiError } from '@/lib/api-error';
import { codexGetQuerySchema, validateQuery } from '@/lib/api-validation';
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
  mapCodexSources,
  toNum,
  toStrArray,
} from '@/lib/codex/row-map';
import { parseCatalogListing } from '@/lib/library/catalog-listing';
import { CODEX_PAYLOAD_KEYS, type CodexPayload, type CodexPayloadKey } from '@/types/codex';
import { CODEX_DATA_TABLES, type CodexDataTable } from '@/lib/codex/codex-tables';
import { CODEX_API_TABLE_SELECT, omitCodexSourcesColumn } from '@/lib/codex/public-table-select';
import {
  codexApiTableCacheTag,
  CODEX_API_CACHE_TAG,
  CORE_RULES_CACHE_TAG,
} from '@/lib/codex/cache-tags';
import {
  CODEX_PUBLIC_ISR_SECONDS,
  readCachedPublicDataWhenValid,
} from '@/lib/supabase/cached-public-read';
import type { ArchetypeCategory } from '@/types/archetype';

/** Codex tables behind the payload keys — `?collection=` only queries what it returns. */
const CODEX_TABLES = CODEX_DATA_TABLES;
type CodexTable = CodexDataTable;

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

function withRowVersion<T extends object>(
  mapped: T,
  r: Row,
): T & { updated_at?: string | undefined } {
  const updated_at = toVersion(r.updated_at);
  return updated_at ? { ...mapped, updated_at } : { ...mapped };
}

type TableError = { message?: string | undefined; code?: string | undefined } | null;
type TableResult = { data: Row[] | null; error: TableError };

/** If the table is missing (e.g. codex_* still in codex schema), treat as empty instead of 500. */
function isCodexTableMissing(
  e: { message?: string | undefined; code?: string | undefined } | null,
): boolean {
  if (!e) return false;
  // A missing column is not a missing table. "column sources does not exist" (42703)
  // used to match the broad message check and wipe skills and properties.
  if (e.code === '42703' || e.code === 'PGRST204') return false;
  return e.code === '42P01' || /does not exist|relation.*not found/i.test(e.message ?? '');
}

/** True when this select names `sources` and Postgres or PostgREST says that column is absent. */
function isMissingSourcesColumn(error: TableError): boolean {
  if (!error) return false;
  const message = error.message ?? '';
  if (!/\bsources\b/i.test(message)) return false;
  return (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    /could not find the 'sources' column/i.test(message)
  );
}

function throwUnlessCodexTableMissing(error: TableError): void {
  if (!error || isCodexTableMissing(error)) return;
  const err = new Error(error.message ?? 'Codex fetch failed') as Error & {
    code?: string | undefined;
  };
  err.code = error.code;
  throw err;
}

/** Skipped tables resolve empty so the mapping below stays one code path. */
function selectTable(
  supabase: TypedSupabaseClient,
  table: CodexTable,
  needed: ReadonlySet<CodexTable>,
): PromiseLike<TableResult> {
  if (!needed.has(table)) return Promise.resolve({ data: [], error: null });
  const columns = CODEX_API_TABLE_SELECT[table];
  const tableTag = codexApiTableCacheTag(table);
  return readCachedPublicDataWhenValid(
    ['codex-api', table, columns],
    [CODEX_API_CACHE_TAG, tableTag],
    CODEX_PUBLIC_ISR_SECONDS,
    async () => {
      let result = (await fromPublicTable(supabase, table).select(columns)) as TableResult;
      // Skills and properties name `sources`. If that column is missing, retry once
      // without it so mapCodexSources can still read the singular `source` label.
      // A missing column must not cache as an empty catalog.
      if (isMissingSourcesColumn(result.error) && columns.includes('sources')) {
        const fallbackColumns = omitCodexSourcesColumn(columns);
        result = (await fromPublicTable(supabase, table).select(fallbackColumns)) as TableResult;
      }
      throwUnlessCodexTableMissing(result.error);
      return result;
    },
    (result) => !result.error && (result.data?.length ?? 0) > 0,
  );
}

function codexPayloadCacheTags(keys: ReadonlySet<CodexPayloadKey>): string[] {
  const tags = new Set<string>([CODEX_API_CACHE_TAG]);
  for (const key of keys) {
    for (const table of COLLECTION_TABLES[key]) {
      tags.add(codexApiTableCacheTag(table));
    }
    if (key === 'coreRules') {
      tags.add(CORE_RULES_CACHE_TAG);
    }
  }
  return [...tags];
}

function isCacheableCodexApiPayload(
  keys: ReadonlySet<CodexPayloadKey>,
  payload: Partial<CodexPayload>,
): boolean {
  if (keys.size === 0) return false;
  for (const key of keys) {
    const value = payload[key];
    if (key === 'coreRules') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
      if (Object.keys(value).length === 0) return false;
      continue;
    }
    if (!Array.isArray(value) || value.length === 0) return false;
  }
  return true;
}

async function fetchCodexFromClient(
  supabase: TypedSupabaseClient,
  keys: ReadonlySet<CodexPayloadKey>,
  includeUnlisted = false,
): Promise<Partial<CodexPayload>> {
  const collectionKey = [...keys].sort().join(',');
  return readCachedPublicDataWhenValid(
    ['codex-api-payload', collectionKey, `unlisted=${includeUnlisted}`],
    codexPayloadCacheTags(keys),
    CODEX_PUBLIC_ISR_SECONDS,
    () => buildCodexPayloadUncached(supabase, keys, includeUnlisted),
    (payload) => isCacheableCodexApiPayload(keys, payload),
  );
}

async function buildCodexPayloadUncached(
  supabase: TypedSupabaseClient,
  keys: ReadonlySet<CodexPayloadKey>,
  includeUnlisted = false,
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
    if (e && isCodexTableMissing(e)) {
      console.warn('[Codex API] Table missing (use empty):', tableNames[i], e.message);
    }
  });
  const firstRealError = errors.find((e) => e && !isCodexTableMissing(e)) as
    | { message?: string | undefined; code?: string | undefined }
    | undefined;
  if (firstRealError) {
    const err = new Error(firstRealError.message ?? 'Codex fetch failed') as Error & {
      code?: string | undefined;
    };
    err.code = firstRealError.code;
    throw err;
  }

  const featRows = ((isCodexTableMissing(eFeats) ? [] : feats) ?? []) as Row[];
  const skillRows = ((isCodexTableMissing(eSkills) ? [] : skills) ?? []) as Row[];
  const speciesRows = ((isCodexTableMissing(eSpecies) ? [] : species) ?? []) as Row[];
  const equipRowsRaw = ((isCodexTableMissing(eEquip) ? [] : equipment) ?? []) as Row[];
  await enrichRowsWithBankImageUrls(supabase, speciesRows);
  await enrichRowsWithBankImageUrls(supabase, equipRowsRaw);
  const traitRows = ((isCodexTableMissing(eTraits) ? [] : traits) ?? []) as Row[];
  const partRows = ((isCodexTableMissing(eParts) ? [] : parts) ?? []) as Row[];
  const propRows = ((isCodexTableMissing(eProps) ? [] : properties) ?? []) as Row[];
  const equipRows = equipRowsRaw;
  const archRows = ((isCodexTableMissing(eArch) ? [] : archetypes) ?? []) as Row[];
  const archLevelRows = ((isCodexTableMissing(eArchLevels) ? [] : archetypeLevels) ?? []) as Row[];
  const creatureRows = ((isCodexTableMissing(eCreature) ? [] : creatureFeats) ?? []) as Row[];

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
      sources: mapCodexSources(r.sources, r.source),
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

  const catalogSpecies = includeUnlisted
    ? codexSpecies
    : codexSpecies.filter(
        (s) =>
          parseCatalogListing((s as { catalog_listing?: unknown }).catalog_listing) === 'listed',
      );

  const full = {
    feats: codexFeats,
    skills: codexSkills,
    species: catalogSpecies,
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

async function createCodexReadClient(cookieLess: boolean): Promise<{
  supabase: TypedSupabaseClient;
  usedPublicClient: boolean;
}> {
  if (cookieLess) {
    const publicClient = createPublicClient();
    if (publicClient) return { supabase: publicClient, usedPublicClient: true };
  }
  return { supabase: await createClient(), usedPublicClient: false };
}

function codexCacheControlHeader(
  keys: ReadonlySet<CodexPayloadKey>,
  body: Partial<CodexPayload>,
  options: {
    debug: boolean;
    includeUnlisted: boolean;
    includeUnlistedRequested: boolean;
    usedPublicClient: boolean;
  },
): string {
  if (
    options.debug ||
    options.includeUnlisted ||
    options.includeUnlistedRequested ||
    !options.usedPublicClient
  ) {
    return PRIVATE_NO_STORE_CACHE_CONTROL;
  }
  if (codexResponseMayUsePublicCdn(keys, body)) {
    return PUBLIC_CDN_CACHE_CONTROL;
  }
  return PRIVATE_MUST_REVALIDATE_CACHE_CONTROL;
}

/** ?debug=1 is allowed in non-production or for authenticated admins only (SEC audit M1). */
async function canExposeCodexDebug(requested: boolean): Promise<boolean> {
  if (!requested) return false;
  if (process.env.NODE_ENV !== 'production') return true;
  const { user } = await getSession();
  return user?.uid ? isAdmin(user.uid) : false;
}

export async function GET(request: NextRequest | Request) {
  const queryResult = validateQuery(request, codexGetQuerySchema);
  if (!queryResult.success) {
    return queryResult.error;
  }
  const query = queryResult.data;
  const debug = query.debug === '1';
  const collection = query.collection;
  const keys: ReadonlySet<CodexPayloadKey> = collection
    ? new Set([collection])
    : new Set(CODEX_PAYLOAD_KEYS);
  try {
    const includeUnlistedRequested = query.includeUnlisted === '1';
    let includeUnlisted = false;
    if (includeUnlistedRequested) {
      const { user } = await getSession();
      includeUnlisted = !!user?.uid && (await isAdmin(user.uid));
    }
    const cookieLessRead = !debug && !includeUnlistedRequested;
    const { supabase, usedPublicClient } = await createCodexReadClient(cookieLessRead);
    const body = await fetchCodexFromClient(supabase, keys, includeUnlisted);
    const cacheControl = codexCacheControlHeader(keys, body, {
      debug,
      includeUnlisted,
      includeUnlistedRequested,
      usedPublicClient,
    });
    return NextResponse.json(body, { headers: { 'Cache-Control': cacheControl } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: string | undefined }).code)
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
              ? 'Permission denied: RLS may be blocking reads. Owner must fix codex/core_rules SELECT policies on the database (see SUPABASE_SCHEMA.md and guide/07-database-operations.md).'
              : message
        : undefined;
    return NextResponse.json(
      {
        error: 'Failed to load codex',
        ...(hint && { hint }),
        ...(showDebug && { debug: { message, code } }),
      },
      { status: 500, headers: { 'Cache-Control': PRIVATE_NO_STORE_CACHE_CONTROL } },
    );
  }
}
