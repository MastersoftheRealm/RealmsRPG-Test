/**
 * Official Library API (columnar)
 * ===============================
 * GET: Public read. POST: Admin only, create/update. DELETE: Admin only.
 * Uses official_powers, official_techniques, official_items, official_creatures.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { validateJson, publicItemSchema } from '@/lib/api-validation';

const VALID_TYPES = ['powers', 'techniques', 'items', 'creatures'] as const;
type OfficialType = (typeof VALID_TYPES)[number];

const TABLE_MAP: Record<OfficialType, string> = {
  powers: 'official_powers',
  techniques: 'official_techniques',
  items: 'official_items',
  creatures: 'official_creatures',
};

/** Row from Supabase may use snake_case columns. Prefer columnar columns over payload when present. */
function rowToItem(type: OfficialType, row: Record<string, unknown>): Record<string, unknown> {
  const r = row as Record<string, unknown>;
  const payload = (r.payload as Record<string, unknown>) || {};
  const actionType = r.action_type ?? r.actionType;
  const createdAt = r.created_at ?? r.createdAt;
  const updatedAt = r.updated_at ?? r.updatedAt;
  const base: Record<string, unknown> = {
    id: r.id,
    docId: r.id,
    name: r.name,
    description: r.description,
    _source: 'official' as const,
    createdAt,
    updatedAt,
  };
  if (type === 'powers') {
    base.actionType = actionType;
    base.isReaction = r.is_reaction ?? r.isReaction;
    base.innate = r.innate;
    const rangeSteps = r.range_steps as number | undefined | null;
    const durationType = r.duration_type as string | undefined | null;
    const durationValue = r.duration_value as number | undefined | null;
    const areaType = r.area_type as string | undefined | null;
    const areaLevel = r.area_level as number | undefined | null;
    const damageCol = r.damage as unknown[] | undefined;
    const payRange = payload.range as Record<string, unknown> | undefined;
    const payDuration = payload.duration as Record<string, unknown> | undefined;
    const payArea = payload.area as Record<string, unknown> | undefined;
    if (rangeSteps != null) base.range = { ...payRange, steps: rangeSteps };
    if (durationType != null || durationValue != null)
      base.duration = { ...payDuration, type: durationType ?? payDuration?.type, value: durationValue ?? payDuration?.value };
    if (areaType != null || areaLevel != null)
      base.area = { ...payArea, type: areaType ?? payArea?.type, level: areaLevel ?? payArea?.level };
    if (damageCol != null && Array.isArray(damageCol)) base.damage = damageCol;
  }
  if (type === 'techniques') {
    base.actionType = actionType;
    base.weaponName = r.weapon_name ?? r.weaponName;
    if (base.weaponName && !payload.weapon) base.weapon = { name: base.weaponName };
  }
  if (type === 'items') {
    base.type = r.type;
    base.rarity = r.rarity;
    base.armorValue = r.armor_value ?? r.armorValue;
    base.damageReduction = r.damage_reduction ?? r.damageReduction;
  }
  if (type === 'creatures') {
    base.level = r.level;
    base.type = r.type;
    base.size = r.size;
    base.hitPoints = r.hit_points ?? r.hitPoints;
    base.energyPoints = r.energy_points ?? r.energyPoints;
  }
  return { ...base, ...payload };
}

const SCALAR_KEYS: Record<OfficialType, string[]> = {
  powers: ['name', 'description', 'actionType', 'isReaction', 'innate'],
  techniques: ['name', 'description', 'actionType', 'weaponName'],
  items: ['name', 'description', 'type', 'rarity', 'armorValue', 'damageReduction'],
  creatures: ['name', 'description', 'level', 'type', 'size', 'hitPoints', 'energyPoints'],
};

const CAMEL_TO_SNAKE: Record<string, string> = {
  actionType: 'action_type',
  isReaction: 'is_reaction',
  weaponName: 'weapon_name',
  armorValue: 'armor_value',
  damageReduction: 'damage_reduction',
  hitPoints: 'hit_points',
  energyPoints: 'energy_points',
  rangeSteps: 'range_steps',
  durationType: 'duration_type',
  durationValue: 'duration_value',
  areaType: 'area_type',
  areaLevel: 'area_level',
};

