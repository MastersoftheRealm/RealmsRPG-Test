/**
 * Admin Update User Role API
 * ==========================
 * Update a user's role by user ID (or username fallback).
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
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const role = body.role as string;

    if (!userId && !username) {
      return NextResponse.json({ error: 'User ID or username is required' }, { status: 400 });
    }
    if (!role || !ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
      return NextResponse.json({
        error: 'Role must be one of: new_player, playtester, developer, admin.',
      }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const profileQuery = supabase.from('user_profiles').select('id, role').limit(1);
    const { data: profile } = userId
      ? await profileQuery.eq('id', userId).maybeSingle()
      : await profileQuery.ilike('username', username.toLowerCase()).maybeSingle();
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetId = (profile as { id: string }).id;
    const oldRole = (profile as { role: string }).role;

    // No-op: nothing to change.
    if (oldRole === role) {
      return NextResponse.json({ success: true, userId: targetId, role });
    }

    // Last-admin guard: never demote the only remaining admin (prevents locking
    // everyone out of the admin surface).
    if (oldRole === 'admin' && role !== 'admin') {
      const { count, error: countError } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin');
      if (countError) {
        console.error('[API Error] update-role admin count:', countError);
        return NextResponse.json({ error: 'Failed to verify admin count' }, { status: 500 });
      }
      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last admin. Promote another admin first.' },
          { status: 409 }
        );
      }
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ role: role as 'new_player' | 'playtester' | 'developer' | 'admin' })
      .eq('id', targetId);
    if (updateError) {
      console.error('[API Error] update-role update:', updateError);
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }

    // Append-only audit trail (best-effort; never blocks the role change).
    const { error: auditError } = await supabase.from('admin_role_audit').insert({
      actor_id: user.uid,
      target_id: targetId,
      old_role: oldRole,
      new_role: role,
    });
    if (auditError) {
      console.error('[API Error] update-role audit insert:', auditError);
    }

    return NextResponse.json({ success: true, userId: targetId, role });
  } catch (err) {
    console.error('[API Error] PATCH /api/admin/users/update-role:', err);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
