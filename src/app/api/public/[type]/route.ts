/**
 * Public Library API
 * ==================
 * GET: Public read, no auth. POST: Admin only, create/update public items.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { validateJson, publicItemSchema } from '@/lib/api-validation';

const VALID_TYPES = ['powers', 'techniques', 'items', 'creatures'] as const;
type PublicType = (typeof VALID_TYPES)[number];

const PRISMA_MAP: Record<PublicType, 'publicPower' | 'publicTechnique' | 'publicItem' | 'publicCreature'> = {
  powers: 'publicPower',
  techniques: 'publicTechnique',
  items: 'publicItem',
  creatures: 'publicCreature',
};

type ListDelegate = {
  findMany: () => Promise<Array<{ id: string; data: unknown }>>;
  create: (args: { data: { data: object } }) => Promise<{ id: string }>;
  update: (args: { where: { id: string }; data: { data: object } }) => Promise<{ id: string }>;
};

function getDelegate(type: PublicType): ListDelegate {
  return prisma[PRISMA_MAP[type]] as unknown as ListDelegate;
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

    const delegate = getDelegate(type as PublicType);
    let rows: Array<{ id: string; data: unknown }>;
    try {
      rows = await delegate.findMany();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('does not exist') || (err as { code?: string })?.code === 'P2021') {
        console.warn('[API] Public library table not found for type:', type, msg);
        return NextResponse.json([]);
      }
      throw err;
    }

    const items = rows.map((r) => {
      const d = r.data as Record<string, unknown>;
      return {
        id: r.id,
        docId: r.id,
        ...d,
        _source: 'public' as const,
      };
    });

    items.sort((a, b) => {
      const na = String((a as Record<string, unknown>).name ?? '');
      const nb = String((b as Record<string, unknown>).name ?? '');
      return na.localeCompare(nb);
    });

    return NextResponse.json(items);
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

    const delegate = getDelegate(type as PublicType);

    const existingId = body.id as string | undefined;
    const data = { ...body, updatedAt: new Date().toISOString() };
    delete (data as Record<string, unknown>).id;

    if (existingId) {
      await delegate.update({
        where: { id: existingId },
        data: { data: data as object },
      });
      return NextResponse.json({ id: existingId });
    }

    const created = await delegate.create({
      data: { data: { ...data, createdAt: new Date().toISOString() } as object },
    });
    return NextResponse.json({ id: created.id });
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
    if (!VALID_TYPES.includes(type as PublicType)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const url = new URL(_request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const delegate = getDelegate(type as PublicType) as unknown as { delete: (args: { where: { id: string } }) => Promise<unknown> };
    await delegate.delete({ where: { id } });
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
