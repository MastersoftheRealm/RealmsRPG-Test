/**
 * Admin Update User Role API
 * ==========================
 * Update a user's role by username. Allowed roles: new_player, playtester, developer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';

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

    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .ilike('username', username)
      .maybeSingle();
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await supabase
      .from('user_profiles')
      .update({ role: role as 'new_player' | 'playtester' | 'developer' })
      .eq('id', (profile as { id: string }).id);

    return NextResponse.json({ success: true, username, role });
  } catch (err) {
    console.error('[API Error] PATCH /api/admin/users/update-role:', err);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
