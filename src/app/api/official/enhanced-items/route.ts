import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { getGameRulesFallback } from '@/hooks/use-game-rules';
import {
  getEnhancedCraftingRequirements,
  getEnhancedMarketPrice,
  getMultipleUseAdjustedEnergy,
} from '@/lib/game/crafting-utils';

const enhancedBodySchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    baseItemSource: z.enum(['codex', 'public', 'custom']),
    baseItemId: z.string().optional(),
    baseItemName: z.string().min(1),
    baseItemDescription: z.string().optional(),
    powerSource: z.enum(['official', 'public', 'library']),
    powerId: z.string().min(1),
    powerName: z.string().min(1),
    powerEnergy: z.number().min(0),
    usesType: z.enum(['full', 'partial', 'permanent']),
    usesCount: z.number().int().min(0).optional(),
    payload: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

function getMultipleUseIndex(
  rules: ReturnType<typeof getGameRulesFallback>['CRAFTING'],
  usesType: 'full' | 'partial' | 'permanent',
  usesCount?: number
): number {
  const table = rules.multipleUseTable ?? [];

  if (usesType === 'permanent') {
    return table.findIndex(
      (row) => row.partialRecovery === 'permanent' && row.fullRecovery === 'permanent'
    );
  }

  if (!usesCount) return -1;

  if (usesType === 'full') {
    return table.findIndex(
      (row) => typeof row.fullRecovery === 'number' && row.fullRecovery === usesCount
    );
  }

  return table.findIndex(
    (row) => typeof row.partialRecovery === 'number' && row.partialRecovery === usesCount
  );
}

async function requireAdmin():
  Promise<
    | { ok: true }
    | { ok: false; status: number; body: { error: string } }
  > {
  const { user, error } = await getSession();
  if (error || !user?.uid) {
    return { ok: false, status: 401, body: { error: 'Unauthorized' } };
  }

  const supabase = await createClient();
  const { data, error: profileErr } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.uid)
    .single();

  if (profileErr || !data || data.role !== 'admin') {
    return { ok: false, status: 403, body: { error: 'Forbidden' } };
  }

  return { ok: true };
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json(auth.body, { status: auth.status });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('official_enhanced_items')
      .select(
        'id, name, description, currency_cost, rarity, base_item_source, base_item_id, base_item_name, base_item_description, power_source, power_id, power_name, uses_type, uses_count, payload, created_at, updated_at'
      )
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[API Error] GET /api/official/enhanced-items:', err);
    return NextResponse.json(
      { error: 'Failed to load official enhanced items' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json(auth.body, { status: auth.status });
    }

    const json = await req.json();
    const parsed = enhancedBodySchema.parse(json);

    const rules = getGameRulesFallback().CRAFTING;
    const idx = getMultipleUseIndex(rules, parsed.usesType, parsed.usesCount);
    const effectiveEnergy =
      idx >= 0 ? getMultipleUseAdjustedEnergy(parsed.powerEnergy, idx, rules) : parsed.powerEnergy;

    const enhancedReq = getEnhancedCraftingRequirements(effectiveEnergy, rules);
    if (!enhancedReq) {
      return NextResponse.json(
        { error: 'No enhanced crafting row found for this energy' },
        { status: 400 }
      );
    }

    const materialCost = enhancedReq.materialCost;
    const currencyCost = getEnhancedMarketPrice(materialCost, rules);
    const rarity = enhancedReq.rarity;

    const supabase = await createClient();
    const { error } = await supabase.from('official_enhanced_items').insert({
      name: parsed.name,
      description: parsed.description ?? null,
      currency_cost: currencyCost,
      rarity,
      base_item_source: parsed.baseItemSource,
      base_item_id: parsed.baseItemId ?? null,
      base_item_name: parsed.baseItemName,
      base_item_description: parsed.baseItemDescription ?? null,
      power_source: parsed.powerSource,
      power_id: parsed.powerId,
      power_name: parsed.powerName,
      uses_type: parsed.usesType,
      uses_count: parsed.usesType === 'permanent' ? null : parsed.usesCount ?? 1,
      payload: parsed.payload ?? {},
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[API Error] POST /api/official/enhanced-items:', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'Failed to create enhanced item',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json(auth.body, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const json = await req.json();
    const supabase = await createClient();
    const { error } = await supabase
      .from('official_enhanced_items')
      .update({
        name: json.name,
        description: json.description,
        uses_type: json.usesType,
        uses_count: json.usesType === 'permanent' ? null : json.usesCount ?? null,
        payload: json.payload,
      })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[API Error] PATCH /api/official/enhanced-items:', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'Failed to update enhanced item',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json(auth.body, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('official_enhanced_items')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[API Error] DELETE /api/official/enhanced-items:', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'Failed to delete enhanced item',
      },
      { status: 500 }
    );
  }
}

