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
import { validateJson, verifyMutationRequest, characterUpdateSchema } from '@/lib/api-validation';
import { prepareCharacterForSave } from '@/lib/character-save';
import { normalizeCharacterForSave, normalizeCharacterOnLoad } from '@/lib/character/schema-normalize';
import { buildRateLimitKey, resolveClientIp, standardLimiter } from '@/lib/rate-limit';
import { collectCharacterLibraryRefIds, getOwnerLibraryForView } from '@/lib/owner-library-for-view';
import { getCharacterListColumns } from '@/lib/character-list-columns';
import { fetchArchetypeNameMap } from '@/lib/game/archetype-display';
import type { Character, CharacterVisibility } from '@/types';

type CharRow = { id: string; user_id: string; data: unknown; created_at: string | null; updated_at: string | null };

function rowToCharacter(row: CharRow): Character {
  const d = normalizeCharacterOnLoad((row.data as Record<string, unknown>) ?? {});
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
    const { data: row, error: rowErr } = await supabase
      .from('characters')
      .select('id, user_id, data, created_at, updated_at')
      .eq('id', id.trim())
      .maybeSingle();
    if (rowErr) throw rowErr;

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
      const libraryForView = await getOwnerLibraryForView(
        charRow.user_id,
        collectCharacterLibraryRefIds(charRow.data)
      );
      return NextResponse.json({ character: rowToCharacter(charRow), libraryForView });
    }

    if (visibility === 'campaign' && user?.uid) {
      const { data: memberRows, error: memberErr } = await supabase
        .from('campaign_members')
        .select('campaign_id')
        .eq('user_id', user.uid);
      if (memberErr) throw memberErr;
      const memberCampaignIds = (memberRows ?? []).map((m: { campaign_id: string }) => m.campaign_id);
      const { data: ownedCampaigns, error: ownedErr } = await supabase
        .from('campaigns')
        .select('id')
        .eq('owner_id', user.uid);
      if (ownedErr) throw ownedErr;
      const ownedIds = (ownedCampaigns ?? []).map((c: { id: string }) => c.id);
      const allCampaignIds = [...new Set([...memberCampaignIds, ...ownedIds])];
      if (allCampaignIds.length > 0) {
        const { data: campaigns, error: campaignsErr } = await supabase
          .from('campaigns')
          .select('id, characters')
          .in('id', allCampaignIds);
        if (campaignsErr) throw campaignsErr;
        const list = (campaigns ?? []) as { id: string; characters: unknown }[];
        const inCampaign = list.some((c) => {
          const arr = (c.characters as Array<{ user_id?: string; character_id?: string; userId?: string; characterId?: string }>) ?? [];
          return arr.some(
            (cc) => (cc.user_id ?? cc.userId) === charRow.user_id && (cc.character_id ?? cc.characterId) === charRow.id
          );
        });
        if (inCampaign) {
          const libraryForView = await getOwnerLibraryForView(
            charRow.user_id,
            collectCharacterLibraryRefIds(charRow.data)
          );
          return NextResponse.json({ character: rowToCharacter(charRow), libraryForView });
        }
      }
    }

    return NextResponse.json(null, { status: 404 });
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
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await standardLimiter.check(
      buildRateLimitKey('char-patch', { userId: user.uid, ip: resolveClientIp(request.headers) })
    );
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ error: 'Invalid character ID' }, { status: 400 });
    }

    const validation = await validateJson(request, characterUpdateSchema);
    if (!validation.success) return validation.error;
    const data = validation.data as Partial<Character>;
    const cleanedData = prepareCharacterForSave(data);

    const supabase = await createClient();
    const { data: existing, error: existingErr } = await supabase
      .from('characters')
      .select('id, data')
      .eq('id', id.trim())
      .eq('user_id', user.uid)
      .maybeSingle();
    if (existingErr) throw existingErr;

    if (!existing) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    const currentData = (existing.data as Record<string, unknown>) ?? {};
    const mergedData = { ...currentData, ...cleanedData };
    normalizeCharacterForSave(mergedData);
    const archetypeNameById = await fetchArchetypeNameMap(supabase);
    const listCols = getCharacterListColumns(mergedData, { archetypeNameById });

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
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const denied = verifyMutationRequest(_request);
    if (denied) return denied;

    const { success } = await standardLimiter.check(
      buildRateLimitKey('char-del', { userId: user.uid, ip: resolveClientIp(_request.headers) })
    );
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ error: 'Invalid character ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: existing, error: existingErr } = await supabase
      .from('characters')
      .select('id')
      .eq('id', id.trim())
      .eq('user_id', user.uid)
      .maybeSingle();
    if (existingErr) throw existingErr;

    if (!existing) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    // Portrait cleanup is best-effort; a storage failure must not block the delete.
    try {
      const { data: files, error: listErr } = await supabase.storage.from('portraits').list(user.uid);
      if (listErr) throw listErr;
      if (files?.length) {
        const toRemove = files
          .filter((f) => f.name?.startsWith(`${id.trim()}.`))
          .map((f) => `${user.uid}/${f.name}`);
        if (toRemove.length) {
          const { error: removeErr } = await supabase.storage.from('portraits').remove(toRemove);
          if (removeErr) throw removeErr;
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
