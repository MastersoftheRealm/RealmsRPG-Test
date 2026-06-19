/**
 * Campaign Roll Service
 * ======================
 * Client-side API calls for campaign roll logs. Uses /api/campaigns/[id]/rolls (Supabase).
 */

import type { CampaignRollEntry } from '@/types/campaign-roll';
import type { RollEntry } from '@/components/character-sheet/roll-context';
import { apiFetch } from '@/lib/api-client';

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
  await apiFetch(`/api/campaigns/${encodeURIComponent(campaignId)}/rolls`, {
    method: 'POST',
    credentials: 'same-origin',
    body: JSON.stringify({
      characterId,
      characterName,
      roll,
    }),
  });
}

/**
 * Get campaign rolls (for polling).
 */
export async function getCampaignRolls(campaignId: string): Promise<CampaignRollEntry[]> {
  return apiFetch<CampaignRollEntry[]>(
    `/api/campaigns/${encodeURIComponent(campaignId)}/rolls`,
    { credentials: 'same-origin' }
  );
}
