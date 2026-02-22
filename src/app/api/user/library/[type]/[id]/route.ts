/**
 * User Library Item API
 * =====================
 * Get, update, delete a single library item.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/supabase/session';
import { validateJson, libraryItemUpdateSchema } from '@/lib/api-validation';
import { standardLimiter } from '@/lib/rate-limit';

const VALID_TYPES = ['powers', 'techniques', 'items', 'creatures', 'species'] as const;
type LibraryType = (typeof VALID_TYPES)[number];

const PRISMA_MAP: Record<LibraryType, 'userPower' | 'userTechnique' | 'userItem' | 'userCreature' | 'userSpecies'> = {
  powers: 'userPower',
  techniques: 'userTechnique',
  items: 'userItem',
  creatures: 'userCreature',
  species: 'userSpecies',
};

type Delegate = {
  findFirst: (args: { where: { id: string; userId: string } }) => Promise<{ id: string; data: unknown } | null>;
  update: (args: { where: { id: string }; data: { data: object } }) => Promise<{ id: string }>;
  delete: (args: { where: { id: string } }) => Promise<{ id: string }>;
};

function getDelegate(type: LibraryType): Delegate {
  return prisma[PRISMA_MAP[type]] as unknown as Delegate;
}

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

    const delegate = getDelegate(type as LibraryType);
    const row = await delegate.findFirst({
      where: { id: id.trim(), userId: user.uid },
    });

    if (!row) {
      return NextResponse.json(null, { status: 404 });
    }

    const d = row.data as Record<string, unknown>;
    return NextResponse.json({ id: row.id, docId: row.id, ...d });
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
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = standardLimiter.check(`lib-patch:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, id } = await params;
    if (!VALID_TYPES.includes(type as LibraryType) || !id?.trim()) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const delegate = getDelegate(type as LibraryType);
    const existing = await delegate.findFirst({
      where: { id: id.trim(), userId: user.uid },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const validation = await validateJson(request, libraryItemUpdateSchema);
    if (!validation.success) return validation.error;
    const data = validation.data as Record<string, unknown>;
    const currentData = existing.data as Record<string, unknown>;
    const merged = { ...currentData, ...data };
    merged.updatedAt = new Date().toISOString();

    await delegate.update({
      where: { id: id.trim() },
      data: { data: merged as object },
    });

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
    const ip = _request.headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = standardLimiter.check(`lib-del:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, id } = await params;
    if (!VALID_TYPES.includes(type as LibraryType) || !id?.trim()) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const delegate = getDelegate(type as LibraryType);
    const existing = await delegate.findFirst({
      where: { id: id.trim(), userId: user.uid },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    await delegate.delete({
      where: { id: id.trim() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API Error] DELETE /api/user/library/[type]/[id]:', err);
    return NextResponse.json({ error: 'Failed to delete library item' }, { status: 500 });
  }
}
