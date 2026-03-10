/**
 * Crafting Sessions API
 * =====================
 * List and create crafting sessions. Uses Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { removeUndefined } from '@/lib/utils/object';
import { validateJson, craftingSessionCreateSchema } from '@/lib/api-validation';
import { standardLimiter } from '@/lib/rate-limit';
import type { CraftingSessionSummary, CraftingSessionData } from '@/types/crafting';

type Row = {
  id: string;
  data: unknown;
  updated_at: string | null;
  created_at: string | null;
  status?: string | null;
  item_name?: string | null;
  currency_cost?: number | null;
};

function toSummary(row: Row): CraftingSessionSummary {
  const d = (row.data as Record<string, unknown>) ?? {};
  const item = d.item as { name?: string } | null;
  const currencyCost = (row.currency_cost as number) ?? (d.materialCost as number) ?? (item && (d.item as { marketPrice?: number }).marketPrice) ?? 0;
  return {
    id: row.id,
    status: (row.status as CraftingSessionSummary['status']) ?? (d.status as CraftingSessionSummary['status']) ?? 'planned',
    itemName: (row.item_name as string) ?? (item?.name as string) ?? 'No item',
    currencyCost: Number(currencyCost),
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
    const { data: rows } = await supabase
      .from('crafting_sessions')
      .select('id, data, status, item_name, currency_cost, created_at, updated_at')
      .eq('user_id', user.uid)
      .order('updated_at', { ascending: false });

    const summaries: CraftingSessionSummary[] = (rows ?? []).map((r) => toSummary(r as Row));
    return NextResponse.json(summaries);
  } catch (err) {
    console.error('[API Error] GET /api/crafting:', err);
    return NextResponse.json({ error: 'Failed to load crafting sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = standardLimiter.check(`craft-post:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await validateJson(request, craftingSessionCreateSchema);
    if (!validation.success) return validation.error;
    const data = validation.data as CraftingSessionData;

    const now = new Date().toISOString();
    const cleaned = removeUndefined({
      ...data,
      status: data.status ?? 'planned',
      createdAt: now,
      updatedAt: now,
    } as Record<string, unknown>);

    const item = (cleaned.item as { name?: string; marketPrice?: number } | null) ?? null;
    const customBase = cleaned.customBaseItem as { name?: string } | null | undefined;
    const itemName = item?.name ?? customBase?.name ?? null;
    const currencyCost = (cleaned.materialCost as number) ?? item?.marketPrice ?? null;

    const supabase = await createClient();
    const id = crypto.randomUUID();
    const row = {
      id: id as string,
      user_id: user.uid,
      data: cleaned,
      status: (cleaned.status as string) ?? 'planned',
      item_name: itemName,
      currency_cost: currencyCost,
      created_at: now,
      updated_at: now,
    };
    const { error: insertErr } = await supabase.from('crafting_sessions').insert(row);
    if (insertErr) {
      console.error('[API Error] POST /api/crafting insert:', insertErr.message, insertErr.details);
      return NextResponse.json(
        { error: `Failed to create crafting session: ${insertErr.message ?? 'Database error'}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ id });
  } catch (err) {
    console.error('[API Error] POST /api/crafting:', err);
    return NextResponse.json({ error: 'Failed to create crafting session' }, { status: 500 });
  }
}
