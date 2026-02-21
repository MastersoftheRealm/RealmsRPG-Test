/**
 * Campaign Server Actions
 * ========================
 * Server actions for campaign CRUD, join, and character management.
 * Uses Prisma + Supabase session.
 */

'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/supabase/session';
import type { Campaign, CampaignCharacter, ArchetypeDisplayName } from '@/types/campaign';
import { MAX_CAMPAIGN_CHARACTERS, OWNER_MAX_CHARACTERS } from './constants';

const INVITE_CODE_LENGTH = 8;
const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += ALPHANUMERIC.charAt(Math.floor(Math.random() * ALPHANUMERIC.length));
  }
  return code;
}

async function getUsernameByUid(uid: string): Promise<string | undefined> {
  const profile = await prisma.userProfile.findUnique({
    where: { id: uid },
    select: { username: true },
  });
  return profile?.username ?? undefined;
}

async function ensureUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCode();
    const existing = await prisma.campaign.findFirst({
      where: { inviteCode: code },
    });
    if (!existing) return code;
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

    const name = data.name?.trim();
    if (!name || name.length < 2) {
      return { success: false, error: 'Campaign name must be at least 2 characters' };
    }

    const ownerUsername = await getUsernameByUid(user.uid);
    const inviteCode = await ensureUniqueInviteCode();

    await prisma.userProfile.upsert({
      where: { id: user.uid },
      create: { id: user.uid },
      update: {},
    });

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description: data.description?.trim() || '',
        ownerId: user.uid,
        ownerUsername: ownerUsername || user.name || 'Realm Master',
        inviteCode,
        characters: [],
        memberIds: [],
      },
    });

    return { success: true, campaignId: campaign.id, inviteCode };
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

    const code = data.inviteCode?.trim().toUpperCase();
    if (!code) {
      return { success: false, error: 'Please enter an invite code' };
    }

    const campaignRow = await prisma.campaign.findFirst({
      where: { inviteCode: code },
    });

    if (!campaignRow) {
      return { success: false, error: 'Invalid invite code. No campaign found.' };
    }

    const campaignData = (campaignRow.characters as unknown) as CampaignCharacter[];
    const campaignId = campaignRow.id;
    const memberIds = ((campaignRow.memberIds as unknown) as string[]) || [];

    // Verify character belongs to user (Prisma)
    const charRow = await prisma.character.findFirst({
      where: { id: data.characterId, userId: user.uid },
    });
    if (!charRow) {
      return { success: false, error: 'Character not found. You can only add your own characters.' };
    }

    const alreadyIn = campaignData?.some(
      (c) => c.userId === user.uid && c.characterId === data.characterId
    );
    if (alreadyIn) {
      return { success: false, error: 'This character is already in the campaign.' };
    }

    const currentCount = campaignData?.length ?? 0;
    if (currentCount >= MAX_CAMPAIGN_CHARACTERS) {
      return { success: false, error: `This campaign has reached the maximum of ${MAX_CAMPAIGN_CHARACTERS} characters.` };
    }

    if (campaignRow.ownerId !== user.uid) {
      const userChars = campaignData?.filter((c) => c.userId === user.uid) ?? [];
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
      ownerUsername: ownerUsername || user.name || undefined,
    };

    const characters = [...(campaignData || []), newChar];
    const newMemberIds = [...new Set([...memberIds, user.uid])];

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { characters: characters as object, memberIds: newMemberIds as object },
    });

    // Set character visibility to campaign so RM and members can view it
    const charData = charRow.data as Record<string, unknown>;
    const merged = { ...charData, visibility: 'campaign', updatedAt: new Date().toISOString() };
    await prisma.character.update({
      where: { id: data.characterId },
      data: { data: merged as object },
    });

    return { success: true, campaignId, visibilityUpdated: true };
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

    const campaignRow = await prisma.campaign.findUnique({
      where: { id: data.campaignId },
    });

    if (!campaignRow) {
      return { success: false, error: 'Campaign not found' };
    }

    if (campaignRow.ownerId !== user.uid) {
      return { success: false, error: 'Only the Realm Master can add characters to their campaign' };
    }

    const charRow = await prisma.character.findFirst({
      where: { id: data.characterId, userId: user.uid },
    });
    if (!charRow) {
      return { success: false, error: 'Character not found' };
    }

    const campaignData = ((campaignRow.characters as unknown) as CampaignCharacter[]) || [];
    const currentCount = campaignData.length;
    if (currentCount >= MAX_CAMPAIGN_CHARACTERS) {
      return { success: false, error: `This campaign has reached the maximum of ${MAX_CAMPAIGN_CHARACTERS} characters.` };
    }

    const ownerChars = campaignData.filter((c) => c.userId === user.uid);
    if (ownerChars.length >= OWNER_MAX_CHARACTERS) {
      return { success: false, error: `You can add up to ${OWNER_MAX_CHARACTERS} of your own characters.` };
    }

    const alreadyIn = campaignData.some(
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

    const characters = [...campaignData, newChar];
    const memberIds = [...new Set([...((campaignRow.memberIds as unknown) as string[] || []), user.uid])];

    await prisma.campaign.update({
      where: { id: data.campaignId },
      data: { characters: characters as object, memberIds: memberIds as object },
    });

    // Set character visibility to campaign so RM and members can view it
    const charData = charRow.data as Record<string, unknown>;
    const merged = { ...charData, visibility: 'campaign', updatedAt: new Date().toISOString() };
    await prisma.character.update({
      where: { id: data.characterId },
      data: { data: merged as object },
    });

    return { success: true, visibilityUpdated: true };
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

    const campaignRow = await prisma.campaign.findUnique({
      where: { id: data.campaignId },
    });

    if (!campaignRow) {
      return { success: false, error: 'Campaign not found' };
    }

    const campaignData = (campaignRow.characters as unknown) as CampaignCharacter[];
    const isOwner = campaignRow.ownerId === user.uid;
    const isRemovingOwn = data.userId === user.uid;

    if (!isOwner && !isRemovingOwn) {
      return { success: false, error: 'You can only remove your own character, or the Realm Master can remove any character.' };
    }

    const characters = (campaignData || []).filter(
      (c) => !(c.userId === data.userId && c.characterId === data.characterId)
    );
    const memberIds = [...new Set(characters.map((c) => c.userId))];

    await prisma.campaign.update({
      where: { id: data.campaignId },
      data: { characters: characters as object, memberIds: memberIds as object },
    });

    return { success: true };
  } catch (error) {
    console.error('Remove character error:', error);
    return { success: false, error: 'Failed to remove character' };
  }
}

