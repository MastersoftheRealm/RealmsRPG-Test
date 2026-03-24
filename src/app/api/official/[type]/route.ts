/**
 * Official Library API (columnar)
 * ===============================
 * GET: Public read. POST: Admin only, create/update. DELETE: Admin only.
 * Uses official_powers, official_techniques, official_items, official_creatures.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { validateJson, publicItemSchema } from '@/lib/api-validation';
import {
  rowToItem,
  bodyToColumnar,
  toDbRow,
  type ColumnarLibraryType,
} from '@/lib/library-columnar';

const VALID_TYPES = ['powers', 'techniques', 'empowered-techniques', 'items', 'creatures'] as const;
type OfficialType = (typeof VALID_TYPES)[number];

const TABLE_MAP: Record<OfficialType, string> = {
  powers: 'official_powers',
  techniques: 'official_techniques',
  'empowered-techniques': 'official_empowered_techniques',
  items: 'official_items',
  creatures: 'official_creatures',
};

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
    const { data: rows, error } = await supabase.from(TABLE_MAP[type as OfficialType]).select('*');

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

    // Admin-edited content: avoid long-lived public cache so publishes appear after refetch
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

    const withUpdated = { ...body, updatedAt: new Date().toISOString() };
    const { scalars, payload } = bodyToColumnar(type as ColumnarLibraryType, withUpdated);
    const dbRow = toDbRow({ ...scalars, payload, updatedAt: withUpdated.updatedAt });
    const existingId = body.id as string | undefined;
    const supabase = createServiceRoleClient();
    const table = TABLE_MAP[type as OfficialType];

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
      // No row matched (e.g. stale user-library id on body) — insert as new official item
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
    const { data: deleted, error: deleteError } = await supabase
      .from(TABLE_MAP[type as OfficialType])
      .delete()
      .eq('id', id)
      .select('id');
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
