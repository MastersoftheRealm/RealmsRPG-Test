/**
 * Campaign Server Actions
 * ========================
 * Server actions for campaign CRUD, join, and character management.
 * Uses Supabase + session.
 */

'use server';

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/supabase/session';
import { ensureUserProfile } from '@/lib/ensure-user-profile';
import { reportError } from '@/lib/observability';
import { getRelationalCharacterDocument } from '@/lib/character-persistence-server';
import { normalizeInviteCodeInput, isValidInviteCodeFormat } from '@/lib/campaign-invite';
import { buildRosterFieldsFromCharacterData } from '@/lib/campaign-roster';
import { getRolePolicyForUser } from '@/lib/role-policy';
import { buildRateLimitKey, inviteCodeLimiter } from '@/lib/rate-limit';
import { formatRoleQuotaExceededMessage } from '@/lib/role-quota-messages';
import { asDbJson } from '@/lib/supabase/database';
import type { CampaignCharacter } from '@/types/campaign';
import { generateInviteCode } from '@/lib/campaign-invite-code';
import { MAX_CAMPAIGN_CHARACTERS, OWNER_MAX_CHARACTERS } from './constants';

type CampaignCharacterMutationResult = {
  status?: string | undefined;
  campaignId?: string | undefined;
  visibilityUpdated?: boolean | undefined;
};

function campaignCharacterMutationResult(value: unknown): CampaignCharacterMutationResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Campaign character mutation returned an invalid payload');
  }
  return value as CampaignCharacterMutationResult;
}

async function getUsernameByUid(uid: string): Promise<string | undefined> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_profiles')
    .select('username')
    .eq('id', uid)
    .maybeSingle();
  return (data as { username?: string | undefined } | null)?.username ?? undefined;
}

async function ensureUniqueInviteCode(): Promise<string> {
  const supabase = await createClient();
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCode();
    const { data: existing } = await supabase
      .from('campaigns')
      .select('id')
      .eq('invite_code', code)
      .maybeSingle();
    if (!existing) return code;
  }
  throw new Error('Failed to generate unique invite code');
}

export async function createCampaignAction(data: {
  name: string;
  description?: string | undefined;
}) {
  try {
    const user = await requireAuth();
    const name = data.name?.trim();
    if (!name || name.length < 2) {
      return { success: false, error: 'Campaign name must be at least 2 characters' };
    }

    const ownerUsername = await getUsernameByUid(user.uid);
    const inviteCode = await ensureUniqueInviteCode();
    const supabase = await createClient();
    const rolePolicy = await getRolePolicyForUser(user.uid, supabase);

    const { count: campaignCount, error: campaignCountError } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.uid);
    if (campaignCountError) throw campaignCountError;
    if ((campaignCount ?? 0) >= rolePolicy.maxCampaigns) {
      return {
        success: false,
        error: formatRoleQuotaExceededMessage({
          role: rolePolicy.role,
          resource: 'campaigns',
          currentCount: campaignCount ?? 0,
          maxAllowed: rolePolicy.maxCampaigns,
        }),
      };
    }

    await ensureUserProfile(supabase, user.uid);

    // Skip RETURNING (SELECT RLS cannot see the in-flight row); membership SoT is campaign_members.
    const campaignId = crypto.randomUUID();
    const now = new Date().toISOString();
    const { error } = await supabase.from('campaigns').insert({
      id: campaignId,
      name,
      description: data.description?.trim() || '',
      owner_id: user.uid,
      owner_username: ownerUsername || user.name || 'Realm Master',
      invite_code: inviteCode,
      characters: [],
      created_at: now,
      updated_at: now,
    });
    if (error) throw error;

    // 86e3jryyr: the user client may insert only the owner's own membership.
    // ignoreDuplicates avoids ON CONFLICT DO UPDATE, which the dropped UPDATE
    // policy would reject when that row already exists.
    const { error: memberErr } = await supabase
      .from('campaign_members')
      .upsert(
        { campaign_id: campaignId, user_id: user.uid },
        { onConflict: 'campaign_id,user_id', ignoreDuplicates: true },
      );
    if (memberErr) {
      reportError(memberErr, {
        scope: 'createCampaignAction campaign_members',
        extra: { campaignId },
      });
    }

    return { success: true, campaignId, inviteCode };
  } catch (error) {
    reportError(error, { scope: 'createCampaignAction' });
    return { success: false, error: 'Failed to create campaign' };
  }
}

