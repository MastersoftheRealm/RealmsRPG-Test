/**
 * Campaigns API
 * =============
 * List campaigns for current user. Uses Prisma. Requires Supabase session.
 * ?full=true returns full Campaign objects (with characters); otherwise returns summaries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getSession } from '@/lib/supabase/session';
import type { Campaign, CampaignSummary } from '@/types/campaign';

type CampaignRow = { id: string; owner_id: string; name: string; description: string | null; invite_code: string; characters: unknown; member_ids: unknown; owner_username: string | null; created_at: Date | null; updated_at: Date | null };

function rowToCampaign(row: CampaignRow): Campaign {
  const memberIds = Array.isArray(row.member_ids) ? row.member_ids : (typeof row.member_ids === 'string' ? JSON.parse(row.member_ids) : []) as string[];
  const characters = Array.isArray(row.characters) ? row.characters : (typeof row.characters === 'string' ? JSON.parse(row.characters) : []) as Campaign['characters'];
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    ownerId: row.owner_id,
    ownerUsername: row.owner_username ?? undefined,
    inviteCode: row.invite_code,
    characters,
    memberIds,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

export async function GET(request: NextRequest) {
  const { user, error } = await getSession();
  if (error || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.uid;
  const full = request.nextUrl.searchParams.get('full') === 'true';

  const rows = await prisma.$queryRaw<CampaignRow[]>(Prisma.sql`
    SELECT id, owner_id, name, description, invite_code, characters, member_ids, owner_username, created_at, updated_at
    FROM campaigns
    WHERE owner_id = ${userId}
    OR member_ids::jsonb @> jsonb_build_array(${userId})
    ORDER BY updated_at DESC NULLS LAST
  `);

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
}
