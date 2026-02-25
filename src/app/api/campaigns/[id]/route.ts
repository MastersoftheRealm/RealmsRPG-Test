/**
 * Campaign by ID API
 * ==================
 * Get a single campaign. Uses Prisma + campaign_members. Requires Supabase session.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/supabase/session';
import type { Campaign } from '@/types/campaign';

function rowToCampaign(row: {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  ownerUsername: string | null;
  inviteCode: string;
  characters: unknown;
  members: { userId: string }[];
  createdAt: Date | null;
  updatedAt: Date | null;
}): Campaign {
  const memberIds = row.members?.map((m) => m.userId) ?? [];
  const characters = Array.isArray(row.characters) ? row.characters : (typeof row.characters === 'string' ? JSON.parse(row.characters as string) : []) as Campaign['characters'];
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    ownerId: row.ownerId,
    ownerUsername: row.ownerUsername ?? undefined,
    inviteCode: row.inviteCode,
    characters,
    memberIds,
    createdAt: row.createdAt ?? undefined,
    updatedAt: row.updatedAt ?? undefined,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getSession();
  if (error || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
  }

  const row = await prisma.campaign.findUnique({
    where: { id: id.trim() },
    include: { members: { select: { userId: true } } },
  });

  if (!row) {
    return NextResponse.json(null, { status: 404 });
  }

  const isMember = row.ownerId === user.uid || row.members?.some((m) => m.userId === user.uid);
  if (!isMember) {
    return NextResponse.json(null, { status: 404 });
  }

  const campaign = rowToCampaign({
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.ownerId,
    ownerUsername: row.ownerUsername,
    inviteCode: row.inviteCode,
    characters: row.characters,
    members: row.members,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });

  return NextResponse.json(campaign);
}