export async function joinCampaignAction(data: { inviteCode: string; characterId: string }) {
  try {
    const user = await requireAuth();

    const { success: rateOk } = await inviteCodeLimiter.check(
      buildRateLimitKey('join-campaign', { userId: user.uid }),
    );
    if (!rateOk) {
      return {
        success: false,
        error: 'Too many join attempts. Please wait a minute and try again.',
      };
    }

    const code = normalizeInviteCodeInput(data.inviteCode);
    if (!code) {
      return { success: false, error: 'Please enter an invite code' };
    }
    if (!isValidInviteCodeFormat(code)) {
      return {
        success: false,
        error:
          'Invalid invite code format. Use 8 characters (letters A–Z except I/O, and numbers 2–9). Remove spaces or dashes if you pasted the code.',
      };
    }

    /**
     * RLS: `campaigns` SELECT is only for owner or existing members. A new player
     * joining by invite cannot see the row with the user-scoped client — that
     * produced false "Invalid invite code". Use service role for invite lookup
     * and roster update only, after we verify the character belongs to this user.
     */
    let dbService: ReturnType<typeof createServiceRoleClient>;
    try {
      dbService = createServiceRoleClient();
    } catch {
      console.error('joinCampaignAction: SUPABASE_SERVICE_ROLE_KEY missing');
      return {
        success: false,
        error: 'Server cannot process campaign joins (configuration). Please contact support.',
      };
    }

    const supabase = await createClient();

    const { data: charRow } = await supabase
      .from('characters')
      .select('id')
      .eq('id', data.characterId)
      .eq('user_id', user.uid)
      .maybeSingle();
    if (!charRow) {
      return {
        success: false,
        error: 'Character not found. You can only add your own characters.',
      };
    }
    // SEC-06: trust the stored character row for roster fields, not the client args.
    const charData = await getRelationalCharacterDocument(supabase, data.characterId);
    if (!charData) {
      return { success: false, error: 'Character not found' };
    }
    const rosterFields = buildRosterFieldsFromCharacterData(charData);

    const { data: campaignRow, error: campErr } = await dbService
      .from('campaigns')
      .select('id, owner_id, characters')
      .eq('invite_code', code)
      .maybeSingle();
    if (campErr) {
      console.error('joinCampaignAction campaign lookup:', campErr);
      return { success: false, error: 'Failed to look up invite code' };
    }
    if (!campaignRow) {
      return { success: false, error: 'Invalid invite code. No campaign found.' };
    }

    const { data: memberRows } = await dbService
      .from('campaign_members')
      .select('user_id')
      .eq('campaign_id', campaignRow.id);
    const memberIdsFromTable = (memberRows ?? []).map((m: { user_id: string }) => m.user_id);
    const campaignData = (campaignRow.characters as unknown as CampaignCharacter[]) ?? [];
    const memberIdsFromRoster = [...new Set(campaignData.map((c) => c.userId).filter(Boolean))];
    const memberIds = [...new Set([...memberIdsFromTable, ...memberIdsFromRoster])];
    const ownerPolicy = await getRolePolicyForUser(campaignRow.owner_id, dbService);
    const nonOwnerMemberIds = memberIds.filter((id) => id && id !== campaignRow.owner_id);
    const campaignId = campaignRow.id;

    const alreadyIn = campaignData?.some(
      (c) => c.userId === user.uid && c.characterId === data.characterId,
    );
    if (alreadyIn) {
      return { success: false, error: 'This character is already in the campaign.' };
    }

    if (campaignData?.length >= MAX_CAMPAIGN_CHARACTERS) {
      return {
        success: false,
        error: `This campaign has reached the maximum of ${MAX_CAMPAIGN_CHARACTERS} characters.`,
      };
    }

    const joiningAsNonOwner = user.uid !== campaignRow.owner_id;
    const alreadyMember = nonOwnerMemberIds.includes(user.uid);
    if (
      joiningAsNonOwner &&
      !alreadyMember &&
      nonOwnerMemberIds.length >= ownerPolicy.maxPlayersPerCampaign
    ) {
      return {
        success: false,
        error: `This campaign has reached the role limit of ${ownerPolicy.maxPlayersPerCampaign} player(s).`,
      };
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
      ...rosterFields,
      ownerUsername: ownerUsername || user.name || undefined,
    };

    const { data: mutationData, error: mutationError } = await dbService.rpc(
      'join_campaign_character_relational',
      {
        p_actor_id: user.uid,
        p_invite_code: code,
        p_character_id: data.characterId,
        p_roster_entry: asDbJson(newChar),
        p_expected_updated_at: typeof charData.updatedAt === 'string' ? charData.updatedAt : null,
        p_max_campaign_characters: MAX_CAMPAIGN_CHARACTERS,
        p_max_players_per_campaign: ownerPolicy.maxPlayersPerCampaign,
      },
    );
    if (mutationError) {
      console.error('joinCampaignAction relational mutation:', mutationError);
      return { success: false, error: 'Failed to join campaign' };
    }
    const mutation = campaignCharacterMutationResult(mutationData);
    if (mutation.status === 'campaign_not_found') {
      return { success: false, error: 'Invalid invite code. No campaign found.' };
    }
    if (mutation.status === 'character_not_found') {
      return { success: false, error: 'Character not found' };
    }
    if (mutation.status === 'already_in_campaign') {
      return { success: false, error: 'This character is already in the campaign.' };
    }
    if (mutation.status === 'campaign_full') {
      return {
        success: false,
        error: `This campaign has reached the maximum of ${MAX_CAMPAIGN_CHARACTERS} characters.`,
      };
    }
    if (mutation.status === 'player_limit') {
      return {
        success: false,
        error: `This campaign has reached the role limit of ${ownerPolicy.maxPlayersPerCampaign} player(s).`,
      };
    }
    if (mutation.status === 'character_limit') {
      return { success: false, error: 'You can only have one character per campaign.' };
    }
    if (mutation.status === 'conflict') {
      return { success: false, error: 'Character changed while joining campaign' };
    }
    if (mutation.status !== 'updated') {
      throw new Error(`Unexpected campaign join status: ${String(mutation.status)}`);
    }

    return {
      success: true,
      campaignId: mutation.campaignId ?? campaignId,
      visibilityUpdated: mutation.visibilityUpdated === true,
    };
  } catch (error) {
    console.error('Join campaign error:', error);
    return { success: false, error: 'Failed to join campaign' };
  }
}

