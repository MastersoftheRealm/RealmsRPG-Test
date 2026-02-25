/**
 * Encounter API
 * ==============
 * Get, update, delete single encounter. Uses Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
    const supabase = await createClient();
    const { data: row } = await supabase
      .from('encounters')
      .select('id, user_id, data, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', user.uid)
      .maybeSingle();

    if (!row) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
    }

    const d = (row.data as Record<string, unknown>) ?? {};
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
      createdAt: (d.createdAt as string) ?? row.created_at ?? undefined,
      updatedAt: (d.updatedAt as string) ?? row.updated_at ?? undefined,
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
    const supabase = await createClient();
    const { data: row } = await supabase
      .from('encounters')
      .select('id, data')
      .eq('id', id)
      .eq('user_id', user.uid)
      .maybeSingle();

    if (!row) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
    }

    const validation = await validateJson(request, encounterUpdateSchema);
    if (!validation.success) return validation.error;
    const updates = validation.data as Partial<Omit<Encounter, 'id' | 'createdAt'>>;
    const cleaned = removeUndefined(updates as Record<string, unknown>);
    cleaned.updatedAt = new Date().toISOString();

    const current = (row.data as Record<string, unknown>) ?? {};
    const merged = { ...current, ...cleaned };

    const { error: updateErr } = await supabase
      .from('encounters')
      .update({ data: merged })
      .eq('id', id)
      .eq('user_id', user.uid);
    if (updateErr) throw updateErr;

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
    const supabase = await createClient();
    const { data: row } = await supabase
      .from('encounters')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.uid)
      .maybeSingle();

    if (!row) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
    }

    const { error: delErr } = await supabase
      .from('encounters')
      .delete()
      .eq('id', id)
      .eq('user_id', user.uid);
    if (delErr) throw delErr;

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[API Error] DELETE /api/encounters/[id]:', err);
    return NextResponse.json({ error: 'Failed to delete encounter' }, { status: 500 });
  }
}
