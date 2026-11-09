/**
 * Admin Users API
 * ===============
 * List users (id, username, username_display, display_name, role).
 * Only users with role=admin can access.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdminSession } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  buildRateLimitKey,
  resolveClientIp,
  retryAfterSecondsFromReset,
  standardLimiter,
} from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json(auth.body, { status: auth.status });
    }

    const rateKey = buildRateLimitKey('admin-users-get', {
      userId: auth.userId,
      ip: resolveClientIp(request.headers),
    });
    const rateResult = await standardLimiter.check(rateKey);
    if (!rateResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': retryAfterSecondsFromReset(rateResult.reset) } },
      );
    }

    const supabase = createServiceRoleClient();
    // Cap the result set; the admin table filters client-side. A bounded query
    // avoids unbounded PII exposure and runaway payloads (TASK-330).
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, username, username_display, display_name, role')
      .order('username')
      .limit(1000);

    if (profilesError) {
      console.error('[API Error] GET /api/admin/users query:', profilesError);
      return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
    }

    const list = (profiles ?? []) as {
      id: string;
      username: string | null;
      username_display: string | null;
      display_name: string | null;
      role: string;
    }[];
    return NextResponse.json(
      list.map((p) => ({
        id: p.id,
        username: p.username ?? '',
        usernameDisplay: p.username_display ?? p.username ?? '',
        displayName: p.display_name ?? '',
        role: p.role,
      })),
    );
  } catch (err) {
    console.error('[API Error] GET /api/admin/users:', err);
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
}
