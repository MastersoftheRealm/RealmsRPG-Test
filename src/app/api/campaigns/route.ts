/**
 * Campaigns API
 * =============
 * List campaigns for current user. Uses Prisma + campaign_members. Requires Supabase session.
 * ?full=true returns full Campaign objects (with characters); otherwise returns summaries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/supabase/session';
import type { Campaign, CampaignSummary } from '@/types/campaign';

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

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.uid;
    const full = request.nextUrl.searchParams.get('full') === 'true';

    const rows = await prisma.campaign.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: { members: { select: { userId: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    const campaigns: Campaign[] = rows.map(rowToCampaign);

    if (full) {
      return NextResponse.json(campaigns);
    }

    const summaries: CampaignSummary[] = campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      ownerId: c.ownerId,
      ownerUsername: c.ownerUsername,
      characterCount: c.characters?.length ?? 0,
      isOwner: c.ownerId === userId,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json(summaries);
  } catch (err) {
    console.error('[API Error] GET /api/campaigns:', err);
    return NextResponse.json({ error: 'Failed to load campaigns' }, { status: 500 });
  }
}
