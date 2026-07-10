import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { validateJson } from '@/lib/api-validation';
import { getSceneAccess, getTabletopState } from '@/lib/tabletop/server';
import { normalizeGridConfig } from '@/lib/tabletop/grid';

const fogRegionSchema = z.object({
  id: z.string().min(1).max(120),
  mode: z.enum(['cover', 'reveal']),
  x: z.number(),
  y: z.number(),
  width: z.number().min(1),
  height: z.number().min(1),
});

const scenePatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  isActive: z.boolean().optional(),
  grid: z.object({
    enabled: z.boolean().optional(),
    cellSize: z.number().min(8).max(400).optional(),
    offsetX: z.number().optional(),
    offsetY: z.number().optional(),
    color: z.string().min(1).max(40).optional(),
    opacity: z.number().min(0.05).max(1).optional(),
    snap: z.boolean().optional(),
  }).optional(),
  fog: z.object({
    enabled: z.boolean(),
    regions: z.array(fogRegionSchema).max(200),
  }).optional(),
  settings: z.object({
    showEnemyResources: z.boolean().optional(),
  }).optional(),
}).strict();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { sceneId } = await params;
    const supabase = await createClient();
    const state = await getTabletopState(supabase, sceneId, user.uid);
    if (!state) return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    return NextResponse.json(state);
  } catch (err) {
    console.error('[API Error] GET /api/tabletop/scenes/[sceneId]:', err);
    return NextResponse.json({ error: 'Failed to load tabletop scene' }, { status: 500 });
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
    const validation = await validateJson(request, scenePatchSchema);
    if (!validation.success) return validation.error;

    const { sceneId } = await params;
    const supabase = await createClient();
    const access = await getSceneAccess(supabase, sceneId, user.uid);
    if (!access) return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    if (access.role !== 'realm-master') {
      return NextResponse.json({ error: 'Only the Realm Master can update the tabletop scene.' }, { status: 403 });
    }

    const updates = validation.data;
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;
    if (updates.grid !== undefined) payload.grid = normalizeGridConfig({ ...access.scene.grid, ...updates.grid });
    if (updates.fog !== undefined) payload.fog = updates.fog;
    if (updates.settings !== undefined) payload.settings = { ...access.scene.settings, ...updates.settings };

    const { error: updateErr } = await supabase.from('vtt_scenes').update(payload).eq('id', sceneId);
    if (updateErr) throw updateErr;

    const state = await getTabletopState(supabase, sceneId, user.uid);
    return NextResponse.json(state);
  } catch (err) {
    console.error('[API Error] PATCH /api/tabletop/scenes/[sceneId]:', err);
    return NextResponse.json({ error: 'Failed to update tabletop scene' }, { status: 500 });
  }
}

