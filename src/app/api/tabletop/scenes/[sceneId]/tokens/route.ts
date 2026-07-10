import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { validateJson } from '@/lib/api-validation';
import { buildMissingTokensFromCombatants } from '@/lib/tabletop/tokens';
import { getSceneAccess, tokenFromRow, tokenToInsertRow, type VttTokenRow } from '@/lib/tabletop/server';
import type { Encounter, TrackedCombatant } from '@/types/encounter';

const tokenPostSchema = z.object({
  action: z.literal('sync-combatants'),
}).strict();

const tokenPatchSchema = z.object({
  id: z.string().min(1),
  updates: z.object({
    name: z.string().min(1).max(120).optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    size: z.number().min(12).max(300).optional(),
    color: z.string().min(1).max(40).optional(),
    visible: z.boolean().optional(),
    locked: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }).strict(),
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
    const validation = await validateJson(request, tokenPostSchema);
    if (!validation.success) return validation.error;

    const { sceneId } = await params;
    const supabase = await createClient();
    const access = await getSceneAccess(supabase, sceneId, user.uid);
    if (!access) return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    if (access.role !== 'realm-master') {
      return NextResponse.json({ error: 'Only the Realm Master can sync combatants.' }, { status: 403 });
    }
    if (!access.scene.encounterId) {
      return NextResponse.json({ error: 'This scene is not linked to an encounter.' }, { status: 400 });
    }

    const [{ data: encounterRow }, { data: tokenRows }] = await Promise.all([
      supabase.from('encounters').select('id, data').eq('id', access.scene.encounterId).eq('user_id', user.uid).maybeSingle(),
      supabase.from('vtt_tokens').select('*').eq('scene_id', sceneId),
    ]);
    if (!encounterRow) return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });

    const existingTokens = (tokenRows ?? []).map((row) => tokenFromRow(row as VttTokenRow));
    const encounter = (encounterRow.data as Encounter | null) ?? null;
    const missing = buildMissingTokensFromCombatants({
      sceneId,
      combatants: ((encounter?.combatants ?? []) as TrackedCombatant[]),
      existingTokens,
      grid: access.scene.grid,
      campaign: access.campaign,
    });
    if (missing.length > 0) {
      const { error: insertErr } = await supabase.from('vtt_tokens').insert(missing.map(tokenToInsertRow));
      if (insertErr) throw insertErr;
    }

    const { data: nextRows } = await supabase.from('vtt_tokens').select('*').eq('scene_id', sceneId).order('created_at', { ascending: true });
    return NextResponse.json((nextRows ?? []).map((row) => tokenFromRow(row as VttTokenRow)));
  } catch (err) {
    console.error('[API Error] POST /api/tabletop/scenes/[sceneId]/tokens:', err);
    return NextResponse.json({ error: 'Failed to sync tabletop tokens' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const validation = await validateJson(request, tokenPatchSchema);
    if (!validation.success) return validation.error;

    const { sceneId } = await params;
    const supabase = await createClient();
    const access = await getSceneAccess(supabase, sceneId, user.uid);
    if (!access) return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    if (access.role !== 'realm-master') {
      return NextResponse.json({ error: 'Only the Realm Master can move or edit tokens.' }, { status: 403 });
    }

    const { id, updates } = validation.data;
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.x !== undefined) payload.x = updates.x;
    if (updates.y !== undefined) payload.y = updates.y;
    if (updates.size !== undefined) payload.size = updates.size;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.visible !== undefined) payload.visible = updates.visible;
    if (updates.locked !== undefined) payload.locked = updates.locked;
    if (updates.metadata !== undefined) payload.metadata = updates.metadata;

    const { data, error: updateErr } = await supabase
      .from('vtt_tokens')
      .update(payload)
      .eq('scene_id', sceneId)
      .eq('id', id)
      .select('*')
      .single();
    if (updateErr) throw updateErr;
    return NextResponse.json(tokenFromRow(data as VttTokenRow));
  } catch (err) {
    console.error('[API Error] PATCH /api/tabletop/scenes/[sceneId]/tokens:', err);
    return NextResponse.json({ error: 'Failed to update tabletop token' }, { status: 500 });
  }
}

