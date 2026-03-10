/**
 * User Enhanced Item API
 * ======================
 * Delete or update (potency/name) a single enhanced item.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { validateJson, enhancedItemPatchSchema } from '@/lib/api-validation';
import { standardLimiter } from '@/lib/rate-limit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = standardLimiter.check(`enhanced-patch:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await validateJson(request, enhancedItemPatchSchema);
    if (!validation.success) return validation.error;
    const body = validation.data as { potency?: number; name?: string };

    const { id } = await params;
    const supabase = await createClient();
    const { data: row, error: fetchErr } = await supabase
      .from('user_enhanced_items')
      .select('data, name')
      .eq('id', id)
      .eq('user_id', user.uid)
      .single();

    if (fetchErr || !row) {
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
      console.error('[API Error] PATCH /api/user/enhanced-items/[id]:', updateErr.message);
      return NextResponse.json({ error: 'Failed to update enhanced item' }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[API Error] PATCH /api/user/enhanced-items/[id]:', err);
    return NextResponse.json({ error: 'Failed to update enhanced item' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = (_request as unknown as NextRequest).headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = standardLimiter.check(`enhanced-del:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();
    const { error: delErr } = await supabase
      .from('user_enhanced_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.uid);

    if (delErr) {
      console.error('[API Error] DELETE /api/user/enhanced-items/[id]:', delErr.message);
      return NextResponse.json({ error: 'Failed to delete enhanced item' }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[API Error] DELETE /api/user/enhanced-items/[id]:', err);
    return NextResponse.json({ error: 'Failed to delete enhanced item' }, { status: 500 });
  }
}
