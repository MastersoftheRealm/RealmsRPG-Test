import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { normalizeGridConfig } from '@/lib/tabletop/grid';
import { buildMissingTokensFromCombatants } from '@/lib/tabletop/tokens';
import { getCampaignForAccess, getTabletopState, tokenFromRow, tokenToInsertRow, type VttTokenRow } from '@/lib/tabletop/server';
import type { Encounter, TrackedCombatant } from '@/types/encounter';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: encounterId } = await params;
    const supabase = await createClient();
    const { data: encounterRow } = await supabase
      .from('encounters')
      .select('id, data')
      .eq('id', encounterId)
      .eq('user_id', user.uid)
      .maybeSingle();

    if (!encounterRow) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
    }

    const encounter = (encounterRow.data as Encounter | null) ?? null;
    const campaignId = encounter?.campaignId;
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Link this encounter to a campaign before opening the tabletop.' },
        { status: 400 }
      );
    }

    const campaignAccess = await getCampaignForAccess(supabase, campaignId, user.uid);
    if (!campaignAccess || campaignAccess.role !== 'realm-master') {
      return NextResponse.json({ error: 'Only the Realm Master can open a tabletop for this encounter.' }, { status: 403 });
    }

    const { data: existing } = await supabase
      .from('vtt_scenes')
      .select('*')
      .eq('encounter_id', encounterId)
      .eq('campaign_id', campaignId)
      .maybeSingle();

    const sceneId = existing?.id ?? crypto.randomUUID();
    if (!existing) {
      const now = new Date().toISOString();
      const { error: insertSceneErr } = await supabase.from('vtt_scenes').insert({
        id: sceneId,
        campaign_id: campaignId,
        encounter_id: encounterId,
        name: encounter?.name ? `${encounter.name} Tabletop` : 'Encounter Tabletop',
        is_active: true,
        grid: normalizeGridConfig(),
        fog: { enabled: false, regions: [] },
        settings: { showEnemyResources: false },
        created_at: now,
        updated_at: now,
      });
      if (insertSceneErr) throw insertSceneErr;
    } else if (existing.is_active !== true) {
      await supabase
        .from('vtt_scenes')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', sceneId);
    }

    const { data: tokenRows } = await supabase.from('vtt_tokens').select('*').eq('scene_id', sceneId);
    const existingTokens = (tokenRows ?? []).map((row) => tokenFromRow(row as VttTokenRow));
    const missing = buildMissingTokensFromCombatants({
      sceneId,
      combatants: ((encounter?.combatants ?? []) as TrackedCombatant[]),
      existingTokens,
      grid: normalizeGridConfig(existing?.grid as Record<string, unknown> | undefined),
      campaign: campaignAccess.campaign,
    });
    if (missing.length > 0) {
      const { error: insertTokensErr } = await supabase.from('vtt_tokens').insert(missing.map(tokenToInsertRow));
      if (insertTokensErr) throw insertTokensErr;
    }

    return NextResponse.json({ sceneId, campaignId });
  } catch (err) {
    console.error('[API Error] POST /api/encounters/[encounterId]/tabletop:', err);
    return NextResponse.json({ error: 'Failed to open tabletop' }, { status: 500 });
  }
}
