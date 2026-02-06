/**
 * Campaign Server Actions
 * ========================
 * Server actions for campaign CRUD, join, and character management.
 * Uses Firebase Admin SDK for secure operations and username lookups.
 */

'use server';

import { getAdminFirestore } from '@/lib/firebase/server';
import { requireAuth } from '@/lib/firebase/session';
import type { Campaign, CampaignCharacter, ArchetypeDisplayName } from '@/types/campaign';
import { MAX_CAMPAIGN_CHARACTERS, OWNER_MAX_CHARACTERS } from './constants';

const INVITE_CODE_LENGTH = 8;
const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars: 0,O,1,I

function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += ALPHANUMERIC.charAt(Math.floor(Math.random() * ALPHANUMERIC.length));
  }
  return code;
}

async function getUsernameByUid(uid: string): Promise<string | undefined> {
  const db = getAdminFirestore();
  const userDoc = await db.collection('users').doc(uid).get();
  return userDoc.data()?.username as string | undefined;
}

async function ensureUniqueInviteCode(db: Awaited<ReturnType<typeof getAdminFirestore>>): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCode();
    const existing = await db.collection('campaigns').where('inviteCode', '==', code).limit(1).get();
    if (existing.empty) return code;
  }
  throw new Error('Failed to generate unique invite code');
}

function getArchetypeDisplayName(archetypeType?: string): ArchetypeDisplayName | undefined {
  if (!archetypeType) return undefined;
  const lower = archetypeType.toLowerCase();
  if (lower === 'power') return 'Power';
  if (lower === 'martial') return 'Martial';
  if (lower === 'powered-martial' || lower === 'poweredmartial') return 'Powered-Martial';
  return undefined;
}

export async function createCampaignAction(data: { name: string; description?: string }) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();

    const name = data.name?.trim();
    if (!name || name.length < 2) {
      return { success: false, error: 'Campaign name must be at least 2 characters' };
    }

    const ownerUsername = await getUsernameByUid(user.uid);
    const inviteCode = await ensureUniqueInviteCode(db);

    const campaign: Omit<Campaign, 'id'> = {
      name,
      description: data.description?.trim() || '',
      ownerId: user.uid,
      ownerUsername: ownerUsername || (user as { name?: string }).name || 'Realm Master',
      inviteCode,
      characters: [],
      memberIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection('campaigns').add(campaign);
    return { success: true, campaignId: docRef.id, inviteCode };
  } catch (error) {
    console.error('Create campaign error:', error);
    return { success: false, error: 'Failed to create campaign' };
  }
}

export async function joinCampaignAction(data: {
  inviteCode: string;
  characterId: string;
  characterName: string;
  portrait?: string;
  level: number;
  species?: string;
  archetypeType?: string;
}) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();

    const code = data.inviteCode?.trim().toUpperCase();
    if (!code) {
      return { success: false, error: 'Please enter an invite code' };
    }

    const campaignsSnap = await db.collection('campaigns').where('inviteCode', '==', code).limit(1).get();
    if (campaignsSnap.empty) {
      return { success: false, error: 'Invalid invite code. No campaign found.' };
    }

    const campaignDoc = campaignsSnap.docs[0];
    const campaignData = campaignDoc.data() as Campaign;
    const campaignId = campaignDoc.id;

    // Verify character belongs to user
    const charDoc = await db.collection('users').doc(user.uid).collection('character').doc(data.characterId).get();
    if (!charDoc.exists) {
      return { success: false, error: 'Character not found. You can only add your own characters.' };
    }

    // Check if character already in campaign
    const alreadyIn = campaignData.characters?.some(
      (c) => c.userId === user.uid && c.characterId === data.characterId
    );
    if (alreadyIn) {
      return { success: false, error: 'This character is already in the campaign.' };
    }

    // Check total campaign character cap
    const currentCount = campaignData.characters?.length ?? 0;
    if (currentCount >= MAX_CAMPAIGN_CHARACTERS) {
      return { success: false, error: `This campaign has reached the maximum of ${MAX_CAMPAIGN_CHARACTERS} characters.` };
    }

    // Check if user already has a character in campaign (limit 1 per non-owner)
    if (campaignData.ownerId !== user.uid) {
      const userChars = campaignData.characters?.filter((c) => c.userId === user.uid) ?? [];
      if (userChars.length >= 1) {
        return { success: false, error: 'You can only have one character per campaign.' };
      }
    }

    const ownerUsername = await getUsernameByUid(user.uid);
    const newChar: CampaignCharacter = {
      userId: user.uid,
      characterId: data.characterId,
      characterName: data.characterName,
      portrait: data.portrait,
      level: data.level,
      species: data.species,
      archetype: getArchetypeDisplayName(data.archetypeType),
      ownerUsername: ownerUsername || (user as { name?: string }).name || undefined,
    };

    const characters = [...(campaignData.characters || []), newChar];
    const memberIds = [...new Set([...(campaignData.memberIds || []), user.uid])];

    await campaignDoc.ref.update({
      characters,
      memberIds,
      updatedAt: new Date(),
    });

    return { success: true, campaignId };
  } catch (error) {
    console.error('Join campaign error:', error);
    return { success: false, error: 'Failed to join campaign' };
  }
}

