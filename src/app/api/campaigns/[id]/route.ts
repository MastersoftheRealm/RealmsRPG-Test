/**
 * Campaign by ID API
 * ==================
 * Get a single campaign. Uses Supabase + campaign_members.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { apiErrorResponse } from '@/lib/api-error';
import { buildRateLimitKey, resolveClientIp, standardLimiter } from '@/lib/rate-limit';
import { resourceIdParamSchema, validateRouteParams } from '@/lib/api-validation';
import { rowToCampaign } from '@/lib/campaign-roster';
import type { Tables } from '@/lib/supabase/database';

type CampaignRow = Tables<'campaigns'>;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paramResult = await validateRouteParams(params, resourceIdParamSchema);
    if (!paramResult.success) return paramResult.error;
    const { id } = paramResult.data;

    const { success } = await standardLimiter.check(
      buildRateLimitKey('campaign-get', { userId: user.uid, ip: resolveClientIp(request.headers) }),
    );
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    const supabase = await createClient();
    const { data: row, error: rowErr } = await supabase
      .from('campaigns')
      .select(
        'id, name, description, owner_id, owner_username, invite_code, characters, created_at, updated_at',
      )
      .eq('id', id)
      .maybeSingle();
    if (rowErr) throw rowErr;

    if (!row) {
      return NextResponse.json(null, { status: 404 });
    }

    const { data: members, error: membersErr } = await supabase
      .from('campaign_members')
      .select('user_id')
      .eq('campaign_id', row.id);
    if (membersErr) throw membersErr;
    const memberIds = (members ?? []).map((m: { user_id: string }) => m.user_id);

    const isOwner = row.owner_id === user.uid;
    const isMember = isOwner || memberIds.includes(user.uid);
    if (!isMember) {
      return NextResponse.json(null, { status: 404 });
    }

    const campaign = rowToCampaign(row as CampaignRow, memberIds, isOwner);
    return NextResponse.json(campaign);
  } catch (err) {
    return apiErrorResponse('Failed to load campaign', 500, 'GET /api/campaigns/[id]', err);
  }
}
