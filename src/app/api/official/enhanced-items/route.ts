import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAdminSession } from '@/lib/admin';
import { getGameRulesFallback } from '@/hooks/use-game-rules';
import { apiErrorResponse } from '@/lib/api-error';
import { validateJson } from '@/lib/api-validation';
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
  .strict();

// SEC-04: validate the PATCH body instead of writing raw client JSON to columns.
const enhancedPatchBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    usesType: z.enum(['full', 'partial', 'permanent']).optional(),
    usesCount: z.number().int().min(0).nullable().optional(),
    payload: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

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

export async function GET() {
  try {
    const auth = await requireAdminSession();
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
      return apiErrorResponse(
        'Failed to load official enhanced items',
        500,
        'GET /api/official/enhanced-items',
        error
      );
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    return apiErrorResponse(
      'Failed to load official enhanced items',
      500,
      'GET /api/official/enhanced-items',
      err
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json(auth.body, { status: auth.status });
    }

    const validation = await validateJson(req, enhancedBodySchema);
    if (!validation.success) return validation.error;
    const parsed = validation.data;

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
      return apiErrorResponse(
        'Failed to create enhanced item',
        500,
        'POST /api/official/enhanced-items (insert)',
        error
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(
      'Failed to create enhanced item',
      500,
      'POST /api/official/enhanced-items',
      err
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json(auth.body, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const validation = await validateJson(req, enhancedPatchBodySchema);
    if (!validation.success) return validation.error;
    const body = validation.data;

    // Build the update from only the validated, provided fields.
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.usesType !== undefined) {
      updates.uses_type = body.usesType;
      updates.uses_count = body.usesType === 'permanent' ? null : body.usesCount ?? null;
    } else if (body.usesCount !== undefined) {
      updates.uses_count = body.usesCount;
    }
    if (body.payload !== undefined) updates.payload = body.payload;

    const supabase = await createClient();
    const { error } = await supabase
      .from('official_enhanced_items')
      .update(updates)
      .eq('id', id);

    if (error) {
      return apiErrorResponse(
        'Failed to update enhanced item',
        500,
        'PATCH /api/official/enhanced-items (update)',
        error
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(
      'Failed to update enhanced item',
      500,
      'PATCH /api/official/enhanced-items',
      err
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdminSession();
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

    if (error) {
      return apiErrorResponse(
        'Failed to delete enhanced item',
        500,
        'DELETE /api/official/enhanced-items',
        error
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(
      'Failed to delete enhanced item',
      500,
      'DELETE /api/official/enhanced-items',
      err
    );
  }
}

