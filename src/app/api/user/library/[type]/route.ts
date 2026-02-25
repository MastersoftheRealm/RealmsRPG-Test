/**
 * User Library API
 * ================
 * List and create user library items. Powers, techniques, items, creatures use
 * columnar tables (same schema as official + user_id). Species uses legacy id+data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/supabase/session';
import { validateJson, libraryItemCreateSchema } from '@/lib/api-validation';
import { standardLimiter } from '@/lib/rate-limit';
import {
  COLUMNAR_LIBRARY_TYPES,
  rowToItem,
  bodyToColumnar,
  type ColumnarLibraryType,
} from '@/lib/library-columnar';

const VALID_TYPES = ['powers', 'techniques', 'items', 'creatures', 'species'] as const;
type LibraryType = (typeof VALID_TYPES)[number];

const isColumnar = (t: string): t is ColumnarLibraryType =>
  COLUMNAR_LIBRARY_TYPES.includes(t as ColumnarLibraryType);

const PRISMA_COLUMNAR = {
  powers: 'userPower',
  techniques: 'userTechnique',
  items: 'userItem',
  creatures: 'userCreature',
} as const;

type ColumnarDelegate = {
  findMany: (args: { where: { userId: string } }) => Promise<Record<string, unknown>[]>;
  findFirst: (args: { where: { id: string; userId: string } }) => Promise<Record<string, unknown> | null>;
  create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
};

function getColumnarDelegate(type: ColumnarLibraryType): ColumnarDelegate {
  return prisma[PRISMA_COLUMNAR[type]] as unknown as ColumnarDelegate;
}

type LegacyDelegate = {
  findMany: (args: { where: { userId: string } }) => Promise<Array<{ id: string; data: unknown }>>;
  findFirst: (args: { where: { id: string; userId: string } }) => Promise<{ id: string; data: unknown } | null>;
  create: (args: { data: { userId: string; data: object } }) => Promise<{ id: string }>;
};

function getLegacyDelegate(type: 'species'): LegacyDelegate {
  return prisma.userSpecies as unknown as LegacyDelegate;
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

    if (isColumnar(type)) {
      const delegate = getColumnarDelegate(type);
      const rows = await delegate.findMany({ where: { userId: user.uid } });
      const items = rows.map((r) => rowToItem(type, r, 'user'));
      items.sort((a, b) => {
        const na = String((a as Record<string, unknown>).name ?? '');
        const nb = String((b as Record<string, unknown>).name ?? '');
        return na.localeCompare(nb);
      });
      return NextResponse.json(items);
    }

    const delegate = getLegacyDelegate('species');
    const rows = await delegate.findMany({ where: { userId: user.uid } });
    const items = rows.map((r) => {
      const d = r.data as Record<string, unknown>;
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

    await prisma.userProfile.upsert({
      where: { id: user.uid },
      create: { id: user.uid },
      update: {},
    });

    if (isColumnar(type)) {
      const delegate = getColumnarDelegate(type);
      const now = new Date();

      if (duplicateOf) {
        const existing = await delegate.findFirst({
          where: { id: duplicateOf, userId: user.uid },
        });
        if (!existing) {
          return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }
        const item = rowToItem(type, existing, 'user');
        const baseName = String((item.name as string) || 'Item').trim();
        const copyData = { ...item, name: `${baseName} (Copy)` };
        delete (copyData as Record<string, unknown>).id;
        delete (copyData as Record<string, unknown>).docId;
        delete (copyData as Record<string, unknown>)._source;
        const { scalars, payload } = bodyToColumnar(type, { ...copyData, updatedAt: now });
        const newId = crypto.randomUUID();
        await delegate.create({
          data: {
            id: newId,
            userId: user.uid,
            ...scalars,
            payload: payload as object,
            createdAt: now,
            updatedAt: now,
          },
        });
        return NextResponse.json({ id: newId });
      }

      const { scalars, payload } = bodyToColumnar(type, { ...body, updatedAt: now });
      const newId = crypto.randomUUID();
      await delegate.create({
        data: {
          id: newId,
          userId: user.uid,
          ...scalars,
          payload: payload as object,
          createdAt: now,
          updatedAt: now,
        },
      });
      return NextResponse.json({ id: newId });
    }

    const delegate = getLegacyDelegate('species');
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
