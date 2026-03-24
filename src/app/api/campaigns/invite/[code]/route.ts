/**
 * Campaign by Invite Code API
 * ===========================
 * Look up campaign by invite code (for join flow).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { normalizeInviteCodeInput, isValidInviteCodeFormat } from '@/lib/campaign-invite';
import { buildRateLimitKey, inviteCodeLimiter, resolveClientIp } from '@/lib/rate-limit';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const ip = resolveClientIp((_request as unknown as NextRequest).headers);
    const key = buildRateLimitKey('invite', { ip });
    const { success } = inviteCodeLimiter.check(key);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { code } = await params;
    const inviteCode = normalizeInviteCodeInput(code ?? '');
    if (!isValidInviteCodeFormat(inviteCode)) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 });
    }

    /** RLS blocks non-members from reading campaigns; invite preview must use service role (rate-limited). */
    let supabase;
    try {
      supabase = createServiceRoleClient();
    } catch {
      return NextResponse.json({ error: 'Invite lookup unavailable' }, { status: 503 });
    }

    const { data: row } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('invite_code', inviteCode)
      .maybeSingle();

    if (!row) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json({ id: row.id, name: row.name || 'Campaign' });
  } catch (err) {
    console.error('[API Error] GET /api/campaigns/invite/[code]:', err);
    return NextResponse.json({ error: 'Failed to look up invite code' }, { status: 500 });
  }
}
