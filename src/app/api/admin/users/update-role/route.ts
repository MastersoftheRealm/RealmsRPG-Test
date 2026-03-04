/**
 * Admin Update User Role API
 * ==========================
 * Update a user's role by username.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';

const ALLOWED_ROLES = ['new_player', 'playtester', 'developer', 'admin'] as const;

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase admin env not configured');
  }
  return createSupabaseAdminClient(url, key);
}

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
        error: 'Role must be one of: new_player, playtester, developer, admin.',
      }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
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
      .update({ role: role as 'new_player' | 'playtester' | 'developer' | 'admin' })
      .eq('id', (profile as { id: string }).id);

    return NextResponse.json({ success: true, username, role });
  } catch (err) {
    console.error('[API Error] PATCH /api/admin/users/update-role:', err);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
