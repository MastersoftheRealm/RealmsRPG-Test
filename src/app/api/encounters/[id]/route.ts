/**
 * Encounter API
 * ==============
 * Get, update, delete single encounter. Uses Prisma.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/supabase/session';
import { removeUndefined } from '@/lib/utils/object';
import { validateJson, encounterUpdateSchema } from '@/lib/api-validation';
import { standardLimiter } from '@/lib/rate-limit';
import type { Encounter } from '@/types/encounter';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
  } catch (err) {
    console.error('[API Error] GET /api/encounters/[id]:', err);
    return NextResponse.json({ error: 'Failed to load encounter' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = standardLimiter.check(`enc-patch:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

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

    const validation = await validateJson(request, encounterUpdateSchema);
    if (!validation.success) return validation.error;
    const updates = validation.data as Partial<Omit<Encounter, 'id' | 'createdAt'>>;
    const cleaned = removeUndefined(updates as Record<string, unknown>);
    cleaned.updatedAt = new Date().toISOString();

    const current = row.data as Record<string, unknown>;
    const merged = { ...current, ...cleaned };

    await prisma.encounter.update({
      where: { id },
      data: { data: merged as object },
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[API Error] PATCH /api/encounters/[id]:', err);
    return NextResponse.json({ error: 'Failed to update encounter' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = (_request as unknown as NextRequest).headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = standardLimiter.check(`enc-del:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

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
  } catch (err) {
    console.error('[API Error] DELETE /api/encounters/[id]:', err);
    return NextResponse.json({ error: 'Failed to delete encounter' }, { status: 500 });
  }
}
