/**
 * Official Library API (columnar)
 * ===============================
 * GET: Public read. POST: Admin only, create/update. DELETE: Admin only.
 * Uses official_powers, official_techniques, official_items, official_creatures.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

/** Row from Supabase may use snake_case columns */
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
};

function bodyToDb(type: OfficialType, body: Record<string, unknown>): Record<string, unknown> {
  const scalarKeys = new Set(SCALAR_KEYS[type]);
  const scalars: Record<string, unknown> = {};
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (k === 'id' || k === 'docId' || k === '_source') continue;
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

    const supabase = await createClient();
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
    const supabase = await createClient();
    const table = TABLE_MAP[type as OfficialType];

    if (existingId) {
      await supabase.from(table).update(dbRow).eq('id', existingId);
      return NextResponse.json({ id: existingId });
    }

    const id = crypto.randomUUID();
    await supabase.from(table).insert({
      id,
      ...dbRow,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[API Error] POST /api/official/[type]:', err);
    return NextResponse.json({ error: 'Failed to save item' }, { status: 500 });
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

    const supabase = await createClient();
    await supabase.from(TABLE_MAP[type as OfficialType]).delete().eq('id', id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API Error] DELETE /api/official/[type]:', err);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
