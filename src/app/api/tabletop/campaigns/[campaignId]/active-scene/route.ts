import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { getCampaignForAccess, getTabletopState } from '@/lib/tabletop/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaignId } = await params;
    const supabase = await createClient();
    const access = await getCampaignForAccess(supabase, campaignId, user.uid);
    if (!access) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const { data: scene } = await supabase
      .from('vtt_scenes')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!scene?.id) {
      return NextResponse.json({ error: 'No active tabletop scene' }, { status: 404 });
    }

    const state = await getTabletopState(supabase, scene.id, user.uid);
    if (!state) {
      return NextResponse.json({ error: 'No active tabletop scene' }, { status: 404 });
    }
    return NextResponse.json(state);
  } catch (err) {
    console.error('[API Error] GET /api/tabletop/campaigns/[campaignId]/active-scene:', err);
    return NextResponse.json({ error: 'Failed to load tabletop' }, { status: 500 });
  }
}

