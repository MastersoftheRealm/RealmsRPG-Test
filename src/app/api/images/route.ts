/**
 * Realms Image Library — list (public) + create (admin)
 * GET  /api/images?category=weapon,power&q=dagger
 * POST /api/images  multipart: file, name, categories
 */

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { detectImageMime, extensionForImageMime, validateImageMagicBytes } from '@/lib/validate-image';
import { buildRateLimitKey, resolveClientIp, uploadLimiter } from '@/lib/rate-limit';
import {
  REALMS_IMAGES_BUCKET,
  isRealmsImageCategory,
  parseRealmsImageCategories,
  realmsImageStoragePath,
  type RealmsImageCategory,
} from '@/lib/realms-images';
import { apiErrorResponse, logApiError } from '@/lib/api-error';
import { verifyMutationRequest } from '@/lib/api-validation';
import {
  REALMS_IMAGE_SELECT,
  fetchRealmsImageById,
  mapRealmsImageRow,
  replaceImageCategories,
  type RealmsImageRow,
} from '@/lib/realms-images-server';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 5 * 1024 * 1024;

function parseCategoryFilter(raw: string | null): RealmsImageCategory[] | null {
  if (!raw?.trim()) return [];
  const parts = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const out: RealmsImageCategory[] = [];
  for (const p of parts) {
    if (!isRealmsImageCategory(p)) return null;
    if (!out.includes(p)) out.push(p);
  }
  return out;
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const categories = parseCategoryFilter(params.get('category'));
    if (categories === null) {
      return NextResponse.json({ error: 'Invalid category filter' }, { status: 400 });
    }
    const q = params.get('q')?.trim() ?? '';

    // Public reads: cookie-aware anon/authenticated client so RLS governs visibility (SEC audit M3).
    const supabase = await createClient();

    // Category filter: resolve matching image ids via join table, then hydrate full rows
    // (inner-join select can truncate sibling tags / confuse typed select strings).
    let filteredIds: string[] | null = null;
    if (categories.length > 0) {
      const { data: catRows, error: catError } = await supabase
        .from('realms_image_categories')
        .select('image_id')
        .in('category', categories);
      if (catError) {
        return apiErrorResponse('Failed to list images', 500, 'GET /api/images (categories)', catError);
      }
      filteredIds = Array.from(
        new Set((catRows ?? []).map((r) => String((r as { image_id: string }).image_id)))
      );
      if (filteredIds.length === 0) {
        return NextResponse.json({ images: [] });
      }
    }

    let query = supabase
      .from('realms_images')
      .select(REALMS_IMAGE_SELECT)
      .order('name', { ascending: true });

    if (filteredIds) {
      query = query.in('id', filteredIds);
    }
    if (q) {
      query = query.ilike('name', `%${q}%`);
    }

    const { data, error } = await query;
    if (error) {
      return apiErrorResponse('Failed to list images', 500, 'GET /api/images', error);
    }

    const images = ((data ?? []) as RealmsImageRow[]).map(mapRealmsImageRow);
    return NextResponse.json({ images });
  } catch (err) {
    logApiError('GET /api/images', err);
    return apiErrorResponse('Failed to list images', 500);
  }
}

export async function POST(request: NextRequest) {
  const { user, error: sessionError } = await getSession();
  if (sessionError || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await isAdmin(user.uid))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const denied = verifyMutationRequest(request);
  if (denied) return denied;

  const key = buildRateLimitKey('upload-realms-image', {
    userId: user.uid,
    ip: resolveClientIp(request.headers),
  });
  const { success } = await uploadLimiter.check(key);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const nameRaw = formData.get('name');
    const name = typeof nameRaw === 'string' ? nameRaw.trim() : '';
    const categories = parseRealmsImageCategories(formData.get('categories'));

    if (!file) {
      return NextResponse.json({ error: 'file required' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }
    if (categories === null) {
      return NextResponse.json({ error: 'Invalid categories' }, { status: 400 });
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

    const mime = await detectImageMime(file);
    if (!mime) {
      return NextResponse.json({ error: 'Invalid image file' }, { status: 400 });
    }
    const ext = extensionForImageMime(mime);
    const contentType = mime;
    const imageId = randomUUID();
    const storagePath = realmsImageStoragePath(imageId, ext);

    const supabase = createServiceRoleClient();

    const { error: uploadError } = await supabase.storage
      .from(REALMS_IMAGES_BUCKET)
      .upload(storagePath, file, { upsert: false, contentType });

    if (uploadError) {
      return apiErrorResponse('Upload failed', 500, 'POST /api/images (storage upload)', uploadError);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(REALMS_IMAGES_BUCKET).getPublicUrl(storagePath);

    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from('realms_images').insert({
      id: imageId,
      name,
      storage_path: storagePath,
      public_url: publicUrl,
      created_at: now,
      updated_at: now,
      created_by: user.uid,
    });

    if (insertError) {
      await supabase.storage.from(REALMS_IMAGES_BUCKET).remove([storagePath]);
      return apiErrorResponse('Upload failed', 500, 'POST /api/images (insert)', insertError);
    }

    const cats = await replaceImageCategories(supabase, imageId, categories);
    if (!cats.ok) {
      await supabase.from('realms_images').delete().eq('id', imageId);
      await supabase.storage.from(REALMS_IMAGES_BUCKET).remove([storagePath]);
      return apiErrorResponse('Upload failed', 500, 'POST /api/images (categories)', cats.message);
    }

    const image = await fetchRealmsImageById(supabase, imageId);
    if (!image) {
      return NextResponse.json({ error: 'Created but failed to reload image' }, { status: 500 });
    }
    return NextResponse.json(image, { status: 201 });
  } catch (err) {
    logApiError('POST /api/images', err);
    return apiErrorResponse('Upload failed', 500);
  }
}
