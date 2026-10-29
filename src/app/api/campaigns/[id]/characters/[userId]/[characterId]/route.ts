/**
 * Campaign Character View API
 * ===========================
 * - Full view: RM always; campaign members when visibility is campaign or public (column is SoT).
 * - ?scope=encounter: Same visibility rules; returns minimal vitals only.
 * - Private: owner and RM only. Campaign visibility requires campaign membership (this route).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { isCharacterOnCampaignRoster } from '@/lib/campaign-roster';
import {
  campaignCharacterRouteParamsSchema,
  campaignCharacterViewQuerySchema,
  validateQuery,
  validateRouteParams,
} from '@/lib/api-validation';
import { computeMaxHealthEnergy } from '@/lib/game/calculations';
import { fetchCoreRules } from '@/lib/core-rules-server';
import { getOwnerLibraryAndEnrichmentForView } from '@/lib/character-view-enrichment-server';
import { resolveCharacterVisibility } from '@/lib/character-list-columns';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string; characterId: string }> },
) {
  try {
    const { user } = await getSession();
    if (!user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paramResult = await validateRouteParams(params, campaignCharacterRouteParamsSchema);
    if (!paramResult.success) return paramResult.error;
    const { id: campaignId, userId, characterId } = paramResult.data;

    const queryResult = validateQuery(request, campaignCharacterViewQuerySchema);
    if (!queryResult.success) return queryResult.error;

    const forEncounter = queryResult.data.scope === 'encounter';

    const supabase = await createClient();

    const { data: campaignRow, error: campaignErr } = await supabase
      .from('campaigns')
      .select('id, owner_id, characters')
      .eq('id', campaignId)
      .maybeSingle();
    if (campaignErr) throw campaignErr;

    if (!campaignRow) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const { data: memberRows, error: memberErr } = await supabase
      .from('campaign_members')
      .select('user_id')
      .eq('campaign_id', campaignId);
    if (memberErr) throw memberErr;
    const memberIds = (memberRows ?? []).map((m: { user_id: string }) => m.user_id);
    const isRM = campaignRow.owner_id === user.uid;
    const isMember = isRM || memberIds.includes(user.uid);

    const isInCampaign = isCharacterOnCampaignRoster(campaignRow.characters, userId, characterId);
    if (!isInCampaign) {
      return NextResponse.json({ error: 'Character not found in campaign' }, { status: 404 });
    }

    if (!isMember) {
      return NextResponse.json({ error: 'You are not in this campaign' }, { status: 403 });
    }

    const isOwner = user.uid === userId;

    const { data: charRowUser, error: charErr } = await supabase
      .from('characters')
      .select('id, user_id, data, created_at, updated_at, visibility')
      .eq('id', characterId)
      .eq('user_id', userId)
      .maybeSingle();
    if (charErr) {
      console.warn(
        '[campaign character GET] session-scoped fetch failed, trying service role:',
        charErr,
      );
    }

    let charRow = charRowUser;
    // RLS often blocks non-owners from reading other players' rows; roster + membership were verified above.
    if (!charRow) {
      const admin = createServiceRoleClient();
      const { data: charRowAdmin, error: adminErr } = await admin
        .from('characters')
        .select('id, user_id, data, created_at, updated_at, visibility')
        .eq('id', characterId)
        .eq('user_id', userId)
        .maybeSingle();
      if (adminErr) throw adminErr;
      charRow = charRowAdmin ?? null;
    }

    if (!charRow) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    const charData = (charRow.data as Record<string, unknown>) ?? {};

    const visibility = resolveCharacterVisibility(charRow);
    const canViewPrivate = isOwner || isRM;
    const canViewAsCampaignMember =
      isMember && (visibility === 'campaign' || visibility === 'public');
    if (visibility === 'private' && !canViewPrivate) {
      return NextResponse.json(
        { error: 'This character is set to private and cannot be viewed' },
        { status: 403 },
      );
    }
    if (!forEncounter && !canViewPrivate && !canViewAsCampaignMember) {
      return NextResponse.json(
        { error: 'You do not have permission to view this character sheet' },
        { status: 403 },
      );
    }

    if (forEncounter) {
      const rawAbilities = (charData?.abilities || {}) as Record<string, number>;
      const abilities = {
        ...rawAbilities,
        acuity: rawAbilities?.acuity ?? rawAbilities?.acu ?? 0,
        agility: rawAbilities?.agility ?? rawAbilities?.agi ?? 0,
      };
      const rules = await fetchCoreRules(supabase);
      const { maxHealth, maxEnergy } = computeMaxHealthEnergy(
        charData as Record<string, unknown>,
        rules,
      );
      const health = charData?.health as
        | { max?: number | undefined; current?: number | undefined }
        | undefined;
      const energy = charData?.energy as
        | { max?: number | undefined; current?: number | undefined }
        | undefined;
      const currentHp =
        (charData?.currentHealth as number) ?? health?.current ?? health?.max ?? maxHealth;
      const currentEn =
        (charData?.currentEnergy as number) ?? energy?.current ?? energy?.max ?? maxEnergy;
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
      visibility,
      createdAt: charData?.createdAt ?? charRow.created_at,
      updatedAt: charData?.updatedAt ?? charRow.updated_at,
    };

    const { libraryForView, enrichment } = await getOwnerLibraryAndEnrichmentForView(
      supabase,
      userId,
      charData,
    );
    return NextResponse.json({ ...character, libraryForView, enrichment });
  } catch (error) {
    console.error('Campaign character view error:', error);
    return NextResponse.json({ error: 'Failed to load character' }, { status: 500 });
  }
}
