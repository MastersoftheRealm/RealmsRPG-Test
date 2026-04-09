import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/session';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('show_tooltips, role')
      .eq('id', user.uid)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const profile = (data as { show_tooltips?: boolean | null; role?: string | null } | null) ?? null;
    return NextResponse.json({
      showTooltips: profile?.show_tooltips ?? true,
      role: profile?.role ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const showTooltips = Boolean(body.showTooltips);

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from('user_profiles')
      .update({ show_tooltips: showTooltips })
      .eq('id', user.uid);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, showTooltips });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update tooltip preference';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
