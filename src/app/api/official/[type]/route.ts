/**
 * Official Library API (columnar)
 * ===============================
 * GET: Public read. POST: Admin only, create/update. DELETE: Admin only.
 * Uses official_powers, official_techniques, official_items, official_creatures.
 * Species uses codex_species (Realms Codex) with the same column set as user_species.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { validateJson, publicItemSchema } from '@/lib/api-validation';
import {
  rowToItem,
  bodyToColumnar,
  toDbRow,
  rowToItemSpecies,
  bodyToColumnarSpecies,
  toDbRowSpecies,
  type ColumnarLibraryType,
} from '@/lib/library-columnar';

const SPECIES_TABLE = 'codex_species';

const VALID_TYPES = ['powers', 'techniques', 'empowered-techniques', 'items', 'creatures', 'species'] as const;
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
]);

function parseNumericId(id: unknown): number | null {
  if (typeof id !== 'string') return null;
  if (!/^\d+$/.test(id)) return null;
  const n = Number(id);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
}

async function allocateLowestUnusedSpeciesCodexId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.from(SPECIES_TABLE).select('id');
  if (error) throw error;
  const used = new Set<number>();
  let max = 0;
  for (const row of (data ?? []) as Array<{ id?: unknown }>) {
    const n = parseNumericId(row.id);
    if (n == null) continue;
    used.add(n);
    if (n > max) max = n;
  }
  for (let i = 1; i <= max + 1; i++) {
    if (!used.has(i)) return String(i);
  }
  return String(max + 1);
}

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    if (!VALID_TYPES.includes(type as OfficialType)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    if (type === 'species') {
      const { data: rows, error } = await supabase.from(SPECIES_TABLE).select('*');
      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('[API] Official library table not found for type:', type, error.message);
          return NextResponse.json([]);
        }
        throw error;
      }
      const items = (rows ?? []).map((r) => {
        const item = rowToItemSpecies(r as Record<string, unknown>);
        (item as Record<string, unknown>)._source = 'official';
        return item;
      });
      items.sort((a, b) => {
        const na = String((a as Record<string, unknown>).name ?? '');
        const nb = String((b as Record<string, unknown>).name ?? '');
        return na.localeCompare(nb);
      });
      const cacheControl = 'private, max-age=0, must-revalidate';
      return NextResponse.json(items, { headers: { 'Cache-Control': cacheControl } });
    }

    const { data: rows, error } = await supabase.from(TABLE_MAP[type as ColumnarLibraryType]).select('*');

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('[API] Official library table not found for type:', type, error.message);
        return NextResponse.json([]);
      }
      throw error;
    }

    const items = (rows ?? []).map((r) => rowToItem(type as ColumnarLibraryType, r as Record<string, unknown>, 'official'));
    items.sort((a, b) => {
      const na = String((a as Record<string, unknown>).name ?? '');
      const nb = String((b as Record<string, unknown>).name ?? '');
      return na.localeCompare(nb);
    });

    const cacheControl = 'private, max-age=0, must-revalidate';
    return NextResponse.json(items, { headers: { 'Cache-Control': cacheControl } });
  } catch (err) {
    console.error('[API Error] GET /api/official/[type]:', err);
    return NextResponse.json({ error: 'Failed to load items' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
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
      const existingId = body.id as string | undefined;

      if (existingId) {
        const { data: updatedRows, error: updateError } = await supabase
          .from(SPECIES_TABLE)
          .update(dbRow)
          .eq('id', existingId)
          .select('id');
        if (updateError) {
          console.error('[API] codex_species update failed:', updateError);
          return NextResponse.json(
            { error: 'Failed to update item', details: updateError.message },
            { status: 500 }
          );
        }
        if (updatedRows && updatedRows.length > 0) {
          return NextResponse.json({ id: existingId });
        }
      }

      for (let attempt = 0; attempt < 3; attempt++) {
        const id = await allocateLowestUnusedSpeciesCodexId(supabase);
        const { error: insertError } = await supabase.from(SPECIES_TABLE).insert({ id, ...dbRow }).select('id').single();
        if (!insertError) {
          return NextResponse.json({ id });
        }
        if (insertError.code !== '23505') {
          console.error('[API] codex_species insert failed:', insertError);
          return NextResponse.json(
            { error: 'Failed to save item', details: insertError.message },
            { status: 500 }
          );
        }
      }
      return NextResponse.json({ error: 'Failed to save item', details: 'ID allocation conflict' }, { status: 500 });
    }

    const withUpdated = { ...body, updatedAt: new Date().toISOString() };
    const { scalars, payload } = bodyToColumnar(type as ColumnarLibraryType, withUpdated);
    const dbRow = toDbRow({ ...scalars, payload, updatedAt: withUpdated.updatedAt });
    const existingId = body.id as string | undefined;
    const table = TABLE_MAP[type as ColumnarLibraryType];

    if (existingId) {
      const { data: updatedRows, error: updateError } = await supabase
        .from(table)
        .update(dbRow)
        .eq('id', existingId)
        .select('id');
      if (updateError) {
        console.error('[API] Official library update failed:', updateError);
        return NextResponse.json(
          { error: 'Failed to update item', details: updateError.message },
          { status: 500 }
        );
      }
      if (updatedRows && updatedRows.length > 0) {
        return NextResponse.json({ id: existingId });
      }
    }

    const id = crypto.randomUUID();
    const { error: insertError } = await supabase.from(table).insert({
      id,
      ...dbRow,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select('id').single();
    if (insertError) {
      console.error('[API] Official library insert failed:', insertError);
      return NextResponse.json(
        { error: 'Failed to save item', details: insertError.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[API Error] POST /api/official/[type]:', err);
    return NextResponse.json({ error: 'Failed to save item' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await isAdmin(user.uid))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

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
    const { data: deleted, error: deleteError } = await supabase.from(table).delete().eq('id', id).select('id');
    if (deleteError) {
      console.error('[API] Official library delete failed:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete item', details: deleteError.message },
        { status: 500 }
      );
    }
    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: 'Item not found or already deleted' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API Error] DELETE /api/official/[type]:', err);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
