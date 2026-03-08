/**
 * Campaign Server Actions
 * ========================
 * Server actions for campaign CRUD, join, and character management.
 * Uses Supabase + session.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/supabase/session';
import { ensureUserProfile } from '@/lib/ensure-user-profile';
import { getCharacterListColumns } from '@/lib/character-list-columns';
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
  const supabase = await createClient();
  const { data } = await supabase.from('user_profiles').select('username').eq('id', uid).maybeSingle();
  return (data as { username?: string } | null)?.username ?? undefined;
}

async function ensureUniqueInviteCode(): Promise<string> {
  const supabase = await createClient();
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCode();
    const { data: existing } = await supabase.from('campaigns').select('id').eq('invite_code', code).maybeSingle();
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
    const supabase = await createClient();

    await ensureUserProfile(supabase, user.uid);

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        name,
        description: data.description?.trim() || '',
        owner_id: user.uid,
        owner_username: ownerUsername || user.name || 'Realm Master',
        invite_code: inviteCode,
        characters: [],
        memberIds: [],
      })
      .select('id')
      .single();
    if (error) throw error;

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

    const supabase = await createClient();
    const { data: campaignRow } = await supabase
      .from('campaigns')
      .select('id, owner_id, characters, memberIds')
      .eq('invite_code', code)
      .maybeSingle();
    if (!campaignRow) {
      return { success: false, error: 'Invalid invite code. No campaign found.' };
    }

    const { data: memberRows } = await supabase
      .from('campaign_members')
      .select('user_id')
      .eq('campaign_id', campaignRow.id);
    const memberIds = (memberRows ?? []).map((m: { user_id: string }) => m.user_id);
    const campaignData = (campaignRow.characters as CampaignCharacter[]) ?? [];
    const campaignId = campaignRow.id;

    const { data: charRow } = await supabase
      .from('characters')
      .select('id, data')
      .eq('id', data.characterId)
      .eq('user_id', user.uid)
      .maybeSingle();
    if (!charRow) {
      return { success: false, error: 'Character not found. You can only add your own characters.' };
    }

    const alreadyIn = campaignData?.some((c) => c.userId === user.uid && c.characterId === data.characterId);
    if (alreadyIn) {
      return { success: false, error: 'This character is already in the campaign.' };
    }

    if (campaignData?.length >= MAX_CAMPAIGN_CHARACTERS) {
      return { success: false, error: `This campaign has reached the maximum of ${MAX_CAMPAIGN_CHARACTERS} characters.` };
    }

    if (campaignRow.owner_id !== user.uid) {
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

    await supabase.from('campaign_members').upsert(
      { campaign_id: campaignId, user_id: user.uid },
      { onConflict: 'campaign_id,user_id' }
    );
    await supabase
      .from('campaigns')
      .update({ characters, memberIds: newMemberIds })
      .eq('id', campaignId);

    const charData = (charRow.data as Record<string, unknown>) ?? {};
    const merged = { ...charData, visibility: 'campaign', updatedAt: new Date().toISOString() };
    const listCols = getCharacterListColumns(merged);
    await supabase.from('characters').update({ data: merged, ...listCols }).eq('id', data.characterId).eq('user_id', user.uid);

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
    const supabase = await createClient();

    const { data: campaignRow } = await supabase
      .from('campaigns')
      .select('id, owner_id, characters')
      .eq('id', data.campaignId)
      .maybeSingle();
    if (!campaignRow) {
      return { success: false, error: 'Campaign not found' };
    }
    if (campaignRow.owner_id !== user.uid) {
      return { success: false, error: 'Only the Realm Master can add characters to their campaign' };
    }

    const { data: charRow } = await supabase
      .from('characters')
      .select('id, data')
      .eq('id', data.characterId)
      .eq('user_id', user.uid)
      .maybeSingle();
    if (!charRow) {
      return { success: false, error: 'Character not found' };
    }

    const campaignData = (campaignRow.characters as CampaignCharacter[]) ?? [];
    if (campaignData.length >= MAX_CAMPAIGN_CHARACTERS) {
      return { success: false, error: `This campaign has reached the maximum of ${MAX_CAMPAIGN_CHARACTERS} characters.` };
    }
    const ownerChars = campaignData.filter((c) => c.userId === user.uid);
    if (ownerChars.length >= OWNER_MAX_CHARACTERS) {
      return { success: false, error: `You can add up to ${OWNER_MAX_CHARACTERS} of your own characters.` };
    }
    const alreadyIn = campaignData.some((c) => c.userId === user.uid && c.characterId === data.characterId);
    if (alreadyIn) {
      return { success: false, error: 'This character is already in the campaign.' };
    }

    const { data: memberRows } = await supabase
      .from('campaign_members')
      .select('user_id')
      .eq('campaign_id', data.campaignId);
    const currentMemberIds = (memberRows ?? []).map((m: { user_id: string }) => m.user_id);
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
    const memberIds = [...new Set([...currentMemberIds, user.uid])];

    await supabase.from('campaign_members').upsert(
      { campaign_id: data.campaignId, user_id: user.uid },
      { onConflict: 'campaign_id,user_id' }
    );
    await supabase.from('campaigns').update({ characters, memberIds }).eq('id', data.campaignId);

    const charData = (charRow.data as Record<string, unknown>) ?? {};
    const merged = { ...charData, visibility: 'campaign', updatedAt: new Date().toISOString() };
    const listCols = getCharacterListColumns(merged);
    await supabase.from('characters').update({ data: merged, ...listCols }).eq('id', data.characterId).eq('user_id', user.uid);

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
    const supabase = await createClient();

    const { data: campaignRow } = await supabase
      .from('campaigns')
      .select('id, owner_id, characters')
      .eq('id', data.campaignId)
      .maybeSingle();
    if (!campaignRow) {
      return { success: false, error: 'Campaign not found' };
    }

    const campaignData = (campaignRow.characters as CampaignCharacter[]) ?? [];
    const isOwner = campaignRow.owner_id === user.uid;
    const isRemovingOwn = data.userId === user.uid;

    if (!isOwner && !isRemovingOwn) {
      return { success: false, error: 'You can only remove your own character, or the Realm Master can remove any character.' };
    }

    const characters = (campaignData || []).filter(
      (c) => !(c.userId === data.userId && c.characterId === data.characterId)
    );
    const memberIds = [...new Set(characters.map((c) => c.userId))];

    await supabase.from('campaigns').update({ characters, memberIds }).eq('id', data.campaignId);

    if (!memberIds.includes(data.userId)) {
      await supabase
        .from('campaign_members')
        .delete()
        .eq('campaign_id', data.campaignId)
        .eq('user_id', data.userId);
    }

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
    const supabase = await createClient();

    const { data: campaignRow } = await supabase
      .from('campaigns')
      .select('id, owner_id')
      .eq('id', campaignId)
      .maybeSingle();
    if (!campaignRow) {
      return { success: false, error: 'Campaign not found' };
    }
    if (campaignRow.owner_id !== user.uid) {
      return { success: false, error: 'Only the Realm Master can update the campaign' };
    }

    const updates: Record<string, unknown> = {};
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

    const { error } = await supabase.from('campaigns').update(updates).eq('id', campaignId).eq('owner_id', user.uid);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Update campaign error:', error);
    return { success: false, error: 'Failed to update campaign' };
  }
}

export async function deleteCampaignAction(campaignId: string) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: campaignRow } = await supabase
      .from('campaigns')
      .select('id, owner_id')
      .eq('id', campaignId)
      .maybeSingle();
    if (!campaignRow) {
      return { success: false, error: 'Campaign not found' };
    }
    if (campaignRow.owner_id !== user.uid) {
      return { success: false, error: 'Only the Realm Master can delete the campaign' };
    }

    const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Delete campaign error:', error);
    return { success: false, error: 'Failed to delete campaign' };
  }
}
