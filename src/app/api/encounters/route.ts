/**
 * Encounters API
 * ==============
 * List and create encounters. Uses Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { removeUndefined } from '@/lib/utils/object';
import { validateJson, encounterCreateSchema } from '@/lib/api-validation';
import { apiErrorResponse, logApiError } from '@/lib/api-error';
import { standardLimiter } from '@/lib/rate-limit';
import type { EncounterSummary } from '@/types/encounter';

type Row = {
  id: string;
  data: unknown;
  updated_at: string | null;
  created_at: string | null;
  name?: string | null;
  type?: string | null;
  status?: string | null;
};

function toSummary(row: Row): EncounterSummary {
  const d = (row.data as Record<string, unknown>) ?? {};
  const combatants = (d.combatants as unknown[]) ?? [];
  const participants = (d.skillEncounter as { participants?: unknown[] })?.participants ?? [];
  return {
    id: row.id,
    name: row.name ?? (d.name as string) ?? 'Unnamed Encounter',
    description: d.description as string | undefined,
    type: (row.type as EncounterSummary['type']) ?? (d.type as EncounterSummary['type']) ?? 'combat',
    status: (row.status as EncounterSummary['status']) ?? (d.status as EncounterSummary['status']) ?? 'preparing',
    combatantCount: combatants.length,
    participantCount: participants.length,
    round: (d.round as number) ?? 0,
    updatedAt: row.updated_at ?? undefined,
    createdAt: row.created_at ?? undefined,
  };
}

export async function GET() {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: rows, error: dbError } = await supabase
      .from('encounters')
      .select('id, data, name, type, status, created_at, updated_at')
      .eq('user_id', user.uid)
      .order('updated_at', { ascending: false });

    if (dbError) {
      return apiErrorResponse('Failed to load encounters', 500, 'GET /api/encounters', dbError);
    }

    const summaries: EncounterSummary[] = (rows ?? []).map((r) => toSummary(r as Row));
    return NextResponse.json(summaries);
  } catch (err) {
    logApiError('GET /api/encounters', err);
    return apiErrorResponse('Failed to load encounters', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = await standardLimiter.check(`enc-post:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await validateJson(request, encounterCreateSchema);
    if (!validation.success) return validation.error;
    const data = validation.data;

    const now = new Date().toISOString();
    const cleaned = removeUndefined({
      ...data,
      createdAt: now,
      updatedAt: now,
    } as Record<string, unknown>);

    const supabase = await createClient();
    const id = crypto.randomUUID();
    // Build row with id first so the primary key is never omitted (encounters table has no default for id)
    const row = {
      id: id as string,
      user_id: user.uid,
      data: cleaned,
      name: (cleaned.name as string) ?? 'Unnamed Encounter',
      type: (cleaned.type as string) ?? 'combat',
      status: (cleaned.status as string) ?? 'preparing',
      created_at: now,
      updated_at: now,
    };
    const { error: insertErr } = await supabase.from('encounters').insert(row);
    if (insertErr) {
      return apiErrorResponse('Failed to create encounter', 500, 'POST /api/encounters (insert)', insertErr);
    }

    return NextResponse.json({ id });
  } catch (err) {
    logApiError('POST /api/encounters', err);
    return apiErrorResponse('Failed to create encounter', 500);
  }
}
