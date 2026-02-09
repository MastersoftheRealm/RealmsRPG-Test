/**
 * useCampaignRolls Hook
 * =====================
 * Fetches campaign roll log and subscribes to Supabase Realtime for live updates.
 * Replaces polling with postgres_changes on campaigns.campaign_rolls.
 */

'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { getCampaignRolls } from '@/services/campaign-roll-service';
import type { CampaignRollEntry } from '@/types/campaign-roll';

export function useCampaignRolls(campaignId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: rolls = [], isLoading } = useQuery<CampaignRollEntry[]>({
    queryKey: ['campaign-rolls', campaignId],
    queryFn: () => getCampaignRolls(campaignId!),
    enabled: !!campaignId,
    refetchInterval: false,
  });

  useEffect(() => {
    if (!campaignId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`campaign-rolls:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'campaigns',
          table: 'campaign_rolls',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['campaign-rolls', campaignId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, queryClient]);

  return { rolls, loading: isLoading };
}
