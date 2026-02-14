/**
 * Admin Users API
 * ===============
 * List users (id, username, role only — never email/displayName).
 * Only admins (ADMIN_UIDS env) can access.
 * Users in ADMIN_UIDS are shown as role 'admin' (set via env, cannot be altered).
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

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

    const profiles = await prisma.userProfile.findMany({
      select: { id: true, username: true, role: true },
      orderBy: { username: 'asc' },
    });

    const adminUidCheck = await Promise.all(
      profiles.map(async (p) => ({ ...p, isAdminUid: await isAdmin(p.id) }))
    );
    return NextResponse.json(
      adminUidCheck.map(({ isAdminUid, ...p }) => ({
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
