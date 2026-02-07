/**
 * useCampaignRolls Hook
 * =====================
 * Polls campaign roll log via API. Refetches every 5 seconds when campaign is active.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { getCampaignRolls } from '@/services/campaign-roll-service';
import type { CampaignRollEntry } from '@/types/campaign-roll';

const POLL_INTERVAL_MS = 5000;

export function useCampaignRolls(campaignId: string | undefined) {
  const { data: rolls = [], isLoading } = useQuery<CampaignRollEntry[]>({
    queryKey: ['campaign-rolls', campaignId],
    queryFn: () => getCampaignRolls(campaignId!),
    enabled: !!campaignId,
    refetchInterval: campaignId ? POLL_INTERVAL_MS : false,
  });

  return { rolls, loading: isLoading };
}
