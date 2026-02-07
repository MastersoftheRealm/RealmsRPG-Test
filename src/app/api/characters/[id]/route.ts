/**
 * Character by ID API
 * ===================
 * Get, update, delete a single character. Uses Prisma. Requires Supabase session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/supabase/session';
import { removeUndefined } from '@/lib/utils/object';
import type { Character } from '@/types';

function prepareForSave(data: Partial<Character>): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, updatedAt, ...dataToSave } = data;

  const cleaned = { ...dataToSave } as Record<string, unknown>;
  delete cleaned._displayFeats;
  delete cleaned.allTraits;
  delete cleaned.defenses;
  delete cleaned.defenseBonuses;

  cleaned.updatedAt = new Date().toISOString();
  return removeUndefined(cleaned);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getSession();
  if (error || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: 'Invalid character ID' }, { status: 400 });
  }

  const row = await prisma.character.findFirst({
    where: { id: id.trim(), userId: user.uid },
  });

  if (!row) {
    return NextResponse.json(null, { status: 404 });
  }

  const d = row.data as Record<string, unknown>;
  const character: Character = {
    id: row.id,
    name: (d.name as string) || 'Unnamed',
    level: (d.level as number) || 1,
    ...d,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  } as Character;

  return NextResponse.json(character);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getSession();
  if (error || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: 'Invalid character ID' }, { status: 400 });
  }

  const data = (await request.json()) as Partial<Character>;
  const cleanedData = prepareForSave(data);

  const existing = await prisma.character.findFirst({
    where: { id: id.trim(), userId: user.uid },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  }

  const currentData = existing.data as Record<string, unknown>;
  const mergedData = { ...currentData, ...cleanedData } as Record<string, unknown>;

  await prisma.character.update({
    where: { id: id.trim() },
    data: { data: mergedData as object },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getSession();
  if (error || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: 'Invalid character ID' }, { status: 400 });
  }

  const existing = await prisma.character.findFirst({
    where: { id: id.trim(), userId: user.uid },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  }

  await prisma.character.delete({
    where: { id: id.trim() },
  });

  return NextResponse.json({ ok: true });
}
