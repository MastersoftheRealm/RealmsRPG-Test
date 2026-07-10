import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { validateJson } from '@/lib/api-validation';
import { actionFromRow, getSceneAccess, type VttActionRow } from '@/lib/tabletop/server';

const actionCreateSchema = z.object({
  type: z.enum(['ping', 'move-request']),
  tokenId: z.string().min(1).optional(),
  fromX: z.number().optional(),
  fromY: z.number().optional(),
  toX: z.number(),
  toY: z.number(),
  message: z.string().max(240).optional(),
}).strict();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const validation = await validateJson(request, actionCreateSchema);
    if (!validation.success) return validation.error;

    const { sceneId } = await params;
    const supabase = await createClient();
    const access = await getSceneAccess(supabase, sceneId, user.uid);
    if (!access) return NextResponse.json({ error: 'Scene not found' }, { status: 404 });

    const action = validation.data;
    if (action.type === 'move-request' && !action.tokenId) {
      return NextResponse.json({ error: 'Move requests require a token.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data, error: insertErr } = await supabase
      .from('vtt_actions')
      .insert({
        id: crypto.randomUUID(),
        scene_id: sceneId,
        user_id: user.uid,
        type: action.type,
        status: action.type === 'ping' ? 'accepted' : 'pending',
        token_id: action.tokenId ?? null,
        from_x: action.fromX ?? null,
        from_y: action.fromY ?? null,
        to_x: action.toX,
        to_y: action.toY,
        message: action.message ?? null,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single();
    if (insertErr) throw insertErr;
    return NextResponse.json(actionFromRow(data as VttActionRow));
  } catch (err) {
    console.error('[API Error] POST /api/tabletop/scenes/[sceneId]/actions:', err);
    return NextResponse.json({ error: 'Failed to create tabletop action' }, { status: 500 });
  }
}

