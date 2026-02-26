/**
 * Public Library API
 * ==================
 * GET: Public read, no auth. POST: Admin only, create/update public items.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { validateJson, publicItemSchema } from '@/lib/api-validation';

const VALID_TYPES = ['powers', 'techniques', 'items', 'creatures'] as const;
type PublicType = (typeof VALID_TYPES)[number];

const TABLE_MAP: Record<PublicType, string> = {
  powers: 'public_powers',
  techniques: 'public_techniques',
  items: 'public_items',
  creatures: 'public_creatures',
};

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
    const table = TABLE_MAP[type as PublicType];
    const { data: rows, error } = await supabase.from(table).select('id, data');

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('[API] Public library table not found for type:', type, error.message);
        return NextResponse.json([]);
      }
      throw error;
    }

    const items = (rows ?? []).map((r: { id: string; data: unknown }) => {
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

    const existingId = body.id as string | undefined;
    const data = { ...body, updatedAt: new Date().toISOString() };
    delete (data as Record<string, unknown>).id;

    const supabase = await createClient();
    const table = TABLE_MAP[type as PublicType];

    if (existingId) {
      await supabase.from(table).update({ data: data as object }).eq('id', existingId);
      return NextResponse.json({ id: existingId });
    }

    const id = crypto.randomUUID();
    const insert = { id, data: { ...data, createdAt: new Date().toISOString() } as object };
    await supabase.from(table).insert(insert);
    return NextResponse.json({ id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[API Error] POST /api/public/[type]:', err);
    return NextResponse.json(
      { error: 'Failed to save item', details: message },
      { status: 500 }
    );
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
    await supabase.from(TABLE_MAP[type as PublicType]).delete().eq('id', id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[API Error] DELETE /api/public/[type]:', err);
    return NextResponse.json(
      { error: 'Failed to delete item', details: message },
      { status: 500 }
    );
  }
}
