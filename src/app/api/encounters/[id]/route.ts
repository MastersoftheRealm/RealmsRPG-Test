/**
 * Encounter API
 * ==============
 * Get, update, delete single encounter. Uses Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { removeUndefined } from '@/lib/utils/object';
import { validateJson, verifyMutationRequest, encounterUpdateSchema } from '@/lib/api-validation';
import { apiErrorResponse, logApiError } from '@/lib/api-error';
import { buildRateLimitKey, resolveClientIp, standardLimiter } from '@/lib/rate-limit';
import type { Encounter } from '@/types/encounter';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();
    const { data: row, error: dbError } = await supabase
      .from('encounters')
      .select('id, user_id, data, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', user.uid)
      .maybeSingle();

    if (dbError) {
      return apiErrorResponse('Failed to load encounter', 500, 'GET /api/encounters/[id]', dbError);
    }

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
    logApiError('GET /api/encounters/[id]', err);
    return apiErrorResponse('Failed to load encounter', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await standardLimiter.check(
      buildRateLimitKey('enc-patch', { userId: user.uid, ip: resolveClientIp(request.headers) }),
    );
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    const { id } = await params;
    const supabase = await createClient();
    const { data: row, error: fetchError } = await supabase
      .from('encounters')
      .select('id, data')
      .eq('id', id)
      .eq('user_id', user.uid)
      .maybeSingle();

    if (fetchError) {
      return apiErrorResponse(
        'Failed to update encounter',
        500,
        'PATCH /api/encounters/[id] (fetch)',
        fetchError,
      );
    }

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

    const updatePayload: Record<string, unknown> = { data: merged };
    if (merged.name !== undefined) updatePayload.name = merged.name;
    if (merged.type !== undefined) updatePayload.type = merged.type;
    if (merged.status !== undefined) updatePayload.status = merged.status;

    const { error: updateErr } = await supabase
      .from('encounters')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user.uid);
    if (updateErr) {
      return apiErrorResponse(
        'Failed to update encounter',
        500,
        'PATCH /api/encounters/[id] (update)',
        updateErr,
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    logApiError('PATCH /api/encounters/[id]', err);
    return apiErrorResponse('Failed to update encounter', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const denied = verifyMutationRequest(_request);
    if (denied) return denied;

    const { success } = await standardLimiter.check(
      buildRateLimitKey('enc-del', { userId: user.uid, ip: resolveClientIp(_request.headers) }),
    );
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    const { id } = await params;
    const supabase = await createClient();
    const { data: row, error: fetchError } = await supabase
      .from('encounters')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.uid)
      .maybeSingle();

    if (fetchError) {
      return apiErrorResponse(
        'Failed to delete encounter',
        500,
        'DELETE /api/encounters/[id] (fetch)',
        fetchError,
      );
    }

    if (!row) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
    }

    const { error: delErr } = await supabase
      .from('encounters')
      .delete()
      .eq('id', id)
      .eq('user_id', user.uid);
    if (delErr) {
      return apiErrorResponse(
        'Failed to delete encounter',
        500,
        'DELETE /api/encounters/[id] (delete)',
        delErr,
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    logApiError('DELETE /api/encounters/[id]', err);
    return apiErrorResponse('Failed to delete encounter', 500);
  }
}
