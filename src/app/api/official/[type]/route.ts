/**
 * Official Library API (columnar)
 * ===============================
 * GET: Public read. POST: Admin only, create/update. DELETE: Admin only.
 * Uses official_powers, official_techniques, official_items, official_creatures.
 * Response shape matches legacy public API (id, docId, ...fields..., _source: 'official').
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { validateJson, publicItemSchema } from '@/lib/api-validation';

const VALID_TYPES = ['powers', 'techniques', 'items', 'creatures'] as const;
type OfficialType = (typeof VALID_TYPES)[number];

const PRISMA_MAP: Record<OfficialType, 'officialPower' | 'officialTechnique' | 'officialItem' | 'officialCreature'> = {
  powers: 'officialPower',
  techniques: 'officialTechnique',
  items: 'officialItem',
  creatures: 'officialCreature',
};

/** Scalar column keys we store in columns; everything else goes in payload */
const SCALAR_KEYS: Record<OfficialType, string[]> = {
  powers: ['name', 'description', 'actionType', 'isReaction', 'innate'],
  techniques: ['name', 'description', 'actionType', 'weaponName'],
  items: ['name', 'description', 'type', 'rarity', 'armorValue', 'damageReduction'],
  creatures: ['name', 'description', 'level', 'type', 'size', 'hitPoints', 'energyPoints'],
};

function rowToItem(type: OfficialType, row: Record<string, unknown>): Record<string, unknown> {
  const payload = (row.payload as Record<string, unknown>) || {};
  const base: Record<string, unknown> = {
    id: row.id,
    docId: row.id,
    name: row.name,
    description: row.description,
    _source: 'official' as const,
  };
  if (type === 'powers') {
    base.actionType = row.actionType;
    base.isReaction = row.isReaction;
    base.innate = row.innate;
  }
  if (type === 'techniques') {
    base.actionType = row.actionType;
    base.weaponName = row.weaponName;
    if (row.weaponName && !payload.weapon) base.weapon = { name: row.weaponName };
  }
  if (type === 'items') {
    base.type = row.type;
    base.rarity = row.rarity;
    base.armorValue = row.armorValue;
    base.damageReduction = row.damageReduction;
  }
  if (type === 'creatures') {
    base.level = row.level;
    base.type = row.type;
    base.size = row.size;
    base.hitPoints = row.hitPoints;
    base.energyPoints = row.energyPoints;
  }
  base.createdAt = row.createdAt;
  base.updatedAt = row.updatedAt;
  return { ...base, ...payload };
}

const BODY_TO_PRISMA: Record<string, string> = {
  action_type: 'actionType',
  is_reaction: 'isReaction',
  weapon_name: 'weaponName',
  armor_value: 'armorValue',
  damage_reduction: 'damageReduction',
  hit_points: 'hitPoints',
  energy_points: 'energyPoints',
};

function bodyToColumnar(type: OfficialType, body: Record<string, unknown>): { scalars: Record<string, unknown>; payload: Record<string, unknown> } {
  const scalarKeys = new Set(SCALAR_KEYS[type]);
  const scalars: Record<string, unknown> = {};
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (k === 'id' || k === 'docId' || k === '_source') continue;
    const camel = BODY_TO_PRISMA[k] ?? k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (scalarKeys.has(camel) || scalarKeys.has(k)) {
      scalars[camel] = v;
    } else {
      payload[k] = v;
    }
  }
  return { scalars, payload };
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

    const model = prisma[PRISMA_MAP[type as OfficialType]] as unknown as { findMany: () => Promise<Record<string, unknown>[]> };
    let rows: Record<string, unknown>[];
    try {
      rows = await model.findMany();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('does not exist') || (err as { code?: string })?.code === 'P2021') {
        console.warn('[API] Official library table not found for type:', type, msg);
        return NextResponse.json([]);
      }
      throw err;
    }

    const items = rows.map((r) => rowToItem(type as OfficialType, r));
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

    const { scalars, payload } = bodyToColumnar(type as OfficialType, { ...body, updatedAt: new Date().toISOString() });
    const existingId = body.id as string | undefined;
    const modelName = PRISMA_MAP[type as OfficialType];
    const model = prisma[modelName] as unknown as {
      create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
      update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<{ id: string }>;
    };

    if (existingId) {
      await model.update({
        where: { id: existingId },
        data: { ...scalars, payload, updatedAt: new Date() },
      });
      return NextResponse.json({ id: existingId });
    }

    const id = crypto.randomUUID();
    const createdAt = new Date();
    const updatedAt = new Date();
    await model.create({
      data: {
        id,
        ...scalars,
        payload: payload as object,
        createdAt,
        updatedAt,
      },
    });
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

    const model = prisma[PRISMA_MAP[type as OfficialType]] as unknown as { delete: (args: { where: { id: string } }) => Promise<unknown> };
    await model.delete({ where: { id } });
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
