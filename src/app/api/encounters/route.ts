/**
 * Encounters API
 * ==============
 * List and create encounters. Uses Prisma. Requires Supabase session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/supabase/session';
import { removeUndefined } from '@/lib/utils/object';
import { validateJson, encounterCreateSchema } from '@/lib/api-validation';
import { standardLimiter } from '@/lib/rate-limit';
import type { Encounter, EncounterSummary } from '@/types/encounter';

function toSummary(row: { id: string; data: unknown; updatedAt: Date | null; createdAt: Date | null }): EncounterSummary {
  const d = row.data as Record<string, unknown>;
  const combatants = (d.combatants as unknown[]) ?? [];
  const participants = (d.skillEncounter as { participants?: unknown[] })?.participants ?? [];
  return {
    id: row.id,
    name: (d.name as string) || 'Unnamed Encounter',
    description: d.description as string | undefined,
    type: (d.type as EncounterSummary['type']) || 'combat',
    status: (d.status as EncounterSummary['status']) || 'preparing',
    combatantCount: combatants.length,
    participantCount: participants.length,
    round: (d.round as number) ?? 0,
    updatedAt: row.updatedAt ?? undefined,
    createdAt: row.createdAt ?? undefined,
  };
}

export async function GET() {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await prisma.encounter.findMany({
      where: { userId: user.uid },
      orderBy: { updatedAt: 'desc' },
    });

    const summaries: EncounterSummary[] = rows.map(toSummary);
    return NextResponse.json(summaries);
  } catch (err) {
    console.error('[API Error] GET /api/encounters:', err);
    return NextResponse.json({ error: 'Failed to load encounters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = standardLimiter.check(`enc-post:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await validateJson(request, encounterCreateSchema);
    if (!validation.success) return validation.error;
    const data = validation.data as Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'>;

    const cleaned = removeUndefined({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Record<string, unknown>);

    const created = await prisma.encounter.create({
      data: {
        userId: user.uid,
        data: cleaned as object,
      },
    });

    return NextResponse.json({ id: created.id });
  } catch (err) {
    console.error('[API Error] POST /api/encounters:', err);
    return NextResponse.json({ error: 'Failed to create encounter' }, { status: 500 });
  }
}
