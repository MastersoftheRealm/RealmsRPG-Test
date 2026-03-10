/**
 * User Enhanced Items API
 * =======================
 * List and create enhanced equipment (base item + power) saved from crafting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { validateJson, enhancedItemCreateSchema } from '@/lib/api-validation';
import { standardLimiter } from '@/lib/rate-limit';
import type { UserEnhancedItem } from '@/types/crafting';

export async function GET() {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: rows } = await supabase
      .from('user_enhanced_items')
      .select('id, data, name, created_at, updated_at')
      .eq('user_id', user.uid)
      .order('updated_at', { ascending: false });

    const items: UserEnhancedItem[] = (rows ?? []).map((r) => {
      const d = ((r as { data?: unknown }).data as Record<string, unknown>) ?? {};
      return {
        id: (r as { id: string }).id,
        name: (r as { name?: string }).name ?? (d.name as string) ?? 'Enhanced item',
        baseItem: d.baseItem as UserEnhancedItem['baseItem'],
        powerRef: d.powerRef as UserEnhancedItem['powerRef'],
        description: d.description as string | undefined,
        usesType: d.usesType as string | undefined,
        usesCount: d.usesCount as number | undefined,
        potency: d.potency as number | undefined,
        createdAt: (r as { created_at?: string }).created_at ?? undefined,
        updatedAt: (r as { updated_at?: string }).updated_at ?? undefined,
      };
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error('[API Error] GET /api/user/enhanced-items:', err);
    return NextResponse.json({ error: 'Failed to load enhanced items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = standardLimiter.check(`enhanced-post:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await validateJson(request, enhancedItemCreateSchema);
    if (!validation.success) return validation.error;
    const body = validation.data as Record<string, unknown>;

    const name = body.name as string;
    const data = {
      baseItem: body.baseItem,
      powerRef: body.powerRef,
      description: body.description,
      usesType: body.usesType,
      usesCount: body.usesCount,
      potency: body.potency,
    };

    const now = new Date().toISOString();
    const supabase = await createClient();
    const id = crypto.randomUUID();
    const row = {
      id,
      user_id: user.uid,
      data,
      name,
      created_at: now,
      updated_at: now,
    };

    const { error: insertErr } = await supabase.from('user_enhanced_items').insert(row);
    if (insertErr) {
      console.error('[API Error] POST /api/user/enhanced-items:', insertErr.message);
      return NextResponse.json(
        { error: insertErr.message ?? 'Failed to create enhanced item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ id });
  } catch (err) {
    console.error('[API Error] POST /api/user/enhanced-items:', err);
    return NextResponse.json({ error: 'Failed to create enhanced item' }, { status: 500 });
  }
}
