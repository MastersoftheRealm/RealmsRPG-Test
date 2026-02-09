/**
 * Encounter API
 * ==============
 * Get, update, delete single encounter. Uses Prisma.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/supabase/session';
import { removeUndefined } from '@/lib/utils/object';
import type { Encounter } from '@/types/encounter';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getSession();
  if (error || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const row = await prisma.encounter.findFirst({
    where: { id, userId: user.uid },
  });

  if (!row) {
    return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
  }

  const d = row.data as Record<string, unknown>;
  const encounter: Encounter = {
    id: row.id,
    name: (d.name as string) || 'Unnamed Encounter',
    description: d.description as string | undefined,
    type: (d.type as Encounter['type']) || 'combat',
    status: (d.status as Encounter['status']) || 'preparing',
    campaignId: d.campaignId as string | undefined,
    combatants: (d.combatants as Encounter['combatants']) || [],
    round: (d.round as number) ?? 0,
    currentTurnIndex: (d.currentTurnIndex as number) ?? -1,
    isActive: (d.isActive as boolean) ?? false,
    applySurprise: (d.applySurprise as boolean) ?? false,
    skillEncounter: d.skillEncounter as Encounter['skillEncounter'],
    createdAt: (d.createdAt as string) ?? row.createdAt?.toISOString(),
    updatedAt: (d.updatedAt as string) ?? row.updatedAt?.toISOString(),
  };

  return NextResponse.json(encounter);
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
  const row = await prisma.encounter.findFirst({
    where: { id, userId: user.uid },
  });

  if (!row) {
    return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
  }

  const body = await request.json();
  const updates = body as Partial<Omit<Encounter, 'id' | 'createdAt'>>;
  const cleaned = removeUndefined(updates as Record<string, unknown>);
  cleaned.updatedAt = new Date().toISOString();

  const current = row.data as Record<string, unknown>;
  const merged = { ...current, ...cleaned };

  await prisma.encounter.update({
    where: { id },
    data: { data: merged as object },
  });

  return new NextResponse(null, { status: 204 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getSession();
  if (error || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const row = await prisma.encounter.findFirst({
    where: { id, userId: user.uid },
  });

  if (!row) {
    return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
  }

  await prisma.encounter.delete({
    where: { id },
  });

  return new NextResponse(null, { status: 204 });
}
