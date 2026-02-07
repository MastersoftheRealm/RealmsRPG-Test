/**
 * Campaign Roll Service
 * ======================
 * Client-side API calls for campaign roll logs. Uses /api/campaigns/[id]/rolls (Prisma).
 */

import type { CampaignRollEntry } from '@/types/campaign-roll';
import type { RollEntry } from '@/components/character-sheet/roll-context';

export interface AddCampaignRollParams {
  campaignId: string;
  characterId: string;
  characterName: string;
  roll: RollEntry;
}

/**
 * Add a roll to the campaign log.
 */
export async function addCampaignRoll({
  campaignId,
  characterId,
  characterName,
  roll,
}: AddCampaignRollParams): Promise<void> {
  const res = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/rolls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      characterId,
      characterName,
      roll,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Failed to add roll');
  }
}

/**
 * Get campaign rolls (for polling).
 */
export async function getCampaignRolls(campaignId: string): Promise<CampaignRollEntry[]> {
  const res = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/rolls`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Failed to fetch rolls');
  }
  return res.json();
}
