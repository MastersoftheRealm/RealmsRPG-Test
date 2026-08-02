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
      id
    );
    if (!image) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(image);
  } catch (err) {
    console.error('[API Error] GET /api/images/[id]:', err);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
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

  try {
    const { id } = await context.params;
    if (!id?.trim()) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const body = (await request.json().catch(() => null)) as {
      name?: unknown;
      categories?: unknown;
    } | null;
    if (!body || (body.name === undefined && body.categories === undefined)) {
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
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (body.categories !== undefined) {
      const categories = parseRealmsImageCategories(body.categories);
      if (categories === null) {
        return NextResponse.json({ error: 'Invalid categories' }, { status: 400 });
      }
      const result = await replaceImageCategories(supabase, id, categories);
      if (!result.ok) {
        return NextResponse.json({ error: result.message }, { status: 500 });
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
    console.error('[API Error] PATCH /api/images/[id]:', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
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
      console.error('[realms-images] clear refs partial failure:', cleared.errors);
      return NextResponse.json(
        { error: 'Failed to clear all image references', details: cleared.errors.join('; ') },
        { status: 500 }
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
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, cleared: cleared.cleared });
  } catch (err) {
    console.error('[API Error] DELETE /api/images/[id]:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
