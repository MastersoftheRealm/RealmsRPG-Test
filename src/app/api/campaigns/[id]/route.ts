/**
 * Campaign by ID API
 * ==================
 * Get a single campaign. Uses Prisma. Requires Supabase session.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/supabase/session';
import type { Campaign } from '@/types/campaign';

function rowToCampaign(row: { id: string; owner_id: string; name: string; description: string | null; invite_code: string; characters: unknown; member_ids: unknown; owner_username: string | null; created_at: Date | null; updated_at: Date | null }): Campaign {
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
  });

  if (!row) {
    return NextResponse.json(null, { status: 404 });
  }

  const memberIds = (row.memberIds as string[]) || [];
  if (row.ownerId !== user.uid && !memberIds.includes(user.uid)) {
    return NextResponse.json(null, { status: 404 });
  }

  const campaign = rowToCampaign({
    id: row.id,
    owner_id: row.ownerId,
    name: row.name,
    description: row.description,
    invite_code: row.inviteCode,
    characters: row.characters,
    member_ids: row.memberIds,
    owner_username: row.ownerUsername,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  });

  return NextResponse.json(campaign);
}
