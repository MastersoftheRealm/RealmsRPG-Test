/**
 * useCampaigns Hook
 * ==================
 * React Query hooks for campaign data
 */

'use client';

import { useQueries, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  getMyCampaigns,
  getMyCampaignsFull,
  getCampaign,
  getCampaignByInviteCode,
  getCampaignCharacterForView,
  getCampaignCharacterForEncounter,
} from '@/services/campaign-service';
import { logClientError } from '@/lib/api-client';
import { normalizeInviteCodeInput, isValidInviteCodeFormat } from '@/lib/campaign-invite';
import { useAuthStore } from '@/stores/auth-store';
import type { CampaignCharacterEncounterData } from '@/types/campaign';
import { characterViewerId } from './use-characters';

export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: () => [...campaignKeys.lists()] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
  inviteCode: (code: string) => [...campaignKeys.all, 'invite', code] as const,
  /**
   * Realm Master read-only character view. Campaign-scoped (access depends on the
   * roster + RM authorization, not on `characterKeys`) and viewer-segmented like
   * `characterKeys.detail` so a cached sheet cannot survive a viewer change.
   */
  characterViews: (campaignId: string) =>
    [...campaignKeys.detail(campaignId), 'character-view'] as const,
  characterView: (
    campaignId: string,
    viewerId: string | undefined,
    ownerId: string,
    characterId: string,
  ) =>
    [
      ...campaignKeys.characterViews(campaignId),
      characterViewerId(viewerId),
      ownerId,
      characterId,
    ] as const,
  /**
   * Minimal `?scope=encounter` payload (HP/EN/AP). Distinct from `characterView`
   * (full RM GET + libraryForView). Campaign-scoped and viewer-segmented; not keyed
   * by encounter id so Add Combatant and combat HP sync share one cache entry.
   */
  characterEncounters: (campaignId: string) =>
    [...campaignKeys.detail(campaignId), 'character-encounter'] as const,
  characterEncounter: (
    campaignId: string,
    viewerId: string | undefined,
    ownerId: string,
    characterId: string,
  ) =>
    [
      ...campaignKeys.characterEncounters(campaignId),
      characterViewerId(viewerId),
      ownerId,
      characterId,
    ] as const,
};

type CampaignCharacterEncounterTarget = {
  ownerId: string;
  characterId: string;
};

function campaignCharacterEncounterQueryOptions(
  campaignId: string,
  viewerId: string | undefined,
  ownerId: string,
  characterId: string,
) {
  return {
    queryKey: campaignKeys.characterEncounter(campaignId, viewerId, ownerId, characterId),
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      try {
        return await getCampaignCharacterForEncounter(campaignId, ownerId, characterId, {
          signal,
        });
      } catch (err) {
        if (signal.aborted) throw err;
        logClientError(
          `campaign-character-encounter: fetch failed (${ownerId}/${characterId})`,
          err,
        );
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  };
}

/** Imperative `?scope=encounter` read through the same Query options as combat sync. */
export function fetchCampaignCharacterForEncounter(
  queryClient: QueryClient,
  campaignId: string,
  viewerId: string | undefined,
  ownerId: string,
  characterId: string,
): Promise<CampaignCharacterEncounterData | null> {
  return queryClient.fetchQuery(
    campaignCharacterEncounterQueryOptions(campaignId, viewerId, ownerId, characterId),
  );
}

/**
 * Observed `?scope=encounter` reads. Unmount cancels in-flight requests.
 * Do not reuse `useCampaignCharacterView` — that is the full RM-view GET.
 */
export function useCampaignCharacterEncounters(
  campaignId: string | undefined,
  targets: CampaignCharacterEncounterTarget[],
) {
  const { user, loading: authLoading } = useAuthStore();
  return useQueries({
    queries: targets.map(({ ownerId, characterId }) => ({
      ...campaignCharacterEncounterQueryOptions(campaignId || '', user?.uid, ownerId, characterId),
      enabled: !!campaignId && !!ownerId && !!characterId && !authLoading,
    })),
  });
}

export function useCampaigns() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: campaignKeys.list(),
    queryFn: getMyCampaigns,
    enabled: !!user,
  });
}

export function useCampaignsFull() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: [...campaignKeys.lists(), 'full'] as const,
    queryFn: getMyCampaignsFull,
    enabled: !!user,
  });
}

export function useCampaign(campaignId: string | undefined) {
  return useQuery({
    queryKey: campaignKeys.detail(campaignId || ''),
    queryFn: () => getCampaign(campaignId!),
    enabled: !!campaignId,
  });
}

/**
 * Read-only roster character for the RM view page.
 * Data is `GetCharacterResult` (character + optional `libraryForView` / `enrichment`).
 */
export function useCampaignCharacterView(
  campaignId: string | undefined,
  ownerId: string | undefined,
  characterId: string | undefined,
) {
  const { user, loading: authLoading } = useAuthStore();
  return useQuery({
    queryKey: campaignKeys.characterView(
      campaignId || '',
      user?.uid,
      ownerId || '',
      characterId || '',
    ),
    queryFn: () => getCampaignCharacterForView(campaignId!, ownerId!, characterId!),
    enabled: !!campaignId && !!ownerId && !!characterId && !authLoading,
  });
}

export function useCampaignByInviteCode(inviteCode: string | undefined) {
  const normalized = inviteCode ? normalizeInviteCodeInput(inviteCode) : '';
  return useQuery({
    queryKey: campaignKeys.inviteCode(normalized),
    queryFn: () => getCampaignByInviteCode(inviteCode!),
    enabled: !!normalized && isValidInviteCodeFormat(normalized),
  });
}

export function useInvalidateCampaigns() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: campaignKeys.all });
  };
}
