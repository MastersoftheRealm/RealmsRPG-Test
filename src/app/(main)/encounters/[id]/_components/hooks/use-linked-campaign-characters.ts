'use client';

import { useMemo } from 'react';
import type { Campaign } from '@/types/campaign';
import { getCampaignCharacterIds } from '@/lib/encounter/unique-campaign-characters';

/**
 * Linked campaign + characters not yet on the encounter roster (combat or skill).
 * Colocated under play `_components` — only used by encounter play roster hooks.
 */
export function useLinkedCampaignCharacters({
  campaignId,
  campaignsFull,
  rosterEntries,
}: {
  campaignId?: string | undefined;
  campaignsFull: Campaign[];
  rosterEntries: readonly unknown[] | undefined;
}) {
  const linkedCampaign = campaignId
    ? campaignsFull.find((c: Campaign) => c.id === campaignId)
    : undefined;

  const existingCampaignCharacterIds = useMemo(
    () => getCampaignCharacterIds(rosterEntries),
    [rosterEntries],
  );

  const availableCampaignCharacters = useMemo(
    () =>
      (linkedCampaign?.characters ?? []).filter(
        (c) => !existingCampaignCharacterIds.has(c.characterId),
      ),
    [existingCampaignCharacterIds, linkedCampaign?.characters],
  );

  return {
    linkedCampaign,
    existingCampaignCharacterIds,
    availableCampaignCharacters,
    availableCampaignCharacterCount: availableCampaignCharacters.length,
  };
}
