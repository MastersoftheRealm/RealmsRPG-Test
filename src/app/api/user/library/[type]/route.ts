/**
 * User Library API
 * ================
 * List and create user library items (powers, techniques, items, creatures).
 * Uses Prisma. Requires Supabase session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/supabase/session';
import { validateJson, libraryItemCreateSchema } from '@/lib/api-validation';
import { standardLimiter } from '@/lib/rate-limit';

const VALID_TYPES = ['powers', 'techniques', 'items', 'creatures'] as const;
type LibraryType = (typeof VALID_TYPES)[number];

const PRISMA_MAP: Record<LibraryType, { model: 'userPower' | 'userTechnique' | 'userItem' | 'userCreature'; orderBy: string }> = {
  powers: { model: 'userPower', orderBy: 'name' },
  techniques: { model: 'userTechnique', orderBy: 'name' },
  items: { model: 'userItem', orderBy: 'name' },
  creatures: { model: 'userCreature', orderBy: 'name' },
};

type ListDelegate = {
  findMany: (args: { where: { userId: string } }) => Promise<Array<{ id: string; data: unknown }>>;
  findFirst: (args: { where: { id: string; userId: string } }) => Promise<{ id: string; data: unknown } | null>;
  create: (args: { data: { userId: string; data: object } }) => Promise<{ id: string }>;
};

function getDelegate(type: LibraryType): ListDelegate {
  const model = PRISMA_MAP[type].model;
  return prisma[model] as unknown as ListDelegate;
}

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

    const delegate = getDelegate(type as LibraryType);
    const rows = await delegate.findMany({
      where: { userId: user.uid },
    });

    const items = rows.map((r) => {
      const d = r.data as Record<string, unknown>;
      return {
        id: r.id,
        docId: r.id,
        ...d,
      };
    });

    // Sort by name (Prisma doesn't support orderBy on JSON) - null-safe
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
    const body = validation.data;
    const duplicateOf = body.duplicateOf as string | undefined;

    await prisma.userProfile.upsert({
      where: { id: user.uid },
      create: { id: user.uid },
      update: {},
    });

    const delegate = getDelegate(type as LibraryType);

    if (duplicateOf) {
      const existing = await delegate.findFirst({
        where: { id: duplicateOf, userId: user.uid },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      const d = existing.data as Record<string, unknown>;
      const baseData = { ...d };
      delete baseData.createdAt;
      delete baseData.updatedAt;
      const newData = {
        ...baseData,
        name: `${(baseData.name as string) || 'Item'} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const created = await delegate.create({
        data: { userId: user.uid, data: newData as object },
      });
      return NextResponse.json({ id: created.id });
    }

    const data = body as Record<string, unknown>;
    const cleaned = { ...data };
    cleaned.createdAt = new Date().toISOString();
    cleaned.updatedAt = new Date().toISOString();

    const created = await delegate.create({
      data: { userId: user.uid, data: cleaned as object },
    });
    return NextResponse.json({ id: created.id });
  } catch (err) {
    console.error('[API Error] POST /api/user/library/[type]:', err);
    return NextResponse.json({ error: 'Failed to create library item' }, { status: 500 });
  }
}
