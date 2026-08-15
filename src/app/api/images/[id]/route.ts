/**
 * Realms Image Library — get (public) / update meta (admin) / delete (admin)
 * GET    /api/images/[id]
 * PATCH  /api/images/[id]  { name?, categories? }
 * DELETE /api/images/[id]  — clear refs everywhere, remove storage + row
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { REALMS_IMAGES_BUCKET, parseRealmsImageCategories } from '@/lib/realms-images';
import { apiErrorResponse, logApiError } from '@/lib/api-error';
import { readJsonBodyWithLimit, verifyMutationRequest } from '@/lib/api-validation';
import { clearRealmsImageRefs } from '@/lib/realms-image-consumers';
import { fetchRealmsImageById, replaceImageCategories } from '@/lib/realms-images-server';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id?.trim()) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    // Public reads: cookie-aware anon/authenticated client so RLS governs visibility (SEC audit M3).
    const supabase = await createClient();
    const image = await fetchRealmsImageById(
      supabase as unknown as ReturnType<typeof createServiceRoleClient>,
      id,
    );
    if (!image) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(image);
  } catch (err) {
    logApiError('GET /api/images/[id]', err);
    return apiErrorResponse('Failed to load image', 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { user, error: sessionError } = await getSession();
  if (sessionError || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await isAdmin(user.uid))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const denied = verifyMutationRequest(request, { requireJsonBody: true });
  if (denied) return denied;

  try {
    const { id } = await context.params;
    if (!id?.trim()) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const read = await readJsonBodyWithLimit(request);
    if (!read.success) return read.error;
    const body = read.body as { name?: unknown; categories?: unknown } | null;
    if (
      !body ||
      typeof body !== 'object' ||
      (body.name === undefined && body.categories === undefined)
    ) {
      return NextResponse.json({ error: 'name and/or categories required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const existing = await fetchRealmsImageById(supabase, id);
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return NextResponse.json({ error: 'name must be a non-empty string' }, { status: 400 });
      }
      const { error } = await supabase
        .from('realms_images')
        .update({ name: body.name.trim(), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) {
        return apiErrorResponse('Update failed', 500, 'PATCH /api/images/[id] (name)', error);
      }
    }

    if (body.categories !== undefined) {
      const categories = parseRealmsImageCategories(body.categories);
      if (categories === null) {
        return NextResponse.json({ error: 'Invalid categories' }, { status: 400 });
      }
      const result = await replaceImageCategories(supabase, id, categories);
      if (!result.ok) {
        return apiErrorResponse(
          'Update failed',
          500,
          'PATCH /api/images/[id] (categories)',
          result.message,
        );
      }
      if (body.name === undefined) {
        await supabase
          .from('realms_images')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', id);
      }
    }

    const image = await fetchRealmsImageById(supabase, id);
    if (!image) {
      return NextResponse.json({ error: 'Updated but failed to reload' }, { status: 500 });
    }
    return NextResponse.json(image);
  } catch (err) {
    logApiError('PATCH /api/images/[id]', err);
    return apiErrorResponse('Update failed', 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { user, error: sessionError } = await getSession();
  if (sessionError || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await isAdmin(user.uid))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const denied = verifyMutationRequest(_request);
  if (denied) return denied;

  try {
    const { id } = await context.params;
    if (!id?.trim()) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const existing = await fetchRealmsImageById(supabase, id);
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const cleared = await clearRealmsImageRefs(supabase, id);
    if (cleared.errors.length > 0) {
      return apiErrorResponse(
        'Failed to clear all image references',
        500,
        'DELETE /api/images/[id] (clear refs)',
        cleared.errors,
      );
    }

    const { error: storageError } = await supabase.storage
      .from(REALMS_IMAGES_BUCKET)
      .remove([existing.storagePath]);
    if (storageError) {
      console.error('[realms-images] storage remove failed:', storageError);
      // Continue — orphan file is preferable to stuck refs; row still deleted
    }

    const { error: deleteError } = await supabase.from('realms_images').delete().eq('id', id);
    if (deleteError) {
      return apiErrorResponse('Delete failed', 500, 'DELETE /api/images/[id]', deleteError);
    }

    return NextResponse.json({ ok: true, cleared: cleared.cleared });
  } catch (err) {
    logApiError('DELETE /api/images/[id]', err);
    return apiErrorResponse('Delete failed', 500);
  }
}