export async function updateCampaignAction(
  campaignId: string,
  data: { name?: string; description?: string }
) {
  try {
    const user = await requireAuth();

    const campaignRow = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaignRow) {
      return { success: false, error: 'Campaign not found' };
    }

    if (campaignRow.ownerId !== user.uid) {
      return { success: false, error: 'Only the Realm Master can update the campaign' };
    }

    const updates: { name?: string; description?: string | null } = {};
    if (data.name !== undefined) {
      const name = data.name.trim();
      if (name.length < 2) {
        return { success: false, error: 'Campaign name must be at least 2 characters' };
      }
      updates.name = name;
    }
    if (data.description !== undefined) {
      updates.description = data.description.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return { success: true };
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: updates,
    });

    return { success: true };
  } catch (error) {
    console.error('Update campaign error:', error);
    return { success: false, error: 'Failed to update campaign' };
  }
}

export async function deleteCampaignAction(campaignId: string) {
  try {
    const user = await requireAuth();

    const campaignRow = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaignRow) {
      return { success: false, error: 'Campaign not found' };
    }

    if (campaignRow.ownerId !== user.uid) {
      return { success: false, error: 'Only the Realm Master can delete the campaign' };
    }

    await prisma.campaign.delete({
      where: { id: campaignId },
    });

    return { success: true };
  } catch (error) {
    console.error('Delete campaign error:', error);
    return { success: false, error: 'Failed to delete campaign' };
  }
}
