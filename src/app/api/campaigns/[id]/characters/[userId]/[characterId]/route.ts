/**
 * Campaign Character View API
 * ===========================
 * - Full view: RM always; campaign members when visibility is campaign or public (column is SoT).
 * - ?scope=encounter: Same visibility rules; returns minimal vitals only.
 * - Private: owner and RM only. Campaign visibility requires campaign membership (this route).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import {
  campaignCharacterRouteParamsSchema,
  campaignCharacterViewQuerySchema,
  validateQuery,
  validateRouteParams,
} from '@/lib/api-validation';
import { computeMaxHealthEnergy } from '@/lib/game/calculations';
import { fetchCoreRules } from '@/lib/core-rules-server';
import { getOwnerLibraryAndEnrichmentForView } from '@/lib/character-view-enrichment-server';
import { getCampaignRelationalCharacterDocument } from '@/lib/character-persistence-server';

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
    const readResult = await getCampaignRelationalCharacterDocument(supabase, {
      campaignId,
      characterOwnerId: userId,
      characterId,
    });
    if (readResult.status === 'unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (readResult.status === 'campaign_not_found') {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    if (readResult.status === 'not_member') {
      return NextResponse.json({ error: 'You are not in this campaign' }, { status: 403 });
    }
    if (readResult.status === 'character_not_rostered') {
      return NextResponse.json({ error: 'Character not found in campaign' }, { status: 404 });
    }
    if (readResult.status === 'character_not_found') {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }
    if (readResult.status === 'private') {
      return NextResponse.json(
        { error: 'This character is set to private and cannot be viewed' },
        { status: 403 },
      );
    }
    if (readResult.status !== 'ok') {
      throw new Error(`Unexpected campaign character read status: ${readResult.status}`);
    }
    const charData = readResult.character;
    const visibility =
      charData.visibility === 'campaign' || charData.visibility === 'public'
        ? charData.visibility
        : 'private';

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

    const character = { ...charData, id: characterId, visibility };

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
