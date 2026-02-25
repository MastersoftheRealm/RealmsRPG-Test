/**
 * User Library API
 * ================
 * List and create user library items. Powers, techniques, items, creatures use
 * columnar tables (Supabase). Species uses legacy id+data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { validateJson, libraryItemCreateSchema } from '@/lib/api-validation';
import { standardLimiter } from '@/lib/rate-limit';
import {
  COLUMNAR_LIBRARY_TYPES,
  rowToItem,
  bodyToColumnar,
  toDbRow,
  type ColumnarLibraryType,
} from '@/lib/library-columnar';

const VALID_TYPES = ['powers', 'techniques', 'items', 'creatures', 'species'] as const;
type LibraryType = (typeof VALID_TYPES)[number];

const isColumnar = (t: string): t is ColumnarLibraryType =>
  COLUMNAR_LIBRARY_TYPES.includes(t as ColumnarLibraryType);

const TABLE: Record<ColumnarLibraryType, string> = {
  powers: 'user_powers',
  techniques: 'user_techniques',
  items: 'user_items',
  creatures: 'user_creatures',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await params;
    if (!VALID_TYPES.includes(type as LibraryType)) {
      return NextResponse.json({ error: 'Invalid library type' }, { status: 400 });
    }

    const supabase = await createClient();

    if (isColumnar(type)) {
      const { data: rows } = await supabase
        .from(TABLE[type])
        .select('*')
        .eq('user_id', user.uid);
      const list = (rows ?? []) as Record<string, unknown>[];
      const items = list.map((r) => rowToItem(type, r, 'user'));
      items.sort((a, b) => {
        const na = String((a as Record<string, unknown>).name ?? '');
        const nb = String((b as Record<string, unknown>).name ?? '');
        return na.localeCompare(nb);
      });
      return NextResponse.json(items);
    }

    const { data: rows } = await supabase.from('user_species').select('id, data').eq('user_id', user.uid);
    const list = (rows ?? []) as { id: string; data: unknown }[];
    const items = list.map((r) => {
      const d = (r.data as Record<string, unknown>) ?? {};
      return { id: r.id, docId: r.id, ...d };
    });
    items.sort((a, b) => {
      const na = String((a as Record<string, unknown>).name ?? '');
      const nb = String((b as Record<string, unknown>).name ?? '');
      return na.localeCompare(nb);
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error('[API Error] GET /api/user/library/[type]:', err);
    return NextResponse.json({ error: 'Failed to load library items' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = standardLimiter.check(`lib-post:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await params;
    if (!VALID_TYPES.includes(type as LibraryType)) {
      return NextResponse.json({ error: 'Invalid library type' }, { status: 400 });
    }

    const validation = await validateJson(request, libraryItemCreateSchema);
    if (!validation.success) return validation.error;
    const body = validation.data as Record<string, unknown>;
    const duplicateOf = body.duplicateOf as string | undefined;

    const supabase = await createClient();
    await supabase.from('user_profiles').upsert({ id: user.uid }, { onConflict: 'id' });

    if (isColumnar(type)) {
      const table = TABLE[type];
      const now = new Date();

      if (duplicateOf) {
        const { data: existing } = await supabase
          .from(table)
          .select('*')
          .eq('id', duplicateOf)
          .eq('user_id', user.uid)
          .maybeSingle();
        if (!existing) {
          return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }
        const item = rowToItem(type, existing as Record<string, unknown>, 'user');
        const baseName = String((item.name as string) || 'Item').trim();
        const copyData = { ...item, name: `${baseName} (Copy)` };
        delete (copyData as Record<string, unknown>).id;
        delete (copyData as Record<string, unknown>).docId;
        delete (copyData as Record<string, unknown>)._source;
        const { scalars, payload } = bodyToColumnar(type, { ...copyData, updatedAt: now });
        const newId = crypto.randomUUID();
        const row = toDbRow({
          id: newId,
          userId: user.uid,
          ...scalars,
          payload,
          createdAt: now,
          updatedAt: now,
        });
        const { error: insertErr } = await supabase.from(table).insert(row);
        if (insertErr) throw insertErr;
        return NextResponse.json({ id: newId });
      }

      const { scalars, payload } = bodyToColumnar(type, { ...body, updatedAt: now });
      const newId = crypto.randomUUID();
      const row = toDbRow({
        id: newId,
        userId: user.uid,
        ...scalars,
        payload,
        createdAt: now,
        updatedAt: now,
      });
      const { error: insertErr } = await supabase.from(table).insert(row);
      if (insertErr) throw insertErr;
      return NextResponse.json({ id: newId });
    }

    if (duplicateOf) {
      const { data: existing } = await supabase
        .from('user_species')
        .select('id, data')
        .eq('id', duplicateOf)
        .eq('user_id', user.uid)
        .maybeSingle();
      if (!existing) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      const d = (existing.data as Record<string, unknown>) ?? {};
      const newData = {
        ...d,
        name: `${(d.name as string) || 'Item'} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const { data: created, error: insertErr } = await supabase
        .from('user_species')
        .insert({ user_id: user.uid, data: newData })
        .select('id')
        .single();
      if (insertErr) throw insertErr;
      return NextResponse.json({ id: created.id });
    }

    const data = body as Record<string, unknown>;
    const cleaned = { ...data };
    cleaned.createdAt = new Date().toISOString();
    cleaned.updatedAt = new Date().toISOString();
    const { data: created, error: insertErr } = await supabase
      .from('user_species')
      .insert({ user_id: user.uid, data: cleaned })
      .select('id')
      .single();
    if (insertErr) throw insertErr;
    return NextResponse.json({ id: created.id });
  } catch (err) {
    console.error('[API Error] POST /api/user/library/[type]:', err);
    return NextResponse.json({ error: 'Failed to create library item' }, { status: 500 });
  }
}
