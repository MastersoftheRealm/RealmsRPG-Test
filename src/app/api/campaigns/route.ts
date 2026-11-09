/**
 * Campaigns API
 * =============
 * List campaigns for current user. Uses Supabase + campaign_members.
 * ?full=true returns full Campaign objects (with characters); otherwise returns summaries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { buildRateLimitKey, resolveClientIp, standardLimiter } from '@/lib/rate-limit';
import { campaignsListQuerySchema, validateQuery } from '@/lib/api-validation';
import type { Campaign, CampaignSummary } from '@/types/campaign';
import { rowToCampaign } from '@/lib/campaign-roster';
import type { Tables } from '@/lib/supabase/database';

type CampaignRow = Tables<'campaigns'>;

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateKey = buildRateLimitKey('campaigns-get', {
      userId: user.uid,
      ip: resolveClientIp(request.headers),
    });
    const { success } = await standardLimiter.check(rateKey);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    const queryResult = validateQuery(request, campaignsListQuerySchema);
    if (!queryResult.success) return queryResult.error;

    const userId = user.uid;
    const full = queryResult.data.full === 'true';
    const supabase = await createClient();

    const { data: memberRows, error: memberErr } = await supabase
      .from('campaign_members')
      .select('campaign_id')
      .eq('user_id', userId);
    if (memberErr) throw memberErr;
    const memberCampaignIds = (memberRows ?? []).map((r: { campaign_id: string }) => r.campaign_id);
    const { data: ownedRows, error: ownedErr } = await supabase
      .from('campaigns')
      .select('id')
      .eq('owner_id', userId);
    if (ownedErr) throw ownedErr;
    const ownedIds = (ownedRows ?? []).map((r: { id: string }) => r.id);
    const allIds = [...new Set([...memberCampaignIds, ...ownedIds])];

    if (allIds.length === 0) {
      return NextResponse.json(full ? [] : []);
    }

    const { data: campaignRows, error: campaignsErr } = await supabase
      .from('campaigns')
      .select(
        'id, name, description, owner_id, owner_username, invite_code, characters, created_at, updated_at',
      )
      .in('id', allIds)
      .order('updated_at', { ascending: false });
    if (campaignsErr) throw campaignsErr;

    // Single query for all members (avoid N+1)
    const { data: allMemberRows, error: allMemberErr } = await supabase
      .from('campaign_members')
      .select('campaign_id, user_id')
      .in('campaign_id', allIds);
    if (allMemberErr) throw allMemberErr;
    const membersByCampaignId = new Map<string, string[]>();
    for (const m of allMemberRows ?? []) {
      const row = m as { campaign_id: string; user_id: string };
      const list = membersByCampaignId.get(row.campaign_id) ?? [];
      list.push(row.user_id);
      membersByCampaignId.set(row.campaign_id, list);
    }

    const campaigns: Campaign[] = (campaignRows ?? []).map((row) => {
      const r = row as CampaignRow;
      const memberIds = membersByCampaignId.get(r.id) ?? [];
      return rowToCampaign(r, memberIds, r.owner_id === userId);
    });

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
    return apiErrorResponse('Failed to load campaigns', 500, 'GET /api/campaigns', err);
  }
}
