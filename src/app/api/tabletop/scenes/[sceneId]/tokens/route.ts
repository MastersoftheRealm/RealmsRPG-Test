import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { validateJson } from '@/lib/api-validation';
import { rowToItem } from '@/lib/library-columnar';
import { buildMissingTokensFromCombatants, buildTokenFromCreature } from '@/lib/tabletop/tokens';
import { getSceneAccess, tokenFromRow, tokenToInsertRow, type VttTokenRow } from '@/lib/tabletop/server';
import type { Encounter, TrackedCombatant } from '@/types/encounter';
import type { LibraryCreature } from '@/types/library';

const tokenPostSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('sync-combatants'),
  }).strict(),
  z.object({
    action: z.literal('add-creature'),
    source: z.enum(['official', 'user']),
    creatureId: z.string().min(1),
    quantity: z.number().int().min(1).max(26).optional(),
    visible: z.boolean().optional(),
  }).strict(),
]);

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

const tokenDeleteSchema = z.object({
  id: z.string().min(1),
}).strict();

async function loadCreatureForToken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: { source: 'official' | 'user'; creatureId: string; userId: string }
): Promise<LibraryCreature | null> {
  const table = params.source === 'official' ? 'official_creatures' : 'user_creatures';
  let query = supabase.from(table).select('*').eq('id', params.creatureId);
  if (params.source === 'user') {
    query = query.eq('user_id', params.userId);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return rowToItem('creatures', data as Record<string, unknown>, params.source) as unknown as LibraryCreature;
}

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
      return NextResponse.json({ error: 'Only the Realm Master can add tabletop tokens.' }, { status: 403 });
    }

    if (validation.data.action === 'sync-combatants') {
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
    }

    const addCreatureRequest = validation.data;
    const creatureId = addCreatureRequest.creatureId;
    const visible = addCreatureRequest.visible ?? false;
    const quantity = addCreatureRequest.quantity ?? 1;
    const creature = await loadCreatureForToken(supabase, {
      source: addCreatureRequest.source,
      creatureId,
      userId: user.uid,
    });
    if (!creature) return NextResponse.json({ error: 'Creature not found' }, { status: 404 });

    const { count, error: countErr } = await supabase
      .from('vtt_tokens')
      .select('id', { count: 'exact', head: true })
      .eq('scene_id', sceneId);
    if (countErr) throw countErr;

    const tokens = Array.from({ length: quantity }, (_, index) => {
      const suffix = quantity > 1 ? ` ${String.fromCharCode(65 + index)}` : '';
      return buildTokenFromCreature({
        sceneId,
        creature: { ...creature, name: `${creature.name}${suffix}` },
        sourceId: creatureId,
        index: (count ?? 0) + index,
        grid: access.scene.grid,
        visible,
      });
    });

    const { data: insertedRows, error: insertErr } = await supabase
      .from('vtt_tokens')
      .insert(tokens.map(tokenToInsertRow))
      .select('*');
    if (insertErr) throw insertErr;

    return NextResponse.json((insertedRows ?? []).map((row) => tokenFromRow(row as VttTokenRow)));
  } catch (err) {
    console.error('[API Error] POST /api/tabletop/scenes/[sceneId]/tokens:', err);
    return NextResponse.json({ error: 'Failed to add tabletop tokens' }, { status: 500 });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const validation = await validateJson(request, tokenDeleteSchema);
    if (!validation.success) return validation.error;

    const { sceneId } = await params;
    const supabase = await createClient();
    const access = await getSceneAccess(supabase, sceneId, user.uid);
    if (!access) return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    if (access.role !== 'realm-master') {
      return NextResponse.json({ error: 'Only the Realm Master can delete tokens.' }, { status: 403 });
    }

    const { id } = validation.data;
    const { error: actionDeleteErr } = await supabase
      .from('vtt_actions')
      .delete()
      .eq('scene_id', sceneId)
      .eq('token_id', id);
    if (actionDeleteErr) throw actionDeleteErr;

    const { data, error: deleteErr } = await supabase
      .from('vtt_tokens')
      .delete()
      .eq('scene_id', sceneId)
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (deleteErr) throw deleteErr;
    if (!data) return NextResponse.json({ error: 'Token not found' }, { status: 404 });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[API Error] DELETE /api/tabletop/scenes/[sceneId]/tokens:', err);
    return NextResponse.json({ error: 'Failed to delete tabletop token' }, { status: 500 });
  }
}
