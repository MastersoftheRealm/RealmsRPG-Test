/**
 * Campaign Rolls API
 * ==================
 * List and add campaign rolls. Uses Prisma. Requires Supabase session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/supabase/session';
import { MAX_CAMPAIGN_ROLLS } from '@/app/(main)/campaigns/constants';
import type { CampaignRollEntry } from '@/types/campaign-roll';

function toEntry(row: { id: string; data: unknown; createdAt: Date | null }): CampaignRollEntry {
  const d = row.data as Record<string, unknown>;
  const ts = d.timestamp;
  return {
    id: row.id,
    characterId: d.characterId as string,
    characterName: d.characterName as string,
    userId: d.userId as string,
    type: d.type as CampaignRollEntry['type'],
    title: d.title as string,
    dice: (d.dice as CampaignRollEntry['dice']) || [],
    modifier: (d.modifier as number) ?? 0,
    total: (d.total as number) ?? 0,
    isCrit: d.isCrit as boolean | undefined,
    isCritFail: d.isCritFail as boolean | undefined,
    critMessage: d.critMessage as string | undefined,
    timestamp:
      ts instanceof Date
        ? ts
        : typeof ts === 'string'
          ? new Date(ts)
          : (ts as { seconds?: number })?.seconds
            ? new Date((ts as { seconds: number }).seconds * 1000)
            : new Date(),
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

  const { id: campaignId } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  const memberIds = (campaign.memberIds as string[]) || [];
  const isMember = campaign.ownerId === user.uid || memberIds.includes(user.uid);
  if (!isMember) {
    return NextResponse.json({ error: 'Not a campaign member' }, { status: 403 });
  }

  const rows = await prisma.campaignRoll.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' },
    take: MAX_CAMPAIGN_ROLLS,
  });

  const rolls = rows.map(toEntry);
  return NextResponse.json(rolls);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getSession();
  if (error || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: campaignId } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  const memberIds = (campaign.memberIds as string[]) || [];
  const isMember = campaign.ownerId === user.uid || memberIds.includes(user.uid);
  if (!isMember) {
    return NextResponse.json({ error: 'Not a campaign member' }, { status: 403 });
  }

  const body = await request.json();
  const { characterId, characterName, roll } = body;

  if (!characterId || !characterName || !roll) {
    return NextResponse.json({ error: 'characterId, characterName, and roll required' }, { status: 400 });
  }

  const rollData = {
    characterId,
    characterName,
    userId: user.uid,
    type: roll.type,
    title: roll.title,
    dice: roll.dice ?? [],
    modifier: roll.modifier ?? 0,
    total: roll.total ?? 0,
    isCrit: roll.isCrit ?? false,
    isCritFail: roll.isCritFail ?? false,
    critMessage: roll.critMessage ?? null,
    timestamp: new Date().toISOString(),
  };

  await prisma.campaignRoll.create({
    data: {
      campaignId,
      data: rollData as object,
    },
  });

  const count = await prisma.campaignRoll.count({
    where: { campaignId },
  });

  if (count > MAX_CAMPAIGN_ROLLS) {
    const toDelete = await prisma.campaignRoll.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'asc' },
      take: count - MAX_CAMPAIGN_ROLLS,
      select: { id: true },
    });
    await prisma.campaignRoll.deleteMany({
      where: { id: { in: toDelete.map((r) => r.id) } },
    });
  }

  return NextResponse.json({ success: true });
}
