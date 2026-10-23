/**
 * Official Library API (columnar)
 * ===============================
 * GET: Public read. POST: Admin only, create/update. DELETE: Admin only.
 * Uses official_powers, official_techniques, official_items, official_creatures.
 * Species uses codex_species (Realms Codex) with the same column set as user_species.
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { codexTableWriteCacheTags, officialLibraryWriteCacheTags } from '@/lib/codex/cache-tags';
import {
  officialListMayUsePublicCdn,
  PRIVATE_MUST_REVALIDATE_CACHE_CONTROL,
  PRIVATE_NO_STORE_CACHE_CONTROL,
  PUBLIC_CDN_CACHE_CONTROL,
} from '@/lib/api/public-cdn-cache';
import { createPublicClient } from '@/lib/supabase/public-client';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getSession, requireLiveUser } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import {
  validateJson,
  verifyMutationRequest,
  publicItemSchema,
  officialCatalogListingPatchSchema,
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
} from '@/lib/official-library-get-payload';
import { allocateCodexNumericId, retireCodexId } from '@/lib/codex/id-allocation';
import {
  parseCatalogListing,
  wantsIncludeUnlisted,
  type CatalogListing,
} from '@/lib/library/catalog-listing';

const SPECIES_TABLE = 'codex_species';

const VALID_TYPES = [
  'powers',
  'techniques',
  'empowered-techniques',
  'items',
  'creatures',
  'species',
] as const;
type OfficialType = (typeof VALID_TYPES)[number];

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

function catalogListingFromBody(body: Record<string, unknown>): CatalogListing | undefined {
  const raw = body.catalogListing ?? body.catalog_listing;
  if (raw === undefined) return undefined;
  return parseCatalogListing(raw);
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

function revalidateOfficialLibraryAfterWrite(table: string): void {
  for (const tag of officialLibraryWriteCacheTags(table)) {
    revalidateTag(tag, 'max');
  }
  if (table === SPECIES_TABLE) {
    for (const tag of codexTableWriteCacheTags(table)) {
      revalidateTag(tag, 'max');
    }
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params;
    if (!VALID_TYPES.includes(type as OfficialType)) {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400, headers: { 'Cache-Control': PRIVATE_NO_STORE_CACHE_CONTROL } },
      );
    }

    // Public read via the anon (RLS-backed) client; "Anyone can read official_*"
    // / codex_species policies apply. Service role is reserved for admin writes (SEC-01).
    const includeUnlistedRequested = wantsIncludeUnlisted(request.nextUrl.searchParams);
    const includeUnlisted = await adminMayIncludeUnlisted(request);
    const { supabase, usedPublicClient } =
      await createOfficialReadClient(!includeUnlistedRequested);

    if (type === 'species') {
      try {
        const items = await fetchCachedOfficialSpeciesItems(supabase, includeUnlisted);
        const cacheControl = officialCacheControlHeader(items, {
          includeUnlisted,
          includeUnlistedRequested,
          usedPublicClient,
        });
        return NextResponse.json(items, { headers: { 'Cache-Control': cacheControl } });
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
    try {
      items = await fetchCachedOfficialColumnarItems(
        supabase,
        type as ColumnarLibraryType,
        includeUnlisted,
      );
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
    return NextResponse.json(items, { headers: { 'Cache-Control': cacheControl } });
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
    let user;
    try {
      user = await requireLiveUser();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await isAdmin(user.uid))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { type } = await params;
    if (!VALID_TYPES.includes(type as OfficialType)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const validation = await validateJson(request, publicItemSchema);
    if (!validation.success) return validation.error;
    const body = validation.data as Record<string, unknown>;

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
        const { data: updatedRows, error: updateError } = await supabase
          .from(SPECIES_TABLE)
          .update(dbRow)
          .eq('id', existingId)
          .select('id');
        if (updateError) {
          return apiErrorResponse(
            'Failed to update item',
            500,
            'POST /api/official/[type] (species update)',
            updateError,
          );
        }
        if (updatedRows && updatedRows.length > 0) {
          revalidateOfficialLibraryAfterWrite(SPECIES_TABLE);
          return NextResponse.json({ id: existingId });
        }
      }

      for (let attempt = 0; attempt < 3; attempt++) {
        const id = await allocateCodexNumericId(supabase, SPECIES_TABLE);
        const { error: insertError } = await supabase
          .from(SPECIES_TABLE)
          .insert({ id, catalog_listing: listing ?? 'listed', ...dbRow })
          .select('id')
          .single();
        if (!insertError) {
          revalidateOfficialLibraryAfterWrite(SPECIES_TABLE);
          return NextResponse.json({ id });
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
    const table = TABLE_MAP[type as ColumnarLibraryType];

    if (existingId) {
      const { data: updatedRows, error: updateError } = await supabase
        .from(table)
        .update(dbRow)
        .eq('id', existingId)
        .select('id');
      if (updateError) {
        return apiErrorResponse(
          'Failed to update item',
          500,
          'POST /api/official/[type] (update)',
          updateError,
        );
      }
      if (updatedRows && updatedRows.length > 0) {
        revalidateOfficialLibraryAfterWrite(table);
        return NextResponse.json({ id: existingId });
      }
    }

    const id = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from(table)
      .insert({
        id,
        catalog_listing: listing ?? 'listed',
        ...dbRow,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (insertError) {
      return apiErrorResponse(
        'Failed to save item',
        500,
        'POST /api/official/[type] (insert)',
        insertError,
      );
    }
    revalidateOfficialLibraryAfterWrite(table);
    return NextResponse.json({ id });
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
    let user;
    try {
      user = await requireLiveUser();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await isAdmin(user.uid))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const denied = verifyMutationRequest(request);
    if (denied) return denied;

    const { type } = await params;
    if (!VALID_TYPES.includes(type as OfficialType)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const validation = await validateJson(request, officialCatalogListingPatchSchema);
    if (!validation.success) return validation.error;

    const supabase = createServiceRoleClient();
    const table = type === 'species' ? SPECIES_TABLE : TABLE_MAP[type as ColumnarLibraryType];
    const { data: updatedRows, error: updateError } = await supabase
      .from(table)
      .update({
        catalog_listing: validation.data.catalogListing,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validation.data.id)
      .select('id');
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
    revalidateOfficialLibraryAfterWrite(table);
    return NextResponse.json({
      id: validation.data.id,
      catalogListing: validation.data.catalogListing,
    });
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
    let user;
    try {
      user = await requireLiveUser();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await isAdmin(user.uid))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const denied = verifyMutationRequest(_request);
    if (denied) return denied;

    const { type } = await params;
    if (!VALID_TYPES.includes(type as OfficialType)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const url = new URL(_request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const table = type === 'species' ? SPECIES_TABLE : TABLE_MAP[type as ColumnarLibraryType];
    const { data: deleted, error: deleteError } = await supabase
      .from(table)
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
    // Tombstone so the id is never handed to a different entity, which would silently
    // repoint every saved character that referenced the deleted one.
    await retireCodexId(supabase, table, id);
    revalidateOfficialLibraryAfterWrite(table);
    return NextResponse.json({ ok: true });
  } catch (err) {
    logApiError('DELETE /api/official/[type]', err);
    return apiErrorResponse('Failed to delete item', 500);
  }
}
