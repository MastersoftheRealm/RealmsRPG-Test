/**
 * Campaign by ID API
 * ==================
 * Get a single campaign. Uses Supabase + campaign_members.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import type { Campaign } from '@/types/campaign';

type CampaignRow = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  owner_username: string | null;
  invite_code: string;
  characters: unknown;
  created_at: string | null;
  updated_at: string | null;
};

function rowToCampaign(row: CampaignRow, memberIds: string[]): Campaign {
  const characters = Array.isArray(row.characters)
    ? row.characters
    : (typeof row.characters === 'string' ? JSON.parse(row.characters as string) : []) as Campaign['characters'];
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

  const supabase = await createClient();
  const { data: row } = await supabase
    .from('campaigns')
    .select('id, name, description, owner_id, owner_username, invite_code, characters, created_at, updated_at')
    .eq('id', id.trim())
    .maybeSingle();

  if (!row) {
    return NextResponse.json(null, { status: 404 });
  }

  const { data: members } = await supabase
    .from('campaign_members')
    .select('user_id')
    .eq('campaign_id', row.id);
  const memberIds = (members ?? []).map((m: { user_id: string }) => m.user_id);

  const isMember = row.owner_id === user.uid || memberIds.includes(user.uid);
  if (!isMember) {
    return NextResponse.json(null, { status: 404 });
  }

  const campaign = rowToCampaign(row as CampaignRow, memberIds);
  return NextResponse.json(campaign);
}
