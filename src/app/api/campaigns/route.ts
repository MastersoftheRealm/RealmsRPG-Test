/**
 * Campaigns API
 * =============
 * List campaigns for current user. Uses Supabase + campaign_members.
 * ?full=true returns full Campaign objects (with characters); otherwise returns summaries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import type { Campaign, CampaignSummary } from '@/types/campaign';

type CampaignRow = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  owner_username: string | null;
  invite_code: string;
  characters: unknown;
  created_at: string | null;
  updated_at: string | null;
};

function rowToCampaign(row: CampaignRow, memberIds: string[]): Campaign {
  const characters = Array.isArray(row.characters)
    ? row.characters
    : (typeof row.characters === 'string' ? JSON.parse(row.characters as string) : []) as Campaign['characters'];
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    ownerId: row.owner_id,
    ownerUsername: row.owner_username ?? undefined,
    inviteCode: row.invite_code,
    characters,
    memberIds,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.uid;
    const full = request.nextUrl.searchParams.get('full') === 'true';
    const supabase = await createClient();

    const { data: memberRows } = await supabase
      .from('campaign_members')
      .select('campaign_id')
      .eq('user_id', userId);
    const memberCampaignIds = (memberRows ?? []).map((r: { campaign_id: string }) => r.campaign_id);
    const { data: ownedRows } = await supabase.from('campaigns').select('id').eq('owner_id', userId);
    const ownedIds = (ownedRows ?? []).map((r: { id: string }) => r.id);
    const allIds = [...new Set([...memberCampaignIds, ...ownedIds])];

    if (allIds.length === 0) {
      return NextResponse.json(full ? [] : []);
    }

    const { data: campaignRows } = await supabase
      .from('campaigns')
      .select('id, name, description, owner_id, owner_username, invite_code, characters, created_at, updated_at')
      .in('id', allIds)
      .order('updated_at', { ascending: false });

    const campaigns: Campaign[] = [];
    for (const row of campaignRows ?? []) {
      const r = row as CampaignRow;
      const { data: members } = await supabase
        .from('campaign_members')
        .select('user_id')
        .eq('campaign_id', r.id);
      const memberIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
      campaigns.push(rowToCampaign(r, memberIds));
    }

    if (full) {
      return NextResponse.json(campaigns);
    }

    const summaries: CampaignSummary[] = campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      ownerId: c.ownerId,
      ownerUsername: c.ownerUsername,
      characterCount: c.characters?.length ?? 0,
      isOwner: c.ownerId === userId,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json(summaries);
  } catch (err) {
    console.error('[API Error] GET /api/campaigns:', err);
    return NextResponse.json({ error: 'Failed to load campaigns' }, { status: 500 });
  }
}
