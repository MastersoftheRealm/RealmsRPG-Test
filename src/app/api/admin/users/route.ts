/**
 * Admin Users API
 * ===============
 * List users (id, username, role only).
 * Only users with role=admin can access.
 */

import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase admin env not configured');
  }
  return createSupabaseAdminClient(url, key);
}

export async function GET() {
  try {
    const { user } = await getSession();
    if (!user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = await isAdmin(user.uid);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, username, role')
      .order('username');

    const list = (profiles ?? []) as { id: string; username: string | null; role: string }[];
    return NextResponse.json(
      list.map((p) => ({
        id: p.id,
        username: p.username ?? '',
        role: p.role,
      }))
    );
  } catch (err) {
    console.error('[API Error] GET /api/admin/users:', err);
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
}
