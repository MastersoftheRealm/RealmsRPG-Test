/**
 * Characters API
 * ==============
 * List and create characters. Uses Supabase. Requires Supabase session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { removeUndefined } from '@/lib/utils/object';
import { validateJson, characterCreateSchema } from '@/lib/api-validation';
import { standardLimiter } from '@/lib/rate-limit';
import { getCharacterListColumns } from '@/lib/character-list-columns';
import type { Character, CharacterSummary } from '@/types';

function prepareForSave(data: Partial<Character>): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, updatedAt, ...dataToSave } = data;

  const cleaned = { ...dataToSave } as Record<string, unknown>;
  delete cleaned._displayFeats;
  delete cleaned.allTraits;
  delete cleaned.defenses;
  delete cleaned.defenseBonuses;

  cleaned.updatedAt = new Date().toISOString();
  return removeUndefined(cleaned);
}

function prepareForCreate(data: Partial<Character>): Record<string, unknown> {
  const cleaned = prepareForSave(data);
  cleaned.createdAt = new Date().toISOString();
  return cleaned;
}

export async function GET() {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: rows } = await supabase
      .from('characters')
      .select('id, user_id, data, name, level, archetype_name, ancestry_name, status, visibility, updated_at')
      .eq('user_id', user.uid)
      .order('updated_at', { ascending: false });

    const list = (rows ?? []) as {
      id: string;
      data: unknown;
      updated_at: string | null;
      name?: string | null;
      level?: number | null;
      archetype_name?: string | null;
      ancestry_name?: string | null;
      status?: string | null;
      visibility?: string | null;
    }[];
    const characters: CharacterSummary[] = list.map((r) => {
      const d = (r.data as Record<string, unknown>) ?? {};
      const archName =
        r.archetype_name ??
        (d.archetype as { name?: string; type?: string })?.name ??
        ((d.archetype as { type?: string })?.type?.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      return {
        id: r.id,
        name: r.name ?? (d.name as string) ?? 'Unnamed',
        level: r.level ?? (d.level as number) ?? 1,
        portrait: d.portrait as string | undefined,
        archetypeName: archName ?? undefined,
        ancestryName: r.ancestry_name ?? (d.ancestry as { name?: string })?.name ?? (d.species as string),
        status: (r.status as CharacterSummary['status']) ?? (d.status as CharacterSummary['status']),
        visibility: (r.visibility as CharacterSummary['visibility']) ?? (d.visibility as CharacterSummary['visibility']) ?? 'private',
        updatedAt: r.updated_at ?? undefined,
      };
    });

    return NextResponse.json(characters);
  } catch (err) {
    console.error('[API Error] GET /api/characters:', err);
    return NextResponse.json({ error: 'Failed to load characters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = standardLimiter.check(`char-post:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await validateJson(request, characterCreateSchema);
    if (!validation.success) return validation.error;
    const { duplicateOf, ...rest } = validation.data;
    const data = rest as Partial<Character>;

    const supabase = await createClient();

    if (duplicateOf) {
      const { data: existing } = await supabase
        .from('characters')
        .select('id, data')
        .eq('id', duplicateOf)
        .eq('user_id', user.uid)
        .maybeSingle();
      if (!existing) {
        return NextResponse.json({ error: 'Character not found' }, { status: 404 });
      }
      const d = (existing.data as Record<string, unknown>) ?? {};
      const baseData = { ...d };
      delete baseData.createdAt;
      delete baseData.updatedAt;
      const newData = {
        ...baseData,
        name: `${(baseData.name as string) || 'Unnamed'} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const listCols = getCharacterListColumns(newData as Record<string, unknown>);
      const newId = crypto.randomUUID();

      await supabase.from('user_profiles').upsert({ id: user.uid }, { onConflict: 'id' });

      const { data: created, error: insertErr } = await supabase
        .from('characters')
        .insert({ id: newId, user_id: user.uid, data: newData, ...listCols })
        .select('id')
        .single();
      if (insertErr) throw insertErr;
      return NextResponse.json({ id: created.id });
    }

    const cleanedData = prepareForCreate(data);
    const listCols = getCharacterListColumns(cleanedData as Record<string, unknown>);
    const newId = crypto.randomUUID();

    await supabase.from('user_profiles').upsert({ id: user.uid }, { onConflict: 'id' });

    const { data: created, error: insertErr } = await supabase
      .from('characters')
      .insert({ id: newId, user_id: user.uid, data: cleanedData, ...listCols })
      .select('id')
      .single();
    if (insertErr) throw insertErr;
    return NextResponse.json({ id: created.id });
  } catch (err) {
    console.error('[API Error] POST /api/characters:', err);
    return NextResponse.json({ error: 'Failed to create character' }, { status: 500 });
  }
}
