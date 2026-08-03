/**
 * Realms Image Library — replace master file (admin)
 * POST /api/images/[id]/replace  multipart: file
 * Updates Storage object (same or new path), public_url, and consumer image_url caches.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { detectImageMime, extensionForImageMime, validateImageMagicBytes } from '@/lib/validate-image';
import { buildRateLimitKey, resolveClientIp, uploadLimiter } from '@/lib/rate-limit';
import { apiErrorResponse, logApiError } from '@/lib/api-error';
import {
  REALMS_IMAGES_BUCKET,
  realmsImageStoragePath,
  withCacheBust,
} from '@/lib/realms-images';
import { syncRealmsImageCacheUrls } from '@/lib/realms-image-consumers';
import { fetchRealmsImageById } from '@/lib/realms-images-server';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 5 * 1024 * 1024;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { user, error: sessionError } = await getSession();
  if (sessionError || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await isAdmin(user.uid))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const key = buildRateLimitKey('replace-realms-image', {
    userId: user.uid,
    ip: resolveClientIp(request.headers),
  });
  const { success } = await uploadLimiter.check(key);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  try {
    const { id } = await context.params;
    if (!id?.trim()) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'file required' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Must be an image file' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image must be less than 5MB' }, { status: 400 });
    }
    if (!(await validateImageMagicBytes(file))) {
      return NextResponse.json({ error: 'Invalid image file' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const existing = await fetchRealmsImageById(supabase, id);
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const mime = await detectImageMime(file);
    if (!mime) {
      return NextResponse.json({ error: 'Invalid image file' }, { status: 400 });
    }
    const ext = extensionForImageMime(mime);
    const contentType = mime;
    const nextPath = realmsImageStoragePath(id, ext);
    const previousPath = existing.storagePath;

    const { error: uploadError } = await supabase.storage
      .from(REALMS_IMAGES_BUCKET)
      .upload(nextPath, file, { upsert: true, contentType });

    if (uploadError) {
      return apiErrorResponse('Replace failed', 500, 'POST /api/images/[id]/replace (upload)', uploadError);
    }

    if (previousPath && previousPath !== nextPath) {
      const { error: removeError } = await supabase.storage
        .from(REALMS_IMAGES_BUCKET)
        .remove([previousPath]);
      if (removeError) {
        console.warn('[realms-images] old path cleanup failed:', removeError.message);
      }
    }

    const {
      data: { publicUrl: baseUrl },
    } = supabase.storage.from(REALMS_IMAGES_BUCKET).getPublicUrl(nextPath);
    const publicUrl = withCacheBust(baseUrl);

    const { error: updateError } = await supabase
      .from('realms_images')
      .update({
        storage_path: nextPath,
        public_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return apiErrorResponse('Replace failed', 500, 'POST /api/images/[id]/replace (update)', updateError);
    }

    const synced = await syncRealmsImageCacheUrls(supabase, id, publicUrl);
    if (synced.errors.length > 0) {
      console.warn('[realms-images] cache sync warnings:', synced.errors);
    }

    const image = await fetchRealmsImageById(supabase, id);
    if (!image) {
      return NextResponse.json({ error: 'Replaced but failed to reload' }, { status: 500 });
    }
    return NextResponse.json(image);
  } catch (err) {
    logApiError('POST /api/images/[id]/replace', err);
    return apiErrorResponse('Replace failed', 500);
  }
}
