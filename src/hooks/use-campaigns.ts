/**
 * useCampaigns Hook
 * ==================
 * React Query hooks for campaign data
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyCampaigns, getMyCampaignsFull, getCampaign, getCampaignByInviteCode } from '@/services/campaign-service';
import type { Campaign, CampaignSummary } from '@/types/campaign';

export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: () => [...campaignKeys.lists()] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
  inviteCode: (code: string) => [...campaignKeys.all, 'invite', code] as const,
};

export function useCampaigns() {
  return useQuery({
    queryKey: campaignKeys.list(),
    queryFn: getMyCampaigns,
  });
}

export function useCampaignsFull() {
  return useQuery({
    queryKey: [...campaignKeys.lists(), 'full'] as const,
    queryFn: getMyCampaignsFull,
  });
}

export function useCampaign(campaignId: string | undefined) {
  return useQuery({
    queryKey: campaignKeys.detail(campaignId || ''),
    queryFn: () => getCampaign(campaignId!),
    enabled: !!campaignId,
  });
}

export function useCampaignByInviteCode(inviteCode: string | undefined) {
  return useQuery({
    queryKey: campaignKeys.inviteCode(inviteCode || ''),
    queryFn: () => getCampaignByInviteCode(inviteCode!),
    enabled: !!inviteCode && inviteCode.length >= 4,
  });
}

export function useInvalidateCampaigns() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: campaignKeys.all });
  };
}
