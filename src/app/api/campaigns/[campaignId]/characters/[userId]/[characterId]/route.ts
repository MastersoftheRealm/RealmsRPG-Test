/**
 * Campaign Character View API
 * ===========================
 * Allows Realm Masters to fetch a campaign member's character for read-only viewing.
 * Validates: requester is RM, character is in campaign, character visibility allows.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/server';
import { getSession } from '@/lib/firebase/session';
import type { CharacterVisibility } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; userId: string; characterId: string }> }
) {
  try {
    const { campaignId, userId, characterId } = await params;
    const session = await getSession();

    if (!session?.user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getAdminFirestore();

    // 1. Get campaign and verify requester is Realm Master
    const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
    if (!campaignDoc.exists) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const campaignData = campaignDoc.data();
    if (campaignData?.ownerId !== session.user.uid) {
      return NextResponse.json({ error: 'Only the Realm Master can view player character sheets' }, { status: 403 });
    }

    // 2. Verify character is in campaign
    const characters = (campaignData?.characters || []) as Array<{ userId: string; characterId: string }>;
    const isInCampaign = characters.some((c) => c.userId === userId && c.characterId === characterId);
    if (!isInCampaign) {
      return NextResponse.json({ error: 'Character not found in campaign' }, { status: 404 });
    }

    // 3. Fetch character
    const characterDoc = await db
      .collection('users')
      .doc(userId)
      .collection('character')
      .doc(characterId)
      .get();

    if (!characterDoc.exists) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    const charData = characterDoc.data();
    const visibility = (charData?.visibility as CharacterVisibility) || 'private';

    // 4. Check visibility - private = owner only; campaign = owner + campaign members; public = anyone
    if (visibility === 'private') {
      return NextResponse.json({ error: 'This character is set to private and cannot be viewed' }, { status: 403 });
    }

    // campaign or public - RM is a campaign member (owner), so allow
    const data = characterDoc.data();
    const character = {
      id: characterDoc.id,
      ...data,
      createdAt: data?.createdAt?.toDate?.() ?? data?.createdAt,
      updatedAt: data?.updatedAt?.toDate?.() ?? data?.updatedAt,
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
