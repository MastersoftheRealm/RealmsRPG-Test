/**
 * Official Library API (columnar)
 * ===============================
 * GET: Public read. POST: Admin only, create/update. DELETE: Admin only.
 * Uses official_powers, official_techniques, official_items, official_creatures.
 * Species uses codex_species (Realms Codex) with the same column set as user_species.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { z } from 'zod';
import { invalidateOfficialLibraryPublicCachesFromRouteHandler } from '@/lib/api/public-catalog-cache-invalidation';
import {
  officialListMayUsePublicCdn,
  PRIVATE_MUST_REVALIDATE_CACHE_CONTROL,
  PRIVATE_NO_STORE_CACHE_CONTROL,
  PUBLIC_CDN_CACHE_CONTROL,
  withVercelCacheTags,
} from '@/lib/api/public-cdn-cache';
import {
  OFFICIAL_LIBRARY_CACHE_TAG,
  officialLibraryCacheTag,
  officialPublicRouteCdnCacheTag,
} from '@/lib/codex/cache-tags';
import { createPublicClient } from '@/lib/supabase/public-client';
import { fromPublicTable, type PublicTableName } from '@/lib/supabase/database';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin, requireLiveAdminSession } from '@/lib/admin';
import {
  validateJson,
  verifyMutationRequest,
  publicItemSchema,
  officialCatalogListingPatchSchema,
  officialItemIdQuerySchema,
  officialLibraryTypeParamSchema,
  includeUnlistedQuerySchema,
  validateQuery,
  validateRouteParams,
} from '@/lib/api-validation';
import { apiErrorResponse, logApiError } from '@/lib/api-error';
import {
  bodyToColumnar,
  toDbRow,
  bodyToColumnarSpecies,
  toDbRowSpecies,
  type ColumnarLibraryType,
} from '@/lib/library-columnar';
import {
  fetchCachedOfficialColumnarItems,
  fetchCachedOfficialSpeciesItems,
  fetchUncachedOfficialColumnarItems,
  fetchUncachedOfficialSpeciesItems,
} from '@/lib/official-library-get-payload';
import { allocateCodexNumericId, retireCodexId } from '@/lib/codex/id-allocation';
import {
  parseCatalogListing,
  wantsIncludeUnlisted,
  type CatalogListing,
} from '@/lib/library/catalog-listing';
import { recordCodexChange, type RecordCodexChangeInput } from '@/lib/codex-changelog';
import { validateUserLibraryWriteBody } from '@/lib/library-mutation-validation';
import {
  isColumnarLibraryTypeName,
  unknownPersistedLibraryKeys,
} from '@/lib/library-persisted-contract';

const SPECIES_TABLE = 'codex_species';

type OfficialType = z.infer<typeof officialLibraryTypeParamSchema>['type'];

async function recordOfficialChangeBestEffort(input: RecordCodexChangeInput): Promise<void> {
  try {
    await recordCodexChange(input);
  } catch {
    console.error('[Official API] changelog write failed (mutation kept):', {
      entityType: input.entityType,
      entityId: input.entityId,
      operation: input.operation,
      failure: 'changelog_record_threw',
    });
  }
}

function officialWriteValidation(
  type: OfficialType,
  body: Record<string, unknown>,
  isAdminUser: boolean,
): NextResponse | null {
  const imageOptions = { isAdmin: isAdminUser };
  if (type === 'species') {
    return validateUserLibraryWriteBody('species', body, imageOptions);
  }
  if (isColumnarLibraryTypeName(type)) {
    const unknown = unknownPersistedLibraryKeys(type, body);
    if (unknown.length > 0) {
      return NextResponse.json({ error: 'Payload contains unsupported fields' }, { status: 400 });
    }
    return validateUserLibraryWriteBody(type, body, imageOptions);
  }
  return null;
}

const TABLE_MAP: Record<Exclude<OfficialType, 'species'>, string> = {
  powers: 'official_powers',
  techniques: 'official_techniques',
  'empowered-techniques': 'official_empowered_techniques',
  items: 'official_items',
  creatures: 'official_creatures',
};

const SPECIES_CODEX_DB_KEYS = new Set([
  'name',
  'description',
  'type',
  'sizes',
  'skills',
  'species_traits',
  'ancestry_traits',
  'flaws',
  'characteristics',
  'ave_hgt_cm',
  'ave_wgt_kg',
  'adulthood_lifespan',
  'languages',
  'payload',
  'image_id',
  'image_url',
  'catalog_listing',
]);

/** Creator payloads use ave_height / ave_weight; columnar expects ave_hgt_cm / ave_wgt_kg. */
function normalizeSpeciesBody(body: Record<string, unknown>): Record<string, unknown> {
  const out = { ...body };
  if (out.ave_hgt_cm == null && out.ave_height != null && out.ave_height !== '') {
    const n = typeof out.ave_height === 'number' ? out.ave_height : Number(out.ave_height);
    if (!Number.isNaN(n)) out.ave_hgt_cm = n;
  }
  if (out.ave_wgt_kg == null && out.ave_weight != null && out.ave_weight !== '') {
    const n = typeof out.ave_weight === 'number' ? out.ave_weight : Number(out.ave_weight);
    if (!Number.isNaN(n)) out.ave_wgt_kg = n;
  }
  delete out.ave_height;
  delete out.ave_weight;
  return out;
}

function filterSpeciesCodexRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (SPECIES_CODEX_DB_KEYS.has(k)) out[k] = v;
  }
  return out;
}

function officialTable(supabase: ReturnType<typeof createServiceRoleClient>, table: string) {
  return fromPublicTable(supabase, table as PublicTableName);
}

function catalogListingFromBody(body: Record<string, unknown>): CatalogListing | undefined {
  const raw = body.catalogListing ?? body.catalog_listing;
  if (raw === undefined) return undefined;
  return parseCatalogListing(raw);
}

/** Reject rename onto another row's name (case-insensitive). Same-name saves skip the check. */
async function officialNameConflictForUpdate(
  supabase: ReturnType<typeof createServiceRoleClient>,
  table: string,
  existingId: string,
  rawName: unknown,
): Promise<NextResponse | null> {
  const name = typeof rawName === 'string' ? rawName.trim() : '';
  if (!name) return null;

  const { data: current, error: currentError } = await officialTable(supabase, table)
    .select('name')
    .eq('id', existingId)
    .maybeSingle();
  if (currentError) {
    return apiErrorResponse(
      'Failed to validate name',
      500,
      'POST /api/official/[type] (name load)',
      currentError,
    );
  }
  const currentName = current && typeof current.name === 'string' ? current.name.trim() : '';
  if (currentName && currentName.toLowerCase() === name.toLowerCase()) {
    return null;
  }

  const { data: other, error } = await officialTable(supabase, table)
    .select('id')
    .ilike('name', name)
    .neq('id', existingId)
    .limit(1)
    .maybeSingle();
  if (error) {
    return apiErrorResponse(
      'Failed to validate name',
      500,
      'POST /api/official/[type] (name check)',
      error,
    );
  }
  if (other) {
    return NextResponse.json(
      { error: 'Another official item already uses this name' },
      { status: 409 },
    );
  }
  return null;
}

async function adminMayIncludeUnlisted(request: NextRequest): Promise<boolean> {
  if (!wantsIncludeUnlisted(request.nextUrl.searchParams)) return false;
  const { user } = await getSession();
  if (!user?.uid) return false;
  return isAdmin(user.uid);
}

async function createOfficialReadClient(cookieLess: boolean): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  usedPublicClient: boolean;
}> {
  if (cookieLess) {
    const publicClient = createPublicClient();
    if (publicClient) return { supabase: publicClient, usedPublicClient: true };
  }
  return { supabase: await createClient(), usedPublicClient: false };
}

function officialListedPublicCdnTags(table: string, routeType: string): string[] {
  return [
    OFFICIAL_LIBRARY_CACHE_TAG,
    officialLibraryCacheTag(table, true),
    officialPublicRouteCdnCacheTag(routeType),
  ];
}

function jsonOfficialListResponse(
  items: unknown[],
  cacheControl: string,
  table: string,
  routeType: string,
): NextResponse {
  const response = NextResponse.json(items, { headers: { 'Cache-Control': cacheControl } });
  if (cacheControl === PUBLIC_CDN_CACHE_CONTROL) {
    return withVercelCacheTags(response, officialListedPublicCdnTags(table, routeType));
  }
  return response;
}

