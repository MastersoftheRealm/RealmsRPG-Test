/**
 * Campaign by Invite Code API
 * ===========================
 * Look up campaign by invite code (for join flow).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildRateLimitKey, inviteCodeLimiter, resolveClientIp } from '@/lib/rate-limit';

const INVITE_CODE_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/;

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
    const inviteCode = code?.trim().toUpperCase();
    if (!inviteCode || !INVITE_CODE_REGEX.test(inviteCode)) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 });
    }

    const supabase = await createClient();
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
