/**
 * Campaign Rolls API
 * ==================
 * List and add campaign rolls. Uses Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { validateJson, campaignRollCreateSchema } from '@/lib/api-validation';
import { standardLimiter, buildRateLimitKey, resolveClientIp } from '@/lib/rate-limit';
import { MAX_CAMPAIGN_ROLLS } from '@/app/(main)/campaigns/constants';
import type { CampaignRollEntry } from '@/types/campaign-roll';

type RollRow = {
  id: string;
  data: unknown;
  created_at: string | null;
  character_id?: string | null;
  user_id?: string | null;
  type?: string | null;
  title?: string | null;
};

function toEntry(row: RollRow): CampaignRollEntry {
  const d = (row.data as Record<string, unknown>) ?? {};
  const ts = d.timestamp;
  return {
    id: row.id,
    characterId: (row.character_id ?? d.characterId) as string,
    characterName: d.characterName as string,
    userId: (row.user_id ?? d.userId) as string,
    type: (row.type ?? d.type) as CampaignRollEntry['type'],
    title: (row.title ?? d.title) as string,
    dice: (d.dice as CampaignRollEntry['dice']) || [],
    modifier: (d.modifier as number) ?? 0,
    total: (d.total as number) ?? 0,
    isCrit: d.isCrit as boolean | undefined,
    isCritFail: d.isCritFail as boolean | undefined,
    critMessage: d.critMessage as string | undefined,
    timestamp:
      ts instanceof Date
        ? ts
        : typeof ts === 'string'
          ? new Date(ts)
          : (ts as { seconds?: number })?.seconds
            ? new Date((ts as { seconds: number }).seconds * 1000)
            : new Date(),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: campaignId } = await params;
    const supabase = await createClient();

    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, owner_id')
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

    // Only id + data + created_at: works on DBs that have not run campaign_rolls list-column migration;
    // toEntry() already reads characterId, type, etc. from JSONB `data` when list columns are absent.
    // Order: newest first. Rows with NULL created_at (legacy inserts) sort last so LIMIT 50 still returns
    // recent rolls once POST sets created_at; id breaks ties.
    const { data: rows, error: rollsError } = await supabase
      .from('campaign_rolls')
      .select('id, data, created_at')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false, nullsFirst: false })
      .order('id', { ascending: false })
      .limit(MAX_CAMPAIGN_ROLLS);

    if (rollsError) {
      console.error('[API Error] GET /api/campaigns/[id]/rolls campaign_rolls:', rollsError);
      return NextResponse.json({ error: 'Failed to load rolls' }, { status: 500 });
    }

    const rolls = (rows ?? []).map((r) => toEntry(r as RollRow));
    return NextResponse.json(rolls);
  } catch (err) {
    console.error('[API Error] GET /api/campaigns/[id]/rolls:', err);
    return NextResponse.json({ error: 'Failed to load rolls' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SEC-05: rate-limit roll submissions per user/IP (realtime fan-out makes
    // this endpoint abuse-prone).
    const { success } = standardLimiter.check(
      buildRateLimitKey('campaign-roll', { userId: user.uid, ip: resolveClientIp(request.headers) })
    );
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { id: campaignId } = await params;
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
    const roster = (campaign.characters as Array<{ userId?: string; characterId?: string; characterName?: string }> | null) ?? [];
    const ownEntry = roster.find((c) => c.userId === user.uid && c.characterId === characterId);
    const ownerEntry = isOwner ? roster.find((c) => c.characterId === characterId) : undefined;
    const rosterEntry = ownEntry ?? ownerEntry;
    if (!rosterEntry) {
      return NextResponse.json(
        { error: 'You can only roll for your own character in this campaign.' },
        { status: 403 }
      );
    }
    const resolvedCharacterName = rosterEntry.characterName ?? characterName;

    const rollData = {
      characterId,
      characterName: resolvedCharacterName,
      userId: user.uid,
      type: roll.type,
      title: roll.title,
      dice: roll.dice ?? [],
      modifier: roll.modifier ?? 0,
      total: roll.total ?? 0,
      isCrit: roll.isCrit ?? false,
      isCritFail: roll.isCritFail ?? false,
      critMessage: roll.critMessage ?? null,
      timestamp: new Date().toISOString(),
    };

    const rollId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const { error: insertError } = await supabase.from('campaign_rolls').insert({
      id: rollId,
      campaign_id: campaignId,
      data: rollData,
      created_at: createdAt,
      character_id: characterId,
      user_id: user.uid,
      type: roll.type,
      title: roll.title ?? '',
    });

    if (insertError) {
      console.error('[API Error] POST /api/campaigns/[id]/rolls insert:', insertError);
      return NextResponse.json({ error: 'Failed to save roll' }, { status: 500 });
    }

    const { count } = await supabase
      .from('campaign_rolls')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);

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
        const { data: oldRows } = await dbAdmin
          .from('campaign_rolls')
          .select('id')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: true, nullsFirst: true })
          .order('id', { ascending: true })
          .limit((count ?? 0) - MAX_CAMPAIGN_ROLLS);
        const idsToDelete = (oldRows ?? []).map((r: { id: string }) => r.id);
        if (idsToDelete.length) {
          await dbAdmin.from('campaign_rolls').delete().in('id', idsToDelete);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API Error] POST /api/campaigns/[id]/rolls:', err);
    return NextResponse.json({ error: 'Failed to save roll' }, { status: 500 });
  }
}
