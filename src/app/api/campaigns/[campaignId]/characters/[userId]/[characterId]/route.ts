/**
 * Campaign Character View API
 * ===========================
 * Allows Realm Masters to fetch a campaign member's character for read-only viewing.
 * Uses Prisma. Validates: requester is RM, character is in campaign, character visibility allows.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/supabase/session';
import type { CharacterVisibility } from '@/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ campaignId: string; userId: string; characterId: string }> }
) {
  try {
    const { campaignId, userId, characterId } = await params;
    const { user } = await getSession();

    if (!user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaignRow = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaignRow) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaignRow.ownerId !== user.uid) {
      return NextResponse.json({ error: 'Only the Realm Master can view player character sheets' }, { status: 403 });
    }

    const characters = (campaignRow.characters as Array<{ userId: string; characterId: string }>) || [];
    const isInCampaign = characters.some((c) => c.userId === userId && c.characterId === characterId);
    if (!isInCampaign) {
      return NextResponse.json({ error: 'Character not found in campaign' }, { status: 404 });
    }

    const charRow = await prisma.character.findFirst({
      where: { id: characterId, userId },
    });

    if (!charRow) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    const charData = charRow.data as Record<string, unknown>;
    const visibility = (charData?.visibility as CharacterVisibility) || 'private';

    if (visibility === 'private') {
      return NextResponse.json({ error: 'This character is set to private and cannot be viewed' }, { status: 403 });
    }

    const character = {
      id: charRow.id,
      ...charData,
      createdAt: charData?.createdAt ?? charRow.createdAt?.toISOString(),
      updatedAt: charData?.updatedAt ?? charRow.updatedAt?.toISOString(),
    };

    return NextResponse.json(character);
  } catch (error) {
    console.error('Campaign character view error:', error);
    return NextResponse.json(
      { error: 'Failed to load character' },
      { status: 500 }
    );
  }
}
