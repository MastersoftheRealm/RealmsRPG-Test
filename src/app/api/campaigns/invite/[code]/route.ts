/**
 * Campaign by Invite Code API
 * ===========================
 * Look up campaign by invite code (for join flow).
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
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
}