export async function addCharacterToCampaignAction(data: {
  campaignId: string;
  characterId: string;
  characterName: string;
  portrait?: string;
  level: number;
  species?: string;
  archetypeType?: string;
}) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();

    const campaignDoc = await db.collection('campaigns').doc(data.campaignId).get();
    if (!campaignDoc.exists) {
      return { success: false, error: 'Campaign not found' };
    }

    const campaignData = campaignDoc.data() as Campaign;
    if (campaignData.ownerId !== user.uid) {
      return { success: false, error: 'Only the Realm Master can add characters to their campaign' };
    }

    // Verify character belongs to owner
    const charDoc = await db.collection('users').doc(user.uid).collection('character').doc(data.characterId).get();
    if (!charDoc.exists) {
      return { success: false, error: 'Character not found' };
    }

    // Check total campaign character cap
    const currentCount = campaignData.characters?.length ?? 0;
    if (currentCount >= MAX_CAMPAIGN_CHARACTERS) {
      return { success: false, error: `This campaign has reached the maximum of ${MAX_CAMPAIGN_CHARACTERS} characters.` };
    }

    const ownerChars = campaignData.characters?.filter((c) => c.userId === user.uid) ?? [];
    if (ownerChars.length >= OWNER_MAX_CHARACTERS) {
      return { success: false, error: `You can add up to ${OWNER_MAX_CHARACTERS} of your own characters.` };
    }

    const alreadyIn = campaignData.characters?.some(
      (c) => c.userId === user.uid && c.characterId === data.characterId
    );
    if (alreadyIn) {
      return { success: false, error: 'This character is already in the campaign.' };
    }

    const ownerUsername = await getUsernameByUid(user.uid);
    const newChar: CampaignCharacter = {
      userId: user.uid,
      characterId: data.characterId,
      characterName: data.characterName,
      portrait: data.portrait,
      level: data.level,
      species: data.species,
      archetype: getArchetypeDisplayName(data.archetypeType),
      ownerUsername: ownerUsername || undefined,
    };

    const characters = [...(campaignData.characters || []), newChar];
    const memberIds = campaignData.memberIds?.includes(user.uid)
      ? campaignData.memberIds
      : [...(campaignData.memberIds || []), user.uid];

    await campaignDoc.ref.update({
      characters,
      memberIds,
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error('Add character error:', error);
    return { success: false, error: 'Failed to add character' };
  }
}

export async function removeCharacterFromCampaignAction(data: {
  campaignId: string;
  userId: string;
  characterId: string;
}) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();

    const campaignDoc = await db.collection('campaigns').doc(data.campaignId).get();
    if (!campaignDoc.exists) {
      return { success: false, error: 'Campaign not found' };
    }

    const campaignData = campaignDoc.data() as Campaign;
    const isOwner = campaignData.ownerId === user.uid;
    const isRemovingOwn = data.userId === user.uid;

    if (!isOwner && !isRemovingOwn) {
      return { success: false, error: 'You can only remove your own character, or the Realm Master can remove any character.' };
    }

    const characters = (campaignData.characters || []).filter(
      (c) => !(c.userId === data.userId && c.characterId === data.characterId)
    );

    // Recompute memberIds - users who still have characters
    const memberIds = [...new Set(characters.map((c) => c.userId))];

    await campaignDoc.ref.update({
      characters,
      memberIds,
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error('Remove character error:', error);
    return { success: false, error: 'Failed to remove character' };
  }
}

export async function deleteCampaignAction(campaignId: string) {
  try {
    const user = await requireAuth();
    const db = getAdminFirestore();

    const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
    if (!campaignDoc.exists) {
      return { success: false, error: 'Campaign not found' };
    }

    const campaignData = campaignDoc.data() as Campaign;
    if (campaignData.ownerId !== user.uid) {
      return { success: false, error: 'Only the Realm Master can delete the campaign' };
    }

    await campaignDoc.ref.delete();
    return { success: true };
  } catch (error) {
    console.error('Delete campaign error:', error);
    return { success: false, error: 'Failed to delete campaign' };
  }
}
