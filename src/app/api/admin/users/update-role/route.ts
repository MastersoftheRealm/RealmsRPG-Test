/**
 * Admin Update User Role API
 * ==========================
 * Update a user's role by user ID (or username fallback).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { requireAdminSession } from '@/lib/admin';
import { adminUpdateRoleSchema, validateJson } from '@/lib/api-validation';
import {
  strictLimiter,
  buildRateLimitKey,
  resolveClientIp,
  retryAfterSecondsFromReset,
} from '@/lib/rate-limit';

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
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json(auth.body, { status: auth.status });
    }

    // SEC-05: limit sensitive role mutations per admin/IP.
    const rateResult = await strictLimiter.check(
      buildRateLimitKey('admin-update-role', {
        userId: auth.userId,
        ip: resolveClientIp(request.headers),
      }),
    );
    if (!rateResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': retryAfterSecondsFromReset(rateResult.reset) } },
      );
    }

    const validation = await validateJson(request, adminUpdateRoleSchema);
    if (!validation.success) return validation.error;

    const { userId, username, role } = validation.data;

    const supabase = getSupabaseAdmin();
    const profileQuery = supabase.from('user_profiles').select('id, role').limit(1);
    const { data: profile, error: profileError } = userId
      ? await profileQuery.eq('id', userId).maybeSingle()
      : // eq, not ilike: `_` and `%` are legal username characters but ilike wildcards,
        // so a pasted name could match a different account and promote it instead.
        // Usernames are stored canonically lowercased.
        await profileQuery.eq('username', (username ?? '').toLowerCase()).maybeSingle();
    if (profileError) {
      console.error('[API Error] update-role profile lookup:', profileError);
      return NextResponse.json({ error: 'Failed to look up user' }, { status: 500 });
    }
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
          { status: 409 },
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
      actor_id: auth.userId,
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
