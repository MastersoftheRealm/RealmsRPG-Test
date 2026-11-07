import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { validateImageMagicBytes } from '@/lib/validate-image';
import { buildRateLimitKey, resolveClientIp, uploadLimiter } from '@/lib/rate-limit';
import { getSceneAccess, getTabletopState, VTT_MAPS_BUCKET } from '@/lib/tabletop/server';

const MAX_SIZE = 12 * 1024 * 1024;

function extensionForType(type: string): string {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: sessionError } = await getSession();
    if (sessionError || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const key = buildRateLimitKey('upload-vtt-map', {
      userId: user.uid,
      ip: resolveClientIp(request.headers),
    });
    const { success } = await uploadLimiter.check(key);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sceneId = String(formData.get('sceneId') ?? '');
    const width = Number(formData.get('width'));
    const height = Number(formData.get('height'));

    if (!file || !sceneId || !Number.isFinite(width) || !Number.isFinite(height)) {
      return NextResponse.json(
        { error: 'file, sceneId, width, and height are required' },
        { status: 400 },
      );
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Must be an image file' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Map image must be less than 12MB' }, { status: 400 });
    }
    if (!(await validateImageMagicBytes(file))) {
      return NextResponse.json({ error: 'Invalid image file' }, { status: 400 });
    }

    const supabase = await createClient();
    const access = await getSceneAccess(supabase, sceneId, user.uid);
    if (!access) return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    if (access.role !== 'realm-master') {
      return NextResponse.json(
        { error: 'Only the Realm Master can upload tabletop maps.' },
        { status: 403 },
      );
    }

    const service = createServiceRoleClient();
    const ext = extensionForType(file.type);
    const path = `${access.scene.campaignId}/${sceneId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await service.storage
      .from(VTT_MAPS_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadErr) throw uploadErr;

    const map = {
      storagePath: path,
      width: Math.round(width),
      height: Math.round(height),
      fileName: file.name,
      contentType: file.type,
      uploadedAt: new Date().toISOString(),
    };
    const { error: updateErr } = await supabase
      .from('vtt_scenes')
      .update({ map, updated_at: new Date().toISOString() })
      .eq('id', sceneId);
    if (updateErr) throw updateErr;

    const state = await getTabletopState(supabase, sceneId, user.uid);
    return NextResponse.json(state);
  } catch (err) {
    console.error('[API Error] POST /api/upload/vtt-map:', err);
    return NextResponse.json({ error: 'Failed to upload tabletop map' }, { status: 500 });
  }
}
