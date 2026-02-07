/**
 * Encounters API
 * ==============
 * List and create encounters. Uses Prisma. Requires Supabase session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/supabase/session';
import { removeUndefined } from '@/lib/utils/object';
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
}

export async function POST(request: NextRequest) {
  const { user, error } = await getSession();
  if (error || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const data = body as Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'>;

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
}
