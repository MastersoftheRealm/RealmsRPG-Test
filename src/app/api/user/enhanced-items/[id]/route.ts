/**
 * User Enhanced Item API
 * ======================
 * Delete or update (potency/name) a single enhanced item.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { validateJson, verifyMutationRequest, enhancedItemPatchSchema } from '@/lib/api-validation';
import { apiErrorResponse } from '@/lib/api-error';
import { buildRateLimitKey, resolveClientIp, standardLimiter } from '@/lib/rate-limit';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await standardLimiter.check(
      buildRateLimitKey('enhanced-patch', {
        userId: user.uid,
        ip: resolveClientIp(request.headers),
      }),
    );
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    const validation = await validateJson(request, enhancedItemPatchSchema);
    if (!validation.success) return validation.error;
    const body = validation.data as { potency?: number | undefined; name?: string | undefined };

    const { id } = await params;
    const supabase = await createClient();
    const { data: row, error: fetchErr } = await supabase
      .from('user_enhanced_items')
      .select('data, name')
      .eq('id', id)
      .eq('user_id', user.uid)
      .maybeSingle();
    if (fetchErr) throw fetchErr;

    if (!row) {
      return NextResponse.json({ error: 'Enhanced item not found' }, { status: 404 });
    }

    const currentData = (row.data as Record<string, unknown>) ?? {};
    const updates: Record<string, unknown> = { ...currentData };
    if (body.potency !== undefined) updates.potency = body.potency;
    const name = body.name !== undefined ? body.name : (row.name as string | null);

    const now = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from('user_enhanced_items')
      .update({ data: updates, name, updated_at: now })
      .eq('id', id)
      .eq('user_id', user.uid);

    if (updateErr) {
      return apiErrorResponse(
        'Failed to update enhanced item',
        500,
        'PATCH /api/user/enhanced-items/[id] (update)',
        updateErr,
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiErrorResponse(
      'Failed to update enhanced item',
      500,
      'PATCH /api/user/enhanced-items/[id]',
      err,
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const denied = verifyMutationRequest(_request);
    if (denied) return denied;

    const { success } = await standardLimiter.check(
      buildRateLimitKey('enhanced-del', {
        userId: user.uid,
        ip: resolveClientIp(_request.headers),
      }),
    );
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    const { id } = await params;
    const supabase = await createClient();
    const { error: delErr } = await supabase
      .from('user_enhanced_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.uid);

    if (delErr) {
      return apiErrorResponse(
        'Failed to delete enhanced item',
        500,
        'DELETE /api/user/enhanced-items/[id]',
        delErr,
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiErrorResponse(
      'Failed to delete enhanced item',
      500,
      'DELETE /api/user/enhanced-items/[id]',
      err,
    );
  }
}
