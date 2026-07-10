import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { validateJson } from '@/lib/api-validation';
import { actionFromRow, getSceneAccess, type VttActionRow } from '@/lib/tabletop/server';

const actionPatchSchema = z.object({
  status: z.enum(['accepted', 'dismissed']),
}).strict();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ actionId: string }> }
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const validation = await validateJson(request, actionPatchSchema);
    if (!validation.success) return validation.error;

    const { actionId } = await params;
    const supabase = await createClient();
    const { data: actionRow } = await supabase.from('vtt_actions').select('*').eq('id', actionId).maybeSingle();
    if (!actionRow) return NextResponse.json({ error: 'Action not found' }, { status: 404 });

    const action = actionFromRow(actionRow as VttActionRow);
    const access = await getSceneAccess(supabase, action.sceneId, user.uid);
    if (!access) return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    if (access.role !== 'realm-master') {
      return NextResponse.json({ error: 'Only the Realm Master can resolve tabletop actions.' }, { status: 403 });
    }

    const now = new Date().toISOString();
    if (validation.data.status === 'accepted' && action.type === 'move-request' && action.tokenId) {
      const { error: tokenErr } = await supabase
        .from('vtt_tokens')
        .update({ x: action.toX, y: action.toY, updated_at: now })
        .eq('scene_id', action.sceneId)
        .eq('id', action.tokenId);
      if (tokenErr) throw tokenErr;
    }

    const { data, error: updateErr } = await supabase
      .from('vtt_actions')
      .update({ status: validation.data.status, updated_at: now })
      .eq('id', actionId)
      .select('*')
      .single();
    if (updateErr) throw updateErr;
    return NextResponse.json(actionFromRow(data as VttActionRow));
  } catch (err) {
    console.error('[API Error] PATCH /api/tabletop/actions/[actionId]:', err);
    return NextResponse.json({ error: 'Failed to resolve tabletop action' }, { status: 500 });
  }
}