function officialCacheControlHeader(
  items: unknown[],
  options: {
    includeUnlisted: boolean;
    includeUnlistedRequested: boolean;
    usedPublicClient: boolean;
  },
): string {
  if (options.includeUnlisted || options.includeUnlistedRequested || !options.usedPublicClient) {
    return PRIVATE_NO_STORE_CACHE_CONTROL;
  }
  if (officialListMayUsePublicCdn(items)) {
    return PUBLIC_CDN_CACHE_CONTROL;
  }
  return PRIVATE_MUST_REVALIDATE_CACHE_CONTROL;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    const paramResult = await validateRouteParams(params, officialLibraryTypeParamSchema);
    if (!paramResult.success) return paramResult.error;
    const { type } = paramResult.data;

    // Public read via the anon (RLS-backed) client; "Anyone can read official_*"
    // / codex_species policies apply. Service role is reserved for admin writes (SEC-01).
    const queryResult = validateQuery(request, includeUnlistedQuerySchema);
    if (!queryResult.success) return queryResult.error;
    const includeUnlistedRequested = queryResult.data.includeUnlisted === '1';
    const includeUnlisted = await adminMayIncludeUnlisted(request);
    const { supabase, usedPublicClient } =
      await createOfficialReadClient(!includeUnlistedRequested);

    if (type === 'species') {
      try {
        const items = includeUnlisted
          ? await fetchUncachedOfficialSpeciesItems(supabase, includeUnlisted)
          : await fetchCachedOfficialSpeciesItems(supabase, includeUnlisted);
        const cacheControl = officialCacheControlHeader(items, {
          includeUnlisted,
          includeUnlistedRequested,
          usedPublicClient,
        });
        return jsonOfficialListResponse(items, cacheControl, SPECIES_TABLE, 'species');
      } catch (error) {
        const err = error as { code?: string; message?: string };
        if (err.code === '42P01' || err.message?.includes('does not exist')) {
          console.warn('[API] Official library table not found for type:', type, err.message);
          return NextResponse.json([], {
            headers: { 'Cache-Control': PRIVATE_NO_STORE_CACHE_CONTROL },
          });
        }
        throw error;
      }
    }

    let items: Record<string, unknown>[];
    const columnarType = type as ColumnarLibraryType;
    const table = TABLE_MAP[columnarType];
    try {
      items = includeUnlisted
        ? await fetchUncachedOfficialColumnarItems(supabase, columnarType, includeUnlisted)
        : await fetchCachedOfficialColumnarItems(supabase, columnarType, includeUnlisted);
    } catch (error) {
      const err = error as { code?: string; message?: string };
      if (err.code === '42P01' || err.message?.includes('does not exist')) {
        console.warn('[API] Official library table not found for type:', type, err.message);
        return NextResponse.json([], {
          headers: { 'Cache-Control': PRIVATE_NO_STORE_CACHE_CONTROL },
        });
      }
      throw error;
    }

    const cacheControl = officialCacheControlHeader(items, {
      includeUnlisted,
      includeUnlistedRequested,
      usedPublicClient,
    });
    return jsonOfficialListResponse(items, cacheControl, table, type);
  } catch (err) {
    logApiError('GET /api/official/[type]', err);
    const response = apiErrorResponse('Failed to load items', 500);
    response.headers.set('Cache-Control', PRIVATE_NO_STORE_CACHE_CONTROL);
    return response;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const auth = await requireLiveAdminSession();
    if (!auth.ok) {
      return NextResponse.json(auth.body, { status: auth.status });
    }
    const user = { uid: auth.userId };

    const paramResult = await validateRouteParams(params, officialLibraryTypeParamSchema);
    if (!paramResult.success) return paramResult.error;
    const { type } = paramResult.data;

    const validation = await validateJson(request, publicItemSchema);
    if (!validation.success) return validation.error;
    const body = validation.data as Record<string, unknown>;
    const writeValidation = officialWriteValidation(type, body, true);
    if (writeValidation) return writeValidation;

    const supabase = createServiceRoleClient();

    if (type === 'species') {
      const normalized = normalizeSpeciesBody(body);
      delete (normalized as Record<string, unknown>).docId;
      delete (normalized as Record<string, unknown>)._source;

      const withUpdated = { ...normalized, updatedAt: new Date().toISOString() };
      const { scalars, payload } = bodyToColumnarSpecies(withUpdated);
      const dbRow = filterSpeciesCodexRow(toDbRowSpecies({ ...scalars, payload }));
      const listing = catalogListingFromBody(body);
      if (listing) dbRow.catalog_listing = listing;
      const existingId = body.id as string | undefined;

      if (existingId) {
        const nameConflict = await officialNameConflictForUpdate(
          supabase,
          SPECIES_TABLE,
          existingId,
          normalized.name,
        );
        if (nameConflict) return nameConflict;
        const { data: beforeRow } = await officialTable(supabase, SPECIES_TABLE)
          .select('*')
          .eq('id', existingId)
          .maybeSingle();
        const { data: updatedRows, error: updateError } = await officialTable(
          supabase,
          SPECIES_TABLE,
        )
          .update(dbRow)
          .eq('id', existingId)
          .select('*');
        if (updateError) {
          return apiErrorResponse(
            'Failed to update item',
            500,
            'POST /api/official/[type] (species update)',
            updateError,
          );
        }
        if (updatedRows && updatedRows.length > 0) {
          const afterRow = updatedRows[0] as Record<string, unknown>;
          let committed = false;
          try {
            committed = true;
            await recordOfficialChangeBestEffort({
              entityType: 'codex_species',
              entityId: existingId,
              operation: 'update',
              changedByUserId: user.uid,
              beforeData: (beforeRow as Record<string, unknown> | null) ?? null,
              afterData: afterRow,
            });
            return NextResponse.json({ id: existingId });
          } finally {
            if (committed) {
              invalidateOfficialLibraryPublicCachesFromRouteHandler(SPECIES_TABLE);
            }
          }
        }
        return NextResponse.json({ error: 'Official item not found' }, { status: 404 });
      }

      for (let attempt = 0; attempt < 3; attempt++) {
        const id = await allocateCodexNumericId(supabase, SPECIES_TABLE);
        const { data: inserted, error: insertError } = await officialTable(supabase, SPECIES_TABLE)
          .insert({ id, catalog_listing: listing ?? 'listed', ...dbRow })
          .select('*')
          .single();
        if (!insertError) {
          let committed = false;
          try {
            committed = true;
            await recordOfficialChangeBestEffort({
              entityType: 'codex_species',
              entityId: id,
              operation: 'create',
              changedByUserId: user.uid,
              beforeData: null,
              afterData: (inserted as Record<string, unknown> | null) ?? null,
            });
            return NextResponse.json({ id });
          } finally {
            if (committed) {
              invalidateOfficialLibraryPublicCachesFromRouteHandler(SPECIES_TABLE);
            }
          }
        }
        if (insertError.code !== '23505') {
          return apiErrorResponse(
            'Failed to save item',
            500,
            'POST /api/official/[type] (species insert)',
            insertError,
          );
        }
      }
      return apiErrorResponse('Failed to save item', 500);
    }

    const withUpdated = { ...body, updatedAt: new Date().toISOString() };
    const { scalars, payload } = bodyToColumnar(type as ColumnarLibraryType, withUpdated);
    const dbRow = toDbRow({ ...scalars, payload, updatedAt: withUpdated.updatedAt });
    const listing = catalogListingFromBody(body);
    if (listing) dbRow.catalog_listing = listing;
    const existingId = body.id as string | undefined;
    const table = TABLE_MAP[type as Exclude<OfficialType, 'species'>];

    if (existingId) {
      const nameConflict = await officialNameConflictForUpdate(
        supabase,
        table,
        existingId,
        body.name,
      );
      if (nameConflict) return nameConflict;
      const { data: beforeRow } = await officialTable(supabase, table)
        .select('*')
        .eq('id', existingId)
        .maybeSingle();
      const { data: updatedRows, error: updateError } = await officialTable(supabase, table)
        .update(dbRow)
        .eq('id', existingId)
        .select('*');
      if (updateError) {
        return apiErrorResponse(
          'Failed to update item',
          500,
          'POST /api/official/[type] (update)',
          updateError,
        );
      }
      if (updatedRows && updatedRows.length > 0) {
        let committed = false;
        try {
          committed = true;
          await recordOfficialChangeBestEffort({
            entityType: table,
            entityId: existingId,
            operation: 'update',
            changedByUserId: user.uid,
            beforeData: (beforeRow as Record<string, unknown> | null) ?? null,
            afterData: updatedRows[0] as Record<string, unknown>,
          });
          return NextResponse.json({ id: existingId });
        } finally {
          if (committed) {
            invalidateOfficialLibraryPublicCachesFromRouteHandler(table);
          }
        }
      }
      return NextResponse.json({ error: 'Official item not found' }, { status: 404 });
    }

    const id = crypto.randomUUID();
    const { data: inserted, error: insertError } = await officialTable(supabase, table)
      .insert({
        id,
        catalog_listing: listing ?? 'listed',
        ...dbRow,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();
    if (insertError) {
      return apiErrorResponse(
        'Failed to save item',
        500,
        'POST /api/official/[type] (insert)',
        insertError,
      );
    }
    let committed = false;
    try {
      committed = true;
      await recordOfficialChangeBestEffort({
        entityType: table,
        entityId: id,
        operation: 'create',
        changedByUserId: user.uid,
        beforeData: null,
        afterData: (inserted as Record<string, unknown> | null) ?? null,
      });
      return NextResponse.json({ id });
    } finally {
      if (committed) {
        invalidateOfficialLibraryPublicCachesFromRouteHandler(table);
      }
    }
  } catch (err) {
    logApiError('POST /api/official/[type]', err);
    return apiErrorResponse('Failed to save item', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const auth = await requireLiveAdminSession();
    if (!auth.ok) {
      return NextResponse.json(auth.body, { status: auth.status });
    }
    const user = { uid: auth.userId };

    const denied = verifyMutationRequest(request);
    if (denied) return denied;

    const paramResult = await validateRouteParams(params, officialLibraryTypeParamSchema);
    if (!paramResult.success) return paramResult.error;
    const { type } = paramResult.data;

    const validation = await validateJson(request, officialCatalogListingPatchSchema);
    if (!validation.success) return validation.error;

    const supabase = createServiceRoleClient();
    const table = type === 'species' ? SPECIES_TABLE : TABLE_MAP[type];
    const { data: beforeRow } = await officialTable(supabase, table)
      .select('*')
      .eq('id', validation.data.id)
      .maybeSingle();
    const { data: updatedRows, error: updateError } = await officialTable(supabase, table)
      .update({
        catalog_listing: validation.data.catalogListing,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validation.data.id)
      .select('*');
    if (updateError) {
      return apiErrorResponse(
        'Failed to update listing',
        500,
        'PATCH /api/official/[type]',
        updateError,
      );
    }
    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    const entityType = type === 'species' ? 'codex_species' : table;
    let committed = false;
    try {
      committed = true;
      await recordOfficialChangeBestEffort({
        entityType,
        entityId: validation.data.id,
        operation: 'update',
        changedByUserId: user.uid,
        beforeData: (beforeRow as Record<string, unknown> | null) ?? null,
        afterData: updatedRows[0] as Record<string, unknown>,
      });
      return NextResponse.json({
        id: validation.data.id,
        catalogListing: validation.data.catalogListing,
      });
    } finally {
      if (committed) {
        invalidateOfficialLibraryPublicCachesFromRouteHandler(table);
      }
    }
  } catch (err) {
    logApiError('PATCH /api/official/[type]', err);
    return apiErrorResponse('Failed to update listing', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const auth = await requireLiveAdminSession();
    if (!auth.ok) {
      return NextResponse.json(auth.body, { status: auth.status });
    }
    const user = { uid: auth.userId };

    const denied = verifyMutationRequest(_request);
    if (denied) return denied;

    const paramResult = await validateRouteParams(params, officialLibraryTypeParamSchema);
    if (!paramResult.success) return paramResult.error;
    const { type } = paramResult.data;

    const queryResult = validateQuery(_request, officialItemIdQuerySchema);
    if (!queryResult.success) return queryResult.error;
    const { id } = queryResult.data;

    const supabase = createServiceRoleClient();
    const table = type === 'species' ? SPECIES_TABLE : TABLE_MAP[type];
    const { data: beforeRow } = await officialTable(supabase, table)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    let committed = false;
    try {
      const { data: deleted, error: deleteError } = await officialTable(supabase, table)
        .delete()
        .eq('id', id)
        .select('id');
      if (deleteError) {
        return apiErrorResponse(
          'Failed to delete item',
          500,
          'DELETE /api/official/[type]',
          deleteError,
        );
      }
      if (!deleted || deleted.length === 0) {
        return NextResponse.json({ error: 'Item not found or already deleted' }, { status: 404 });
      }
      committed = true;
      const entityType = type === 'species' ? 'codex_species' : table;
      await recordOfficialChangeBestEffort({
        entityType,
        entityId: id,
        operation: 'delete',
        changedByUserId: user.uid,
        beforeData: (beforeRow as Record<string, unknown> | null) ?? null,
        afterData: null,
      });
      // Tombstone so the id is never handed to a different entity, which would silently
      // repoint every saved character that referenced the deleted one.
      await retireCodexId(supabase, table, id);
      return NextResponse.json({ ok: true });
    } finally {
      if (committed) {
        invalidateOfficialLibraryPublicCachesFromRouteHandler(table);
      }
    }
  } catch (err) {
    logApiError('DELETE /api/official/[type]', err);
    return apiErrorResponse('Failed to delete item', 500);
  }
}
