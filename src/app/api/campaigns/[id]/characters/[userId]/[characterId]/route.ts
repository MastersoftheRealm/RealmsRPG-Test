/**
 * Campaign Character View API
 * ===========================
 * - Full view: RM only, returns full character for read-only sheet viewing.
 * - ?scope=encounter: Any campaign member can fetch minimal data for adding to encounters.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    const campaignRow = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaignRow) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const memberIds = (campaignRow.memberIds as string[]) || [];
    const isRM = campaignRow.ownerId === user.uid;
    const isMember = isRM || memberIds.includes(user.uid);

    const characters = (campaignRow.characters as Array<{ userId: string; characterId: string }>) || [];
    const isInCampaign = characters.some((c) => c.userId === userId && c.characterId === characterId);
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

    const charRow = await prisma.character.findFirst({
      where: { id: characterId, userId },
    });

    if (!charRow) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    const charData = charRow.data as Record<string, unknown>;

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
        evasion: (charData?.evasion as number) ?? 10 + abilities.agility,
      };
      return NextResponse.json(character);
    }

    const character = {
      id: charRow.id,
      ...charData,
      createdAt: charData?.createdAt ?? charRow.createdAt?.toISOString(),
      updatedAt: charData?.updatedAt ?? charRow.updatedAt?.toISOString(),
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
