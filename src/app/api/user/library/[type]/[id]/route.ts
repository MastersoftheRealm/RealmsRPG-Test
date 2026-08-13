/**
 * User Library Item API
 * =====================
 * Get, update, delete a single library item. Columnar for powers/techniques/items/creatures;
 * species uses legacy data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { validateJson, verifyMutationRequest, libraryItemUpdateSchema } from '@/lib/api-validation';
import { buildRateLimitKey, resolveClientIp, standardLimiter } from '@/lib/rate-limit';
import {
  COLUMNAR_LIBRARY_TYPES,
  rowToItem,
  bodyToColumnar,
  toDbRow,
  rowToItemSpecies,
  mergeLegacySpeciesRowWithImageColumns,
  bodyToColumnarSpecies,
  toDbRowSpecies,
  type ColumnarLibraryType,
} from '@/lib/library-columnar';
import { enrichRowsWithBankImageUrls } from '@/lib/entity-image-enrich-server';

const VALID_TYPES = ['powers', 'techniques', 'empowered-techniques', 'items', 'creatures', 'species'] as const;
type LibraryType = (typeof VALID_TYPES)[number];

const isColumnar = (t: string): t is ColumnarLibraryType =>
  COLUMNAR_LIBRARY_TYPES.includes(t as ColumnarLibraryType);

const TABLE: Record<ColumnarLibraryType, string> = {
  powers: 'user_powers',
  techniques: 'user_techniques',
  'empowered-techniques': 'user_empowered_techniques',
  items: 'user_items',
  creatures: 'user_creatures',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, id } = await params;
    if (!VALID_TYPES.includes(type as LibraryType) || !id?.trim()) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const supabase = await createClient();

    if (isColumnar(type)) {
      const { data: row, error: dbError } = await supabase
        .from(TABLE[type])
        .select('*')
        .eq('id', id.trim())
        .eq('user_id', user.uid)
        .maybeSingle();
      if (dbError) throw dbError;
      if (!row) return NextResponse.json(null, { status: 404 });
      const record = row as Record<string, unknown>;
      await enrichRowsWithBankImageUrls(supabase, [record]);
      return NextResponse.json(rowToItem(type, record, 'user'));
    }

    const { data: row, error: dbError } = await supabase
      .from('user_species')
      .select('*')
      .eq('id', id.trim())
      .eq('user_id', user.uid)
      .maybeSingle();
    if (dbError) throw dbError;
    if (!row) return NextResponse.json(null, { status: 404 });
    const r = row as Record<string, unknown>;
    await enrichRowsWithBankImageUrls(supabase, [r]);
    if (r.data !== undefined && r.data !== null) {
      return NextResponse.json(mergeLegacySpeciesRowWithImageColumns(r));
    }
    return NextResponse.json(rowToItemSpecies(r));
  } catch (err) {
    console.error('[API Error] GET /api/user/library/[type]/[id]:', err);
    return NextResponse.json({ error: 'Failed to load library item' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await standardLimiter.check(
      buildRateLimitKey('lib-patch', { userId: user.uid, ip: resolveClientIp(request.headers) })
    );
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { type, id } = await params;
    if (!VALID_TYPES.includes(type as LibraryType) || !id?.trim()) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const supabase = await createClient();

    if (isColumnar(type)) {
      const { data: existing, error: existingErr } = await supabase
        .from(TABLE[type])
        .select('*')
        .eq('id', id.trim())
        .eq('user_id', user.uid)
        .maybeSingle();
      if (existingErr) throw existingErr;
      if (!existing) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      const validation = await validateJson(request, libraryItemUpdateSchema);
      if (!validation.success) return validation.error;
      const data = validation.data as Record<string, unknown>;
      const currentItem = rowToItem(type, existing as Record<string, unknown>, 'user');
      const merged = { ...currentItem, ...data };
      delete (merged as Record<string, unknown>).id;
      delete (merged as Record<string, unknown>).docId;
      delete (merged as Record<string, unknown>)._source;
      merged.updatedAt = new Date();
      const { scalars, payload } = bodyToColumnar(type, merged);
      const updateRow = toDbRow({ ...scalars, payload, updatedAt: new Date() });
      const { error: updateErr } = await supabase
        .from(TABLE[type])
        .update(updateRow)
        .eq('id', id.trim())
        .eq('user_id', user.uid);
      if (updateErr) throw updateErr;
      return NextResponse.json({ ok: true });
    }

    const { data: existing, error: existingErr } = await supabase
      .from('user_species')
      .select('*')
      .eq('id', id.trim())
      .eq('user_id', user.uid)
      .maybeSingle();
    if (existingErr) throw existingErr;
    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    const validation = await validateJson(request, libraryItemUpdateSchema);
    if (!validation.success) return validation.error;
    const data = validation.data as Record<string, unknown>;
    const existingRow = existing as Record<string, unknown>;
    let merged: Record<string, unknown>;
    if (existingRow.data !== undefined && existingRow.data !== null) {
      merged = { ...(existingRow.data as Record<string, unknown>), ...data };
    } else {
      merged = { ...rowToItemSpecies(existingRow), ...data };
    }
    delete (merged as Record<string, unknown>).id;
    delete (merged as Record<string, unknown>).docId;
    delete (merged as Record<string, unknown>)._source;
    merged.updatedAt = new Date().toISOString();
    const { scalars, payload } = bodyToColumnarSpecies(merged);
    const updateRow = toDbRowSpecies({ ...scalars, payload, updated_at: merged.updatedAt });
    const { error: updateErr } = await supabase
      .from('user_species')
      .update(updateRow)
      .eq('id', id.trim())
      .eq('user_id', user.uid);
    if (updateErr) {
      if (updateErr.message?.includes('column')) {
        const { error: legErr } = await supabase
          .from('user_species')
          .update({ data: merged })
          .eq('id', id.trim())
          .eq('user_id', user.uid);
        if (legErr) throw legErr;
        return NextResponse.json({ ok: true });
      }
      throw updateErr;
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API Error] PATCH /api/user/library/[type]/[id]:', err);
    return NextResponse.json({ error: 'Failed to update library item' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const denied = verifyMutationRequest(_request);
    if (denied) return denied;

    const { success } = await standardLimiter.check(
      buildRateLimitKey('lib-del', { userId: user.uid, ip: resolveClientIp(_request.headers) })
    );
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { type, id } = await params;
    if (!VALID_TYPES.includes(type as LibraryType) || !id?.trim()) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const supabase = await createClient();

    if (isColumnar(type)) {
      const { data: existing, error: existingErr } = await supabase
        .from(TABLE[type])
        .select('id')
        .eq('id', id.trim())
        .eq('user_id', user.uid)
        .maybeSingle();
      if (existingErr) throw existingErr;
      if (!existing) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      const { error: delErr } = await supabase
        .from(TABLE[type])
        .delete()
        .eq('id', id.trim())
        .eq('user_id', user.uid);
      if (delErr) throw delErr;
      return NextResponse.json({ ok: true });
    }

    const { data: existing, error: existingErr } = await supabase
      .from('user_species')
      .select('id')
      .eq('id', id.trim())
      .eq('user_id', user.uid)
      .maybeSingle();
    if (existingErr) throw existingErr;
    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    const { error: delErr } = await supabase
      .from('user_species')
      .delete()
      .eq('id', id.trim())
      .eq('user_id', user.uid);
    if (delErr) throw delErr;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API Error] DELETE /api/user/library/[type]/[id]:', err);
    return NextResponse.json({ error: 'Failed to delete library item' }, { status: 500 });
  }
}
