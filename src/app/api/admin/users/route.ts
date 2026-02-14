/**
 * Admin Users API
 * ===============
 * List users (id, username, role only — never email/displayName).
 * Only admins (ADMIN_UIDS env) can access.
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

    return NextResponse.json(
      profiles.map((p) => ({
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
