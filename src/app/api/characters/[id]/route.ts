/**
 * Character by ID API
 * ===================
 * Get, update, delete a single character. Uses Prisma.
 * GET: Owner always; unauthenticated or other users when visibility is 'public';
 *      when visibility is 'campaign', any campaign member who shares a campaign with this character can read.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/supabase/session';
import { removeUndefined } from '@/lib/utils/object';
import { getOwnerLibraryForView } from '@/lib/owner-library-for-view';
import type { Character, CharacterVisibility } from '@/types';

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

function rowToCharacter(row: { id: string; userId: string; data: unknown; createdAt: Date | null; updatedAt: Date | null }): Character {
  const d = row.data as Record<string, unknown>;
  return {
    id: row.id,
    userId: row.userId,
    name: (d.name as string) || 'Unnamed',
    level: (d.level as number) || 1,
    ...d,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  } as Character;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await getSession();
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: 'Invalid character ID' }, { status: 400 });
  }

  const row = await prisma.character.findFirst({
    where: { id: id.trim() },
  });

  if (!row) {
    return NextResponse.json(null, { status: 404 });
  }

  const isOwner = user?.uid === row.userId;
  if (isOwner) {
    return NextResponse.json(rowToCharacter(row));
  }

  const visibility = ((row.data as Record<string, unknown>)?.visibility as CharacterVisibility) ?? 'private';
  if (visibility === 'public') {
    const libraryForView = await getOwnerLibraryForView(row.userId);
    return NextResponse.json({ character: rowToCharacter(row), libraryForView });
  }

  if (visibility === 'campaign' && user?.uid) {
    const campaigns = await prisma.campaign.findMany({
      select: { id: true, ownerId: true, memberIds: true, characters: true },
    });
    const userCampaigns = campaigns.filter(
      (c) => c.ownerId === user.uid || (c.memberIds as string[])?.includes(user.uid)
    );
    const inCampaign = userCampaigns.some((c) => {
      const list = (c.characters as Array<{ userId: string; characterId: string }>) || [];
      return list.some((cc) => cc.userId === row.userId && cc.characterId === row.id);
    });
    if (inCampaign) {
      const libraryForView = await getOwnerLibraryForView(row.userId);
      return NextResponse.json({ character: rowToCharacter(row), libraryForView });
    }
  }

  return NextResponse.json({ error: 'Character not found or not visible' }, { status: 403 });
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
