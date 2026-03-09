/**
 * Public Library API
 * ==================
 * GET: Public read, no auth. Prefers official_* (columnar) in public schema;
 * falls back to public_* (id+data) if official_* empty or missing. POST/DELETE: Admin only; write to official_* (columnar).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { validateJson, publicItemSchema } from '@/lib/api-validation';
import {
  rowToItem,
  bodyToColumnar,
  toDbRow,
  type ColumnarLibraryType,
} from '@/lib/library-columnar';

const VALID_TYPES = ['powers', 'techniques', 'items', 'creatures'] as const;
type PublicType = (typeof VALID_TYPES)[number];

const PUBLIC_TABLE_MAP: Record<PublicType, string> = {
  powers: 'public_powers',
  techniques: 'public_techniques',
  items: 'public_items',
  creatures: 'public_creatures',
};

const OFFICIAL_TABLE_MAP: Record<PublicType, string> = {
  powers: 'official_powers',
  techniques: 'official_techniques',
  items: 'official_items',
  creatures: 'official_creatures',
};

function isTableNotFound(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === '42P01' || /does not exist|relation.*not found/i.test(error.message ?? '');
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    if (!VALID_TYPES.includes(type as PublicType)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const supabase = await createClient();
    const officialTable = OFFICIAL_TABLE_MAP[type as PublicType];
    const result = await supabase.from(officialTable).select('*');

    if (!result.error && result.data && result.data.length > 0) {
      const items = (result.data as Record<string, unknown>[]).map((r) => {
        const item = rowToItem(type as ColumnarLibraryType, r, 'official');
        (item as Record<string, unknown>)._source = 'public';
        return item;
      });
      items.sort((a, b) => {
        const na = String((a as Record<string, unknown>).name ?? '');
        const nb = String((b as Record<string, unknown>).name ?? '');
        return na.localeCompare(nb);
      });
      const cacheControl = 'public, max-age=300, s-maxage=600, stale-while-revalidate=300';
      return NextResponse.json(items, { headers: { 'Cache-Control': cacheControl } });
    }

    const table = PUBLIC_TABLE_MAP[type as PublicType];
    const legacyResult = await supabase.from(table).select('id, data');
    if (legacyResult.error && isTableNotFound(legacyResult.error)) {
      return NextResponse.json([]);
    }
    if (legacyResult.error) throw legacyResult.error;

    const rows = (legacyResult.data ?? []) as { id: string; data?: unknown }[];
    const items = rows.map((r) => {
      const d = (r.data as Record<string, unknown>) ?? {};
      return {
        ...d,
        id: r.id,
        docId: r.id,
        _source: 'public' as const,
      };
    });
    items.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const na = String(a.name ?? '');
      const nb = String(b.name ?? '');
      return na.localeCompare(nb);
    });
    const cacheControl = 'public, max-age=300, s-maxage=600, stale-while-revalidate=300';
    return NextResponse.json(items, { headers: { 'Cache-Control': cacheControl } });
  } catch (err) {
    console.error('[API Error] GET /api/public/[type]:', err);
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
    if (!VALID_TYPES.includes(type as PublicType)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const validation = await validateJson(request, publicItemSchema);
    if (!validation.success) return validation.error;
    const body = validation.data as Record<string, unknown>;

    const now = new Date().toISOString();
    const { scalars, payload } = bodyToColumnar(type as ColumnarLibraryType, { ...body, updatedAt: now });
    const row = toDbRow({ ...scalars, payload, updatedAt: now });

    const existingId = body.id as string | undefined;
    const supabase = await createClient();
    const table = OFFICIAL_TABLE_MAP[type as PublicType];

    if (existingId) {
      await supabase.from(table).update(row).eq('id', existingId);
      return NextResponse.json({ id: existingId });
    }

    const id = crypto.randomUUID();
    await supabase.from(table).insert({
      id,
      ...row,
      created_at: now,
      updated_at: now,
    });
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[API Error] POST /api/public/[type]:', err);
    return NextResponse.json({ error: 'Failed to save item' }, { status: 500 });
  }
}

export async function DELETE(
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
    if (!VALID_TYPES.includes(type as PublicType)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const supabase = await createClient();
    await supabase.from(OFFICIAL_TABLE_MAP[type as PublicType]).delete().eq('id', id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API Error] DELETE /api/public/[type]:', err);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
