/**
 * Campaign Character View API
 * ===========================
 * - Full view: RM only, returns full character for read-only sheet viewing.
 * - ?scope=encounter: Any campaign member can fetch minimal data for adding to encounters.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { computeMaxHealthEnergy } from '@/lib/game/calculations';
import { getOwnerLibraryForView } from '@/lib/owner-library-for-view';
import type { CharacterVisibility } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string; characterId: string }> }
) {
  try {
    const { id: campaignId, userId, characterId } = await params;
    const { user } = await getSession();
    const scope = request.nextUrl.searchParams.get('scope');

    if (!user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: campaignRow } = await supabase
      .from('campaigns')
      .select('id, owner_id, characters')
      .eq('id', campaignId)
      .maybeSingle();

    if (!campaignRow) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const { data: memberRows } = await supabase
      .from('campaign_members')
      .select('user_id')
      .eq('campaign_id', campaignId);
    const memberIds = (memberRows ?? []).map((m: { user_id: string }) => m.user_id);
    const isRM = campaignRow.owner_id === user.uid;
    const isMember = isRM || memberIds.includes(user.uid);

    const characters = (campaignRow.characters as Array<{ user_id?: string; character_id?: string; userId?: string; characterId?: string }>) ?? [];
    const isInCampaign = characters.some(
      (c) => (c.user_id ?? c.userId) === userId && (c.character_id ?? c.characterId) === characterId
    );
    if (!isInCampaign) {
      return NextResponse.json({ error: 'Character not found in campaign' }, { status: 404 });
    }

    if (!isMember) {
      return NextResponse.json({ error: 'You are not in this campaign' }, { status: 403 });
    }

    const forEncounter = scope === 'encounter';
    if (!forEncounter && !isRM) {
      return NextResponse.json({ error: 'Only the Realm Master can view player character sheets' }, { status: 403 });
    }

    const { data: charRow } = await supabase
      .from('characters')
      .select('id, user_id, data, created_at, updated_at')
      .eq('id', characterId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!charRow) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    const charData = (charRow.data as Record<string, unknown>) ?? {};

    if (!forEncounter) {
      const visibility = (charData?.visibility as CharacterVisibility) || 'private';
      if (visibility === 'private') {
        return NextResponse.json({ error: 'This character is set to private and cannot be viewed' }, { status: 403 });
      }
    }

    if (forEncounter) {
      const rawAbilities = (charData?.abilities || {}) as Record<string, number>;
      const abilities = {
        ...rawAbilities,
        acuity: rawAbilities?.acuity ?? rawAbilities?.acu ?? 0,
        agility: rawAbilities?.agility ?? rawAbilities?.agi ?? 0,
      };
      const { maxHealth, maxEnergy } = computeMaxHealthEnergy(charData as Record<string, unknown>);
      const health = charData?.health as { max?: number; current?: number } | undefined;
      const energy = charData?.energy as { max?: number; current?: number } | undefined;
      const currentHp = (charData?.currentHealth as number) ?? health?.current ?? health?.max ?? maxHealth;
      const currentEn = (charData?.currentEnergy as number) ?? energy?.current ?? energy?.max ?? maxEnergy;
      const actionPoints = (charData?.actionPoints as number) ?? 4;
      const character = {
        name: charData?.name ?? 'Unknown',
        abilities,
        health: {
          max: health?.max ?? maxHealth,
          current: currentHp,
        },
        energy: {
          max: energy?.max ?? maxEnergy,
          current: currentEn,
        },
        currentHealth: currentHp,
        currentEnergy: currentEn,
        actionPoints,
        evasion: (charData?.evasion as number) ?? 10 + abilities.agility,
      };
      return NextResponse.json(character);
    }

    const character = {
      id: charRow.id,
      ...charData,
      createdAt: charData?.createdAt ?? charRow.created_at,
      updatedAt: charData?.updatedAt ?? charRow.updated_at,
    };

    const libraryForView = await getOwnerLibraryForView(userId);
    return NextResponse.json({ ...character, libraryForView });
  } catch (error) {
    console.error('Campaign character view error:', error);
    return NextResponse.json(
      { error: 'Failed to load character' },
      { status: 500 }
    );
  }
}
