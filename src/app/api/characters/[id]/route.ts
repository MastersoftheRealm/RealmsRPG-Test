/**
 * Character by ID API
 * ===================
 * Get, update, delete a single character. Uses Supabase.
 * GET: Owner always; unauthenticated or other users when visibility is 'public';
 *      when visibility is 'campaign', any campaign member who shares a campaign with this character can read.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { removeUndefined } from '@/lib/utils/object';
import { validateJson, characterUpdateSchema } from '@/lib/api-validation';
import { standardLimiter } from '@/lib/rate-limit';
import { getOwnerLibraryForView } from '@/lib/owner-library-for-view';
import { getCharacterListColumns } from '@/lib/character-list-columns';
import type { Character, CharacterVisibility } from '@/types';

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

type CharRow = { id: string; user_id: string; data: unknown; created_at: string | null; updated_at: string | null };

function rowToCharacter(row: CharRow): Character {
  const d = (row.data as Record<string, unknown>) ?? {};
  return {
    id: row.id,
    userId: row.user_id,
    name: (d.name as string) || 'Unnamed',
    level: (d.level as number) || 1,
    ...d,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as Character;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getSession();
    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ error: 'Invalid character ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: row } = await supabase
      .from('characters')
      .select('id, user_id, data, created_at, updated_at')
      .eq('id', id.trim())
      .maybeSingle();

    if (!row) {
      return NextResponse.json(null, { status: 404 });
    }

    const charRow = row as CharRow;
    const isOwner = user?.uid === charRow.user_id;
    if (isOwner) {
      return NextResponse.json({ character: rowToCharacter(charRow) });
    }

    const visibility = ((charRow.data as Record<string, unknown>)?.visibility as CharacterVisibility) ?? 'private';
    if (visibility === 'public') {
      const libraryForView = await getOwnerLibraryForView(charRow.user_id);
      return NextResponse.json({ character: rowToCharacter(charRow), libraryForView });
    }

    if (visibility === 'campaign' && user?.uid) {
      const { data: memberRows } = await supabase
        .from('campaign_members')
        .select('campaign_id')
        .eq('user_id', user.uid);
      const memberCampaignIds = (memberRows ?? []).map((m: { campaign_id: string }) => m.campaign_id);
      const { data: ownedCampaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('owner_id', user.uid);
      const ownedIds = (ownedCampaigns ?? []).map((c: { id: string }) => c.id);
      const allCampaignIds = [...new Set([...memberCampaignIds, ...ownedIds])];
      if (allCampaignIds.length > 0) {
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id, characters')
          .in('id', allCampaignIds);
        const list = (campaigns ?? []) as { id: string; characters: unknown }[];
        const inCampaign = list.some((c) => {
          const arr = (c.characters as Array<{ user_id?: string; character_id?: string; userId?: string; characterId?: string }>) ?? [];
          return arr.some(
            (cc) => (cc.user_id ?? cc.userId) === charRow.user_id && (cc.character_id ?? cc.characterId) === charRow.id
          );
        });
        if (inCampaign) {
          const libraryForView = await getOwnerLibraryForView(charRow.user_id);
          return NextResponse.json({ character: rowToCharacter(charRow), libraryForView });
        }
      }
    }

    return NextResponse.json({ error: 'Character not found or not visible' }, { status: 403 });
  } catch (err) {
    console.error('[API Error] GET /api/characters/[id]:', err);
    return NextResponse.json({ error: 'Failed to load character' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = standardLimiter.check(`char-patch:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ error: 'Invalid character ID' }, { status: 400 });
    }

    const validation = await validateJson(request, characterUpdateSchema);
    if (!validation.success) return validation.error;
    const data = validation.data as Partial<Character>;
    const cleanedData = prepareForSave(data);

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from('characters')
      .select('id, data')
      .eq('id', id.trim())
      .eq('user_id', user.uid)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    const currentData = (existing.data as Record<string, unknown>) ?? {};
    const mergedData = { ...currentData, ...cleanedData };
    const listCols = getCharacterListColumns(mergedData);

    const { error: updateErr } = await supabase
      .from('characters')
      .update({ data: mergedData, ...listCols })
      .eq('id', id.trim())
      .eq('user_id', user.uid);
    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API Error] PATCH /api/characters/[id]:', err);
    return NextResponse.json({ error: 'Failed to update character' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = _request.headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = standardLimiter.check(`char-del:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ error: 'Invalid character ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from('characters')
      .select('id')
      .eq('id', id.trim())
      .eq('user_id', user.uid)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    try {
      const { data: files } = await supabase.storage.from('portraits').list(user.uid);
      if (files?.length) {
        const toRemove = files
          .filter((f) => f.name?.startsWith(`${id.trim()}.`))
          .map((f) => `${user.uid}/${f.name}`);
        if (toRemove.length) {
          await supabase.storage.from('portraits').remove(toRemove);
        }
      }
    } catch (storageErr) {
      console.warn('[API] Could not delete portrait from storage:', storageErr);
    }

    const { error: delErr } = await supabase
      .from('characters')
      .delete()
      .eq('id', id.trim())
      .eq('user_id', user.uid);
    if (delErr) throw delErr;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API Error] DELETE /api/characters/[id]:', err);
    return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 });
  }
}
