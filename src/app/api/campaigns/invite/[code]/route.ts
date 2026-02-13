/**
 * Campaign by Invite Code API
 * ===========================
 * Look up campaign by invite code (for join flow).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inviteCodeLimiter } from '@/lib/rate-limit';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const ip = (_request as unknown as NextRequest).headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = inviteCodeLimiter.check(`invite:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { code } = await params;
    const inviteCode = code?.trim().toUpperCase();
    if (!inviteCode || inviteCode.length < 4) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 });
    }

    const row = await prisma.campaign.findFirst({
      where: { inviteCode },
      select: { id: true, name: true },
    });

    if (!row) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json({ id: row.id, name: row.name || 'Campaign' });
  } catch (err) {
    console.error('[API Error] GET /api/campaigns/invite/[code]:', err);
    return NextResponse.json({ error: 'Failed to look up invite code' }, { status: 500 });
  }
}
