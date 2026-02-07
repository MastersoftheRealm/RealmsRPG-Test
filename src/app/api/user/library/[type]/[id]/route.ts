/**
 * User Library Item API
 * =====================
 * Get, update, delete a single library item.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/supabase/session';

const VALID_TYPES = ['powers', 'techniques', 'items', 'creatures'] as const;
type LibraryType = (typeof VALID_TYPES)[number];

const PRISMA_MAP: Record<LibraryType, 'userPower' | 'userTechnique' | 'userItem' | 'userCreature'> = {
  powers: 'userPower',
  techniques: 'userTechnique',
  items: 'userItem',
  creatures: 'userCreature',
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
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
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

  const data = (await request.json()) as Record<string, unknown>;
  const currentData = existing.data as Record<string, unknown>;
  const merged = { ...currentData, ...data };
  merged.updatedAt = new Date().toISOString();

  await delegate.update({
    where: { id: id.trim() },
    data: { data: merged as object },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
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
}
