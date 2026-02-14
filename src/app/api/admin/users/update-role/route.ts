/**
 * Admin Update User Role API
 * ==========================
 * Update a user's role by username. Allowed roles: new_player, playtester, developer.
 * Admin role can only be set via env ADMIN_UIDS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES = ['new_player', 'playtester', 'developer'] as const;

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await getSession();
    if (!user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = await isAdmin(user.uid);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const role = body.role as string;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }
    if (!role || !ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
      return NextResponse.json({
        error: 'Role must be one of: new_player, playtester, developer. Admin can only be set via environment.',
      }, { status: 400 });
    }

    const profile = await prisma.userProfile.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
    });
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.userProfile.update({
      where: { id: profile.id },
      data: { role: role as 'new_player' | 'playtester' | 'developer' },
    });

    return NextResponse.json({ success: true, username, role });
  } catch (err) {
    console.error('[API Error] PATCH /api/admin/users/update-role:', err);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
