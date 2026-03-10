/**
 * Crafting Session API
 * ====================
 * Get, update, delete single crafting session. Uses Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { removeUndefined } from '@/lib/utils/object';
import { validateJson, craftingSessionUpdateSchema } from '@/lib/api-validation';
import { standardLimiter } from '@/lib/rate-limit';
import type { CraftingSession, CraftingSessionData } from '@/types/crafting';

function toSession(row: { id: string; data: unknown; created_at: string | null; updated_at: string | null }): CraftingSession {
  const d = (row.data as Record<string, unknown>) ?? {};
  return {
    id: row.id,
    data: d as unknown as CraftingSessionData,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

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
      .from('crafting_sessions')
      .select('id, user_id, data, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', user.uid)
      .maybeSingle();

    if (!row) {
      return NextResponse.json({ error: 'Crafting session not found' }, { status: 404 });
    }

    const session = toSession(row);
    return NextResponse.json(session);
  } catch (err) {
    console.error('[API Error] GET /api/crafting/[id]:', err);
    return NextResponse.json({ error: 'Failed to load crafting session' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = standardLimiter.check(`craft-patch:${ip}`);
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
      .from('crafting_sessions')
      .select('id, data')
      .eq('id', id)
      .eq('user_id', user.uid)
      .maybeSingle();

    if (!row) {
      return NextResponse.json({ error: 'Crafting session not found' }, { status: 404 });
    }

    const validation = await validateJson(request, craftingSessionUpdateSchema);
    if (!validation.success) return validation.error;
    const updates = validation.data as Partial<CraftingSessionData>;
    const cleaned = removeUndefined(updates as Record<string, unknown>);
    cleaned.updatedAt = new Date().toISOString();

    const current = (row.data as Record<string, unknown>) ?? {};
    const merged = { ...current, ...cleaned };

    const updatePayload: Record<string, unknown> = { data: merged };
    if (merged.status !== undefined) updatePayload.status = merged.status;
    if (merged.item !== undefined) {
      const item = merged.item as { name?: string; marketPrice?: number } | null;
      updatePayload.item_name = item?.name ?? null;
      updatePayload.currency_cost = (merged.materialCost as number) ?? item?.marketPrice ?? null;
    } else if (merged.customBaseItem !== undefined) {
      const custom = merged.customBaseItem as { name?: string } | null;
      if (updatePayload.item_name === undefined) updatePayload.item_name = custom?.name ?? null;
    } else if (merged.materialCost !== undefined) {
      updatePayload.currency_cost = merged.materialCost;
    }

    const { error: updateErr } = await supabase
      .from('crafting_sessions')
      .update({ ...updatePayload, updated_at: cleaned.updatedAt })
      .eq('id', id)
      .eq('user_id', user.uid);
    if (updateErr) throw updateErr;

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[API Error] PATCH /api/crafting/[id]:', err);
    return NextResponse.json({ error: 'Failed to update crafting session' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = (_request as unknown as NextRequest).headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = standardLimiter.check(`craft-del:${ip}`);
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
      .from('crafting_sessions')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.uid)
      .maybeSingle();

    if (!row) {
      return NextResponse.json({ error: 'Crafting session not found' }, { status: 404 });
    }

    const { error: delErr } = await supabase
      .from('crafting_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.uid);
    if (delErr) throw delErr;

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[API Error] DELETE /api/crafting/[id]:', err);
    return NextResponse.json({ error: 'Failed to delete crafting session' }, { status: 500 });
  }
}