export async function addCharacterToCampaignAction(data: {
  campaignId: string;
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
    if (campaignRow.owner_id !== user.uid) {
      return {
        success: false,
        error: 'Only the Realm Master can add characters to their campaign',
      };
    }

    const { data: charRow } = await supabase
      .from('characters')
      .select('id')
      .eq('id', data.characterId)
      .eq('user_id', user.uid)
      .maybeSingle();
    if (!charRow) {
      return { success: false, error: 'Character not found' };
    }
    // SEC-06: roster fields come from the stored character, not client args.
    const charData = await getRelationalCharacterDocument(supabase, data.characterId);
    if (!charData) {
      return { success: false, error: 'Character not found' };
    }
    const rosterFields = buildRosterFieldsFromCharacterData(charData);

    const campaignData = (campaignRow.characters as unknown as CampaignCharacter[]) ?? [];
    if (campaignData.length >= MAX_CAMPAIGN_CHARACTERS) {
      return {
        success: false,
        error: `This campaign has reached the maximum of ${MAX_CAMPAIGN_CHARACTERS} characters.`,
      };
    }
    const ownerChars = campaignData.filter((c) => c.userId === user.uid);
    if (ownerChars.length >= OWNER_MAX_CHARACTERS) {
      return {
        success: false,
        error: `You can add up to ${OWNER_MAX_CHARACTERS} of your own characters.`,
      };
    }
    const alreadyIn = campaignData.some(
      (c) => c.userId === user.uid && c.characterId === data.characterId,
    );
    if (alreadyIn) {
      return { success: false, error: 'This character is already in the campaign.' };
    }

    const ownerUsername = await getUsernameByUid(user.uid);
    const newChar: CampaignCharacter = {
      userId: user.uid,
      characterId: data.characterId,
      ...rosterFields,
      ownerUsername: ownerUsername || undefined,
    };
    let dbService: ReturnType<typeof createServiceRoleClient>;
    try {
      dbService = createServiceRoleClient();
    } catch {
      console.error('addCharacterToCampaignAction: SUPABASE_SERVICE_ROLE_KEY missing');
      return {
        success: false,
        error: 'Server cannot update the campaign right now. Please contact support.',
      };
    }

    const { data: mutationData, error: mutationError } = await dbService.rpc(
      'add_campaign_character_relational',
      {
        p_actor_id: user.uid,
        p_campaign_id: data.campaignId,
        p_character_id: data.characterId,
        p_roster_entry: asDbJson(newChar),
        p_expected_updated_at: typeof charData.updatedAt === 'string' ? charData.updatedAt : null,
        p_max_campaign_characters: MAX_CAMPAIGN_CHARACTERS,
        p_owner_max_characters: OWNER_MAX_CHARACTERS,
      },
    );
    if (mutationError) throw mutationError;
    const mutation = campaignCharacterMutationResult(mutationData);
    if (mutation.status === 'campaign_not_found') {
      return { success: false, error: 'Campaign not found' };
    }
    if (mutation.status === 'forbidden') {
      return {
        success: false,
        error: 'Only the Realm Master can add characters to their campaign',
      };
    }
    if (mutation.status === 'character_not_found') {
      return { success: false, error: 'Character not found' };
    }
    if (mutation.status === 'already_in_campaign') {
      return { success: false, error: 'This character is already in the campaign.' };
    }
    if (mutation.status === 'campaign_full') {
      return {
        success: false,
        error: `This campaign has reached the maximum of ${MAX_CAMPAIGN_CHARACTERS} characters.`,
      };
    }
    if (mutation.status === 'character_limit') {
      return {
        success: false,
        error: `You can add up to ${OWNER_MAX_CHARACTERS} of your own characters.`,
      };
    }
    if (mutation.status === 'conflict') {
      return { success: false, error: 'Character changed while joining campaign' };
    }
    if (mutation.status !== 'updated') {
      throw new Error(`Unexpected campaign add status: ${String(mutation.status)}`);
    }
    return { success: true, visibilityUpdated: mutation.visibilityUpdated === true };
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
      .select('id, owner_id')
      .eq('id', data.campaignId)
      .maybeSingle();
    if (!campaignRow) {
      return { success: false, error: 'Campaign not found' };
    }

    const isOwner = campaignRow.owner_id === user.uid;
    const isRemovingOwn = data.userId === user.uid;

    if (!isOwner && !isRemovingOwn) {
      return {
        success: false,
        error:
          'You can only remove your own character, or the Realm Master can remove any character.',
      };
    }

    let dbWrite: ReturnType<typeof createServiceRoleClient>;
    try {
      dbWrite = createServiceRoleClient();
    } catch {
      console.error('removeCharacterFromCampaignAction: SUPABASE_SERVICE_ROLE_KEY missing');
      return {
        success: false,
        error: 'Server cannot update the campaign right now. Please contact support.',
      };
    }

    const { data: mutationData, error: mutationError } = await dbWrite.rpc(
      'remove_campaign_character_relational',
      {
        p_actor_id: user.uid,
        p_campaign_id: data.campaignId,
        p_character_owner_id: data.userId,
        p_character_id: data.characterId,
      },
    );
    if (mutationError) throw mutationError;
    const mutation = campaignCharacterMutationResult(mutationData);
    if (mutation.status === 'campaign_not_found') {
      return { success: false, error: 'Campaign not found' };
    }
    if (mutation.status === 'forbidden') {
      return {
        success: false,
        error:
          'You can only remove your own character, or the Realm Master can remove any character.',
      };
    }
    if (mutation.status === 'character_not_found') {
      return { success: false, error: 'Character not found in campaign' };
    }
    if (mutation.status !== 'updated') {
      throw new Error(`Unexpected campaign removal status: ${String(mutation.status)}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Remove character error:', error);
    return { success: false, error: 'Failed to remove character' };
  }
}

export async function updateCampaignAction(
  campaignId: string,
  data: { name?: string | undefined; description?: string | undefined },
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

    const { error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', campaignId)
      .eq('owner_id', user.uid);
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
