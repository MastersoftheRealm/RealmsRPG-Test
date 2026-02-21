/**
 * useCampaignRolls Hook
 * =====================
 * Fetches campaign roll log and subscribes to Supabase Realtime for live updates.
 * Uses refetchQueries on postgres_changes so roll log updates immediately in all
 * locations (campaign tab, character sheet RollLog, encounter RollLog).
 */

'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { getCampaignRolls } from '@/services/campaign-roll-service';
import type { CampaignRollEntry } from '@/types/campaign-roll';

export function useCampaignRolls(campaignId: string | undefined) {
  const queryClient = useQueryClient();
  const stableId = campaignId != null ? String(campaignId) : undefined;

  const { data: rolls = [], isLoading } = useQuery<CampaignRollEntry[]>({
    queryKey: ['campaign-rolls', stableId],
    queryFn: () => getCampaignRolls(stableId!),
    enabled: !!stableId,
    refetchInterval: false,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!stableId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`campaign-rolls:${stableId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'campaigns',
          table: 'campaign_rolls',
          filter: `campaign_id=eq.${stableId}`,
        },
        () => {
          // Refetch immediately so roll log updates in realtime everywhere (campaign page, character sheet, encounter)
          queryClient.refetchQueries({ queryKey: ['campaign-rolls', stableId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stableId, queryClient]);

  return { rolls, loading: isLoading };
}