function bodyToDb(type: OfficialType, body: Record<string, unknown>): Record<string, unknown> {
  const scalarKeys = new Set(SCALAR_KEYS[type]);
  const scalars: Record<string, unknown> = {};
  const payload: Record<string, unknown> = {};

  if (type === 'powers') {
    const range = body.range as { steps?: number } | undefined;
    const duration = body.duration as { type?: string; value?: number } | undefined;
    const area = body.area as { type?: string; level?: number } | undefined;
    if (range?.steps != null) scalars.range_steps = range.steps;
    if (duration?.type != null) scalars.duration_type = duration.type;
    if (duration?.value != null) scalars.duration_value = duration.value;
    if (area?.type != null) scalars.area_type = area.type;
    if (area?.level != null) scalars.area_level = area.level;
    if (Array.isArray(body.damage) && body.damage.length > 0) scalars.damage = body.damage;
  }

  for (const [k, v] of Object.entries(body)) {
    if (k === 'id' || k === 'docId' || k === '_source') continue;
    if (type === 'powers' && (k === 'range' || k === 'duration' || k === 'area' || k === 'damage')) continue;
    const camel = k.startsWith('_') ? k : k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    const key = scalarKeys.has(camel) ? camel : scalarKeys.has(k) ? k : null;
    if (key) {
      const dbCol = CAMEL_TO_SNAKE[key] ?? key;
      scalars[dbCol] = v;
    } else {
      payload[k] = v;
    }
  }
  return { ...scalars, payload };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    if (!VALID_TYPES.includes(type as OfficialType)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data: rows, error } = await supabase.from(TABLE_MAP[type as OfficialType]).select('*');

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('[API] Official library table not found for type:', type, error.message);
        return NextResponse.json([]);
      }
      throw error;
    }

    const items = (rows ?? []).map((r) => rowToItem(type as OfficialType, r as Record<string, unknown>));
    items.sort((a, b) => {
      const na = String((a as Record<string, unknown>).name ?? '');
      const nb = String((b as Record<string, unknown>).name ?? '');
      return na.localeCompare(nb);
    });

    const cacheControl = 'public, max-age=300, s-maxage=600, stale-while-revalidate=300';
    return NextResponse.json(items, { headers: { 'Cache-Control': cacheControl } });
  } catch (err) {
    console.error('[API Error] GET /api/official/[type]:', err);
    return NextResponse.json({ error: 'Failed to load items' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await isAdmin(user.uid))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { type } = await params;
    if (!VALID_TYPES.includes(type as OfficialType)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const validation = await validateJson(request, publicItemSchema);
    if (!validation.success) return validation.error;
    const body = validation.data as Record<string, unknown>;

    const withUpdated = { ...body, updatedAt: new Date().toISOString() };
    const dbRow = bodyToDb(type as OfficialType, withUpdated);
    const existingId = body.id as string | undefined;
    const supabase = createServiceRoleClient();
    const table = TABLE_MAP[type as OfficialType];

    if (existingId) {
      const { error: updateError } = await supabase.from(table).update(dbRow).eq('id', existingId).select('id').single();
      if (updateError) {
        console.error('[API] Official library update failed:', updateError);
        return NextResponse.json(
          { error: 'Failed to update item', details: updateError.message },
          { status: 500 }
        );
      }
      return NextResponse.json({ id: existingId });
    }

    const id = crypto.randomUUID();
    const { error: insertError } = await supabase.from(table).insert({
      id,
      ...dbRow,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select('id').single();
    if (insertError) {
      console.error('[API] Official library insert failed:', insertError);
      return NextResponse.json(
        { error: 'Failed to save item', details: insertError.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[API Error] POST /api/official/[type]:', err);
    return NextResponse.json(
      { error: 'Failed to save item', details: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await isAdmin(user.uid))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { type } = await params;
    if (!VALID_TYPES.includes(type as OfficialType)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const url = new URL(_request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data: deleted, error: deleteError } = await supabase
      .from(TABLE_MAP[type as OfficialType])
      .delete()
      .eq('id', id)
      .select('id');
    if (deleteError) {
      console.error('[API] Official library delete failed:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete item', details: deleteError.message },
        { status: 500 }
      );
    }
    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: 'Item not found or already deleted' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[API Error] DELETE /api/official/[type]:', err);
    return NextResponse.json(
      { error: 'Failed to delete item', details: message },
      { status: 500 }
    );
  }
}
