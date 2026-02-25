/**
 * Admin Users API
 * ===============
 * List users (id, username, role only).
 * Only admins (ADMIN_UIDS env) can access.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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

    const supabase = await createClient();
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, username, role')
      .order('username');

    const list = (profiles ?? []) as { id: string; username: string | null; role: string }[];
    const withAdmin = await Promise.all(
      list.map(async (p) => ({ ...p, isAdminUid: await isAdmin(p.id) }))
    );
    return NextResponse.json(
      withAdmin.map(({ isAdminUid, ...p }) => ({
        id: p.id,
        username: p.username ?? '',
        role: isAdminUid ? ('admin' as const) : p.role,
      }))
    );
  } catch (err) {
    console.error('[API Error] GET /api/admin/users:', err);
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
}
