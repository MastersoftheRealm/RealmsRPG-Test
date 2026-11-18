/**
 * Campaign Rolls API
 * ==================
 * List and add campaign rolls. Uses Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import {
  validateJson,
  campaignRollCreateSchema,
  resourceIdParamSchema,
  validateRouteParams,
} from '@/lib/api-validation';
import { standardLimiter, buildRateLimitKey, resolveClientIp } from '@/lib/rate-limit';
import { MAX_CAMPAIGN_ROLLS } from '@/app/(main)/campaigns/constants';
import { realmMasterRolledForCharacter } from '@/lib/rolls/campaign-roll-attribution';
import {
  computeRollOutcome,
  normalizeCampaignRollDice,
  resolveRollOutcomeKind,
} from '@/lib/rolls/die';
import type { DieType } from '@/lib/rolls/die';
import type { CampaignRollEntry } from '@/types/campaign-roll';

type RollDieRow = {
  position: number;
  die_type: string;
  value: number;
  is_max: boolean | null;
  is_min: boolean | null;
};

type RollRow = {
  id: string;
  character_id: string;
  character_name: string;
  user_id: string;
  type: string;
  title: string;
  rolled_at: string;
  rolled_by_realm_master: boolean;
  modifier: number;
  modifier_label: string | null;
  total: number;
  is_crit: boolean | null;
  is_crit_fail: boolean | null;
  crit_message: string | null;
  campaign_roll_dice: RollDieRow[];
};

function toEntry(row: RollRow): CampaignRollEntry {
  return {
    id: row.id,
    characterId: row.character_id,
    characterName: row.character_name,
    userId: row.user_id,
    type: row.type as CampaignRollEntry['type'],
    title: row.title,
    dice: [...row.campaign_roll_dice]
      .sort((a, b) => a.position - b.position)
      .map((die) => ({
        type: die.die_type as DieType,
        value: die.value,
        isMax: die.is_max === true,
        isMin: die.is_min === true,
      })),
    modifier: row.modifier,
    modifierLabel: row.modifier_label ?? undefined,
    total: row.total,
    isCrit: row.is_crit ?? undefined,
    isCritFail: row.is_crit_fail ?? undefined,
    critMessage: row.crit_message ?? undefined,
    rolledByRealmMaster: row.rolled_by_realm_master,
    timestamp: new Date(row.rolled_at),
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paramResult = await validateRouteParams(params, resourceIdParamSchema);
    if (!paramResult.success) return paramResult.error;
    const { id: campaignId } = paramResult.data;
    const supabase = await createClient();

    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, owner_id, characters')
      .eq('id', campaignId)
      .maybeSingle();
    if (campaignError) {
      console.error('[API Error] GET /api/campaigns/[id]/rolls campaigns:', campaignError);
      return NextResponse.json({ error: 'Failed to load campaign' }, { status: 500 });
    }
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const isOwner = campaign.owner_id === user.uid;
    let isMember = isOwner;
    if (!isOwner) {
      const { data: memberRow, error: memberError } = await supabase
        .from('campaign_members')
        .select('user_id')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.uid)
        .maybeSingle();
      if (memberError) {
        console.error('[API Error] GET /api/campaigns/[id]/rolls campaign_members:', memberError);
        return NextResponse.json({ error: 'Failed to verify campaign access' }, { status: 500 });
      }
      isMember = !!memberRow;
    }
    if (!isMember) {
      return NextResponse.json({ error: 'Not a campaign member' }, { status: 403 });
    }

    // Order: newest first; id breaks timestamp ties. Dice are fetched through
    // the campaign_roll_dice FK and restored to their stored position in toEntry.
    const { data: rows, error: rollsError } = await supabase
      .from('campaign_rolls')
      .select(
        'id, character_id, character_name, user_id, type, title, rolled_at, rolled_by_realm_master, modifier, modifier_label, total, is_crit, is_crit_fail, crit_message, campaign_roll_dice(position, die_type, value, is_max, is_min)',
      )
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(MAX_CAMPAIGN_ROLLS);

    if (rollsError) {
      console.error('[API Error] GET /api/campaigns/[id]/rolls campaign_rolls:', rollsError);
      return NextResponse.json({ error: 'Failed to load rolls' }, { status: 500 });
    }

    const roster =
      (campaign.characters as Array<{
        characterId?: string | undefined;
        userId?: string | undefined;
      }> | null) ?? [];
    const rosterCharacterIds = new Set(
      roster
        .map((entry) => entry.characterId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    );
    const characterOwnerById = new Map(
      roster
        .filter(
          (entry): entry is { characterId: string; userId?: string | undefined } =>
            typeof entry.characterId === 'string' && entry.characterId.length > 0,
        )
        .map((entry) => [entry.characterId, entry.userId] as const),
    );

    const rolls = (rows ?? [])
      .map((r) => toEntry(r as RollRow))
      .filter((entry) => rosterCharacterIds.has(entry.characterId))
      .map((entry) => ({
        ...entry,
        rolledByRealmMaster:
          entry.rolledByRealmMaster ||
          realmMasterRolledForCharacter(
            entry.userId,
            characterOwnerById.get(entry.characterId),
            campaign.owner_id,
          ),
      }));
    return NextResponse.json(rolls);
  } catch (err) {
    console.error('[API Error] GET /api/campaigns/[id]/rolls:', err);
    return NextResponse.json({ error: 'Failed to load rolls' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SEC-05: rate-limit roll submissions per user/IP (realtime fan-out makes
    // this endpoint abuse-prone).
    const { success } = await standardLimiter.check(
      buildRateLimitKey('campaign-roll', {
        userId: user.uid,
        ip: resolveClientIp(request.headers),
      }),
    );
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    const paramResult = await validateRouteParams(params, resourceIdParamSchema);
    if (!paramResult.success) return paramResult.error;
    const { id: campaignId } = paramResult.data;
    const supabase = await createClient();

    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, owner_id, characters')
      .eq('id', campaignId)
      .maybeSingle();
    if (campaignError) {
      console.error('[API Error] POST /api/campaigns/[id]/rolls campaigns:', campaignError);
      return NextResponse.json({ error: 'Failed to load campaign' }, { status: 500 });
    }
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const isOwner = campaign.owner_id === user.uid;
    let isMember = isOwner;
    if (!isOwner) {
      const { data: memberRow, error: memberError } = await supabase
        .from('campaign_members')
        .select('user_id')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.uid)
        .maybeSingle();
      if (memberError) {
        console.error('[API Error] POST /api/campaigns/[id]/rolls campaign_members:', memberError);
        return NextResponse.json({ error: 'Failed to verify campaign access' }, { status: 500 });
      }
      isMember = !!memberRow;
    }
    if (!isMember) {
      return NextResponse.json({ error: 'Not a campaign member' }, { status: 403 });
    }

    const validation = await validateJson(request, campaignRollCreateSchema);
    if (!validation.success) return validation.error;
    const { characterId, characterName, roll } = validation.data;

    // Verify the roll is attributed to a character the caller is allowed to
    // roll for: their own roster entry, or any roster character if they are the
    // RM (owner). This stops a member spoofing a roll as another player's
    // character. The displayed name is taken from the roster, not the client.
    const roster =
      (campaign.characters as Array<{
        userId?: string | undefined;
        characterId?: string | undefined;
        characterName?: string | undefined;
      }> | null) ?? [];
    const ownEntry = roster.find((c) => c.userId === user.uid && c.characterId === characterId);
    const ownerEntry = isOwner ? roster.find((c) => c.characterId === characterId) : undefined;
    const rosterEntry = ownEntry ?? ownerEntry;
    if (!rosterEntry) {
      return NextResponse.json(
        { error: 'You can only roll for your own character in this campaign.' },
        { status: 403 },
      );
    }
    const resolvedCharacterName = rosterEntry.characterName ?? characterName;
    const rolledByRealmMaster = realmMasterRolledForCharacter(
      user.uid,
      rosterEntry.userId,
      campaign.owner_id,
    );

    const dice = normalizeCampaignRollDice(roll.dice ?? []);
    const modifier = roll.modifier ?? 0;
    const outcomeKind = resolveRollOutcomeKind(roll.type, roll.outcomeKind);
    const outcome = computeRollOutcome(dice, modifier, outcomeKind);

    const rollId = crypto.randomUUID();
    const rolledAt = new Date().toISOString();
    const { error: insertError } = await supabase.rpc('create_campaign_roll_relational', {
      p_id: rollId,
      p_campaign_id: campaignId,
      p_character_id: characterId,
      p_character_name: resolvedCharacterName,
      p_user_id: user.uid,
      p_rolled_at: rolledAt,
      p_rolled_by_realm_master: rolledByRealmMaster,
      p_type: roll.type,
      p_title: roll.title,
      p_modifier: modifier,
      p_modifier_label: roll.modifierLabel ?? null,
      p_total: outcome.total,
      p_is_crit: outcome.isCrit,
      p_is_crit_fail: outcome.isCritFail,
      p_crit_message: outcome.critMessage,
      p_die_types: dice.map((die) => die.type),
      p_die_values: dice.map((die) => die.value),
      p_die_is_max: dice.map((die) => die.isMax),
      p_die_is_min: dice.map((die) => die.isMin),
    });

    if (insertError) {
      console.error('[API Error] POST /api/campaigns/[id]/rolls insert:', insertError);
      return NextResponse.json({ error: 'Failed to save roll' }, { status: 500 });
    }

    // Trim is best-effort: the roll is already saved, so a failure here only
    // leaves history longer than intended.
    const { count, error: countError } = await supabase
      .from('campaign_rolls')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);
    if (countError) {
      console.warn('[API] Roll history trim skipped (count failed):', countError);
    }

    if ((count ?? 0) > MAX_CAMPAIGN_ROLLS) {
      // The trim deletes the oldest rolls regardless of who authored them, so it
      // must run with the service role (players can now only delete their own
      // rolls via RLS — TASK-329). If the key is unavailable, skip the trim
      // rather than fail the roll.
      let dbAdmin: ReturnType<typeof createServiceRoleClient> | null = null;
      try {
        dbAdmin = createServiceRoleClient();
      } catch {
        dbAdmin = null;
      }
      if (dbAdmin) {
        const { data: oldRows, error: oldRowsError } = await dbAdmin
          .from('campaign_rolls')
          .select('id')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: true, nullsFirst: true })
          .order('id', { ascending: true })
          .limit((count ?? 0) - MAX_CAMPAIGN_ROLLS);
        if (oldRowsError) {
          console.warn('[API] Roll history trim skipped (select failed):', oldRowsError);
        }
        const idsToDelete = (oldRows ?? []).map((r: { id: string }) => r.id);
        if (idsToDelete.length) {
          const { error: trimError } = await dbAdmin
            .from('campaign_rolls')
            .delete()
            .in('id', idsToDelete);
          if (trimError) {
            console.warn('[API] Roll history trim failed:', trimError);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API Error] POST /api/campaigns/[id]/rolls:', err);
    return NextResponse.json({ error: 'Failed to save roll' }, { status: 500 });
  }
}
