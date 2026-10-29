/**
 * Realms Image Library — usage report (admin)
 * GET /api/images/[id]/usage
 * Lists entities with image_id pointing at this asset (for delete/replace warn UI).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { resourceIdParamSchema, validateRouteParams } from '@/lib/api-validation';
import { listRealmsImageUsages } from '@/lib/realms-image-consumers';
import { fetchRealmsImageById } from '@/lib/realms-images-server';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { user, error: sessionError } = await getSession();
  if (sessionError || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await isAdmin(user.uid))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const paramResult = await validateRouteParams(context.params, resourceIdParamSchema);
    if (!paramResult.success) return paramResult.error;
    const { id } = paramResult.data;

    const supabase = createServiceRoleClient();
    const image = await fetchRealmsImageById(supabase, id);
    if (!image) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const usages = await listRealmsImageUsages(supabase, id);
    return NextResponse.json({ imageId: id, usages });
  } catch (err) {
    console.error('[API Error] GET /api/images/[id]/usage:', err);
    return NextResponse.json({ error: 'Failed to load usage' }, { status: 500 });
  }
}
