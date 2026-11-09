/**
 * Admin Users API
 * ===============
 * List users (id, username, username_display, display_name, role).
 * Only users with role=admin can access.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdminSession } from '@/lib/admin';
import { adminUsersQuerySchema, parseAdminUsersPaging, validateQuery } from '@/lib/api-validation';
import { buildAdminUsersOrFilter } from '@/lib/admin-users-search';
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

    const queryResult = validateQuery(request, adminUsersQuerySchema);
    if (!queryResult.success) return queryResult.error;
    const { limit, offset } = parseAdminUsersPaging(queryResult.data);
    const search = queryResult.data.q?.trim();

    const supabase = createServiceRoleClient();
    let query = supabase
      .from('user_profiles')
      .select('id, username, username_display, display_name, role')
      .order('username', { nullsFirst: false })
      .order('id');
    if (search) {
      query = query.or(buildAdminUsersOrFilter(search));
    }
    const { data: profiles, error: profilesError } = await query.range(offset, offset + limit - 1);

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
    const users = list.map((p) => ({
      id: p.id,
      username: p.username ?? '',
      usernameDisplay: p.username_display ?? p.username ?? '',
      displayName: p.display_name ?? '',
      role: p.role,
    }));
    return NextResponse.json({
      users,
      offset,
      limit,
      hasMore: users.length === limit,
    });
  } catch (err) {
    console.error('[API Error] GET /api/admin/users:', err);
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
}
