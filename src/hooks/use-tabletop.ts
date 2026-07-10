'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { normalizeGridConfig } from '@/lib/tabletop/grid';
import { filterActionsForRole, filterTokensForRole } from '@/lib/tabletop/visibility';
import {
  createTabletopAction,
  getActiveCampaignTabletop,
  getTabletopScene,
  resolveTabletopAction,
  syncTabletopCombatants,
  updateTabletopScene,
  updateTabletopToken,
  uploadVttMap,
} from '@/services/tabletop-service';
import type {
  VttAction,
  VttActionStatus,
  VttActionType,
  VttFogState,
  VttMapAsset,
  VttScene,
  VttSceneSettings,
  VttTabletopState,
  VttToken,
} from '@/types/tabletop';

type RealtimeRow = Record<string, unknown>;
type TabletopRealtimePayload = RealtimePostgresChangesPayload<RealtimeRow>;

const DEFAULT_SCENE_SETTINGS: VttSceneSettings = { showEnemyResources: false };
const DEFAULT_FOG: VttFogState = { enabled: false, regions: [] };

function isRecord(value: unknown): value is RealtimeRow {
  return typeof value === 'object' && value !== null;
}

function stringFrom(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : value == null ? fallback : String(value);
}

function optionalStringFrom(value: unknown): string | undefined {
  const next = stringFrom(value);
  return next || undefined;
}

function numberFrom(value: unknown, fallback: number): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function booleanFrom(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function objectFrom<T extends object>(value: unknown, fallback: T): T {
  return isRecord(value) ? ({ ...fallback, ...value } as T) : fallback;
}

function mapFromRealtimeRow(value: unknown, previous?: VttMapAsset): VttMapAsset | undefined {
  if (value === undefined) return previous;
  if (!isRecord(value)) return undefined;
  const storagePath = optionalStringFrom(value.storagePath);
  if (!storagePath) return undefined;
  return {
    storagePath,
    signedUrl: previous?.storagePath === storagePath ? previous.signedUrl : undefined,
    width: numberFrom(value.width, previous?.width ?? 1200),
    height: numberFrom(value.height, previous?.height ?? 800),
    fileName: optionalStringFrom(value.fileName),
    contentType: optionalStringFrom(value.contentType),
    uploadedAt: optionalStringFrom(value.uploadedAt),
  };
}

function sceneFromRealtimeRow(row: RealtimeRow, previous?: VttScene): VttScene | null {
  const id = optionalStringFrom(row.id);
  const campaignId = optionalStringFrom(row.campaign_id);
  if (!id || !campaignId) return null;

  const settings = objectFrom<VttSceneSettings>(row.settings, previous?.settings ?? DEFAULT_SCENE_SETTINGS);
  const fog = objectFrom<VttFogState>(row.fog, previous?.fog ?? DEFAULT_FOG);

  return {
    id,
    campaignId,
    encounterId: optionalStringFrom(row.encounter_id),
    name: stringFrom(row.name, previous?.name ?? 'Tabletop Scene'),
    isActive: booleanFrom(row.is_active, previous?.isActive ?? true),
    map: mapFromRealtimeRow(row.map, previous?.map),
    grid: normalizeGridConfig(
      isRecord(row.grid) ? (row.grid as Partial<VttScene['grid']>) : previous?.grid
    ),
    fog: {
      enabled: booleanFrom(fog.enabled, false),
      regions: Array.isArray(fog.regions) ? fog.regions : [],
    },
    settings: {
      showEnemyResources: booleanFrom(settings.showEnemyResources, false),
    },
    createdAt: optionalStringFrom(row.created_at) ?? previous?.createdAt,
    updatedAt: optionalStringFrom(row.updated_at) ?? previous?.updatedAt,
  };
}

function tokenFromRealtimeRow(row: RealtimeRow): VttToken | null {
  const id = optionalStringFrom(row.id);
  const sceneId = optionalStringFrom(row.scene_id);
  if (!id || !sceneId) return null;

  const combatantType = stringFrom(row.combatant_type, 'enemy');
  const sourceType = stringFrom(row.source_type);

  return {
    id,
    sceneId,
    combatantId: optionalStringFrom(row.combatant_id),
    name: stringFrom(row.name, 'Token'),
    label: stringFrom(row.label, '?'),
    x: numberFrom(row.x, 0),
    y: numberFrom(row.y, 0),
    size: numberFrom(row.size, 56),
    color: stringFrom(row.color, '#64748b'),
    imageUrl: optionalStringFrom(row.image_url),
    visible: booleanFrom(row.visible, true),
    locked: booleanFrom(row.locked, false),
    combatantType: combatantType === 'ally' || combatantType === 'companion' ? combatantType : 'enemy',
    sourceType:
      sourceType === 'campaign-character' || sourceType === 'creature-library' || sourceType === 'manual'
        ? sourceType
        : undefined,
    sourceId: optionalStringFrom(row.source_id),
    sourceUserId: optionalStringFrom(row.source_user_id),
    metadata: objectFrom(row.metadata, {}),
    createdAt: optionalStringFrom(row.created_at),
    updatedAt: optionalStringFrom(row.updated_at),
  };
}

function actionFromRealtimeRow(row: RealtimeRow): VttAction | null {
  const id = optionalStringFrom(row.id);
  const sceneId = optionalStringFrom(row.scene_id);
  if (!id || !sceneId) return null;

  const type: VttActionType = stringFrom(row.type) === 'move-request' ? 'move-request' : 'ping';
  const rawStatus = stringFrom(row.status);
  const status: VttActionStatus =
    rawStatus === 'accepted' || rawStatus === 'dismissed' || rawStatus === 'pending' ? rawStatus : 'pending';

  return {
    id,
    sceneId,
    userId: stringFrom(row.user_id),
    type,
    status,
    tokenId: optionalStringFrom(row.token_id),
    fromX: row.from_x == null ? undefined : numberFrom(row.from_x, 0),
    fromY: row.from_y == null ? undefined : numberFrom(row.from_y, 0),
    toX: numberFrom(row.to_x, 0),
    toY: numberFrom(row.to_y, 0),
    message: optionalStringFrom(row.message),
    createdAt: optionalStringFrom(row.created_at),
    updatedAt: optionalStringFrom(row.updated_at),
  };
}

function sortTokens(tokens: VttToken[]): VttToken[] {
  return [...tokens].sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
}

function sortActions(actions: VttAction[]): VttAction[] {
  return [...actions]
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, 80);
}

function updateCachedTabletopStates(
  queryClient: QueryClient,
  sceneId: string,
  updater: (state: VttTabletopState) => VttTabletopState
) {
  queryClient.setQueriesData<VttTabletopState | null>(
    { queryKey: tabletopKeys.all },
    (current) => (current?.scene.id === sceneId ? updater(current) : current)
  );
}

function setCachedTabletopState(queryClient: QueryClient, state: VttTabletopState) {
  queryClient.setQueryData(tabletopKeys.scene(state.scene.id), state);
  queryClient.setQueryData(tabletopKeys.campaignActive(state.scene.campaignId), state);
}

function upsertTokenInState(state: VttTabletopState, token: VttToken): VttTabletopState {
  const visibleToken = filterTokensForRole(
    [token],
    state.role,
    state.scene.settings.showEnemyResources
  )[0];
  const tokensWithoutPrevious = state.tokens.filter((candidate) => candidate.id !== token.id);
  return {
    ...state,
    tokens: visibleToken ? sortTokens([...tokensWithoutPrevious, visibleToken]) : tokensWithoutPrevious,
  };
}

function replaceTokensInState(state: VttTabletopState, tokens: VttToken[]): VttTabletopState {
  return {
    ...state,
    tokens: sortTokens(filterTokensForRole(tokens, state.role, state.scene.settings.showEnemyResources)),
  };
}

function removeTokenFromState(state: VttTabletopState, tokenId: string): VttTabletopState {
  return {
    ...state,
    tokens: state.tokens.filter((token) => token.id !== tokenId),
  };
}

function upsertActionInState(state: VttTabletopState, action: VttAction, userId: string): VttTabletopState {
  const visibleAction = filterActionsForRole([action], state.role, userId)[0];
  const actionsWithoutPrevious = state.actions.filter((candidate) => candidate.id !== action.id);
  return {
    ...state,
    actions: visibleAction ? sortActions([...actionsWithoutPrevious, visibleAction]) : actionsWithoutPrevious,
  };
}

function removeActionFromState(state: VttTabletopState, actionId: string): VttTabletopState {
  return {
    ...state,
    actions: state.actions.filter((action) => action.id !== actionId),
  };
}

function realtimeRowId(row: unknown): string | undefined {
  return isRecord(row) ? optionalStringFrom(row.id) : undefined;
}

export const tabletopKeys = {
  all: ['tabletop'] as const,
  scene: (sceneId: string | undefined) => [...tabletopKeys.all, 'scene', sceneId ?? ''] as const,
  campaignActive: (campaignId: string | undefined) =>
    [...tabletopKeys.all, 'campaign-active', campaignId ?? ''] as const,
};

export function useTabletopScene(sceneId: string | undefined) {
  return useQuery({
    queryKey: tabletopKeys.scene(sceneId),
    queryFn: () => getTabletopScene(sceneId!),
    enabled: !!sceneId,
    refetchOnWindowFocus: false,
  });
}

export function useActiveCampaignTabletop(campaignId: string | undefined) {
  return useQuery({
    queryKey: tabletopKeys.campaignActive(campaignId),
    queryFn: () => getActiveCampaignTabletop(campaignId!),
    enabled: !!campaignId,
    refetchOnWindowFocus: false,
  });
}

export function useTabletopRealtime(sceneId: string | undefined, campaignId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!sceneId) return;
    const supabase = createClient();
    let disposed = false;
    let refetchTimeout: number | undefined;
    let channel: ReturnType<typeof supabase.channel> | undefined;

    const refetch = () => {
      queryClient.refetchQueries({ queryKey: tabletopKeys.scene(sceneId) });
      if (campaignId) queryClient.refetchQueries({ queryKey: tabletopKeys.campaignActive(campaignId) });
    };

    const scheduleRefetch = () => {
      if (refetchTimeout) window.clearTimeout(refetchTimeout);
      refetchTimeout = window.setTimeout(refetch, 350);
    };

    const handleScenePayload = (payload: TabletopRealtimePayload) => {
      if (payload.eventType === 'DELETE') {
        scheduleRefetch();
        return;
      }
      const row = isRecord(payload.new) ? payload.new : null;
      if (!row) {
        scheduleRefetch();
        return;
      }

      let shouldRefetch = false;
      updateCachedTabletopStates(queryClient, sceneId, (state) => {
        const nextScene = sceneFromRealtimeRow(row, state.scene);
        if (!nextScene) {
          shouldRefetch = true;
          return state;
        }
        if (state.scene.map?.storagePath !== nextScene.map?.storagePath) shouldRefetch = true;
        if (state.scene.settings.showEnemyResources !== nextScene.settings.showEnemyResources) shouldRefetch = true;
        const nextState = { ...state, scene: nextScene };
        return replaceTokensInState(nextState, state.tokens);
      });
      if (shouldRefetch) scheduleRefetch();
    };

    const handleTokenPayload = (payload: TabletopRealtimePayload) => {
      if (payload.eventType === 'DELETE') {
        const id = realtimeRowId(payload.old);
        if (id) updateCachedTabletopStates(queryClient, sceneId, (state) => removeTokenFromState(state, id));
        else scheduleRefetch();
        return;
      }
      const row = isRecord(payload.new) ? payload.new : null;
      const token = row ? tokenFromRealtimeRow(row) : null;
      if (!token) {
        scheduleRefetch();
        return;
      }
      updateCachedTabletopStates(queryClient, sceneId, (state) => upsertTokenInState(state, token));
    };

    const handleActionPayload = (payload: TabletopRealtimePayload, userId: string) => {
      if (payload.eventType === 'DELETE') {
        const id = realtimeRowId(payload.old);
        if (id) updateCachedTabletopStates(queryClient, sceneId, (state) => removeActionFromState(state, id));
        else scheduleRefetch();
        return;
      }
      const row = isRecord(payload.new) ? payload.new : null;
      const action = row ? actionFromRealtimeRow(row) : null;
      if (!action) {
        scheduleRefetch();
        return;
      }
      updateCachedTabletopStates(queryClient, sceneId, (state) => upsertActionInState(state, action, userId));
    };

    const subscribe = async () => {
      const { data } = await supabase.auth.getUser();
      if (disposed) return;
      const userId = data.user?.id ?? '';

      channel = supabase
        .channel(`vtt-scene:${sceneId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'vtt_scenes', filter: `id=eq.${sceneId}` },
          (payload) => handleScenePayload(payload as TabletopRealtimePayload)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'vtt_tokens', filter: `scene_id=eq.${sceneId}` },
          (payload) => handleTokenPayload(payload as TabletopRealtimePayload)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'vtt_actions', filter: `scene_id=eq.${sceneId}` },
          (payload) => handleActionPayload(payload as TabletopRealtimePayload, userId)
        )
        .subscribe();
    };

    void subscribe();

    return () => {
      disposed = true;
      if (refetchTimeout) window.clearTimeout(refetchTimeout);
      if (channel) supabase.removeChannel(channel);
    };
  }, [sceneId, campaignId, queryClient]);
}

export function useTabletopMutations(sceneId: string | undefined) {
  const queryClient = useQueryClient();

  return {
    updateScene: useMutation({
      mutationFn: (updates: Parameters<typeof updateTabletopScene>[1]) => updateTabletopScene(sceneId!, updates),
      onSuccess: (state) => setCachedTabletopState(queryClient, state),
    }),
    updateToken: useMutation({
      mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateTabletopToken>[2] }) =>
        updateTabletopToken(sceneId!, id, updates),
      onSuccess: (token) => {
        if (sceneId) updateCachedTabletopStates(queryClient, sceneId, (state) => upsertTokenInState(state, token));
      },
    }),
    createAction: useMutation({
      mutationFn: (action: Parameters<typeof createTabletopAction>[1]) => createTabletopAction(sceneId!, action),
      onSuccess: (action) => {
        if (sceneId) {
          updateCachedTabletopStates(queryClient, sceneId, (state) =>
            upsertActionInState(state, action, action.userId)
          );
        }
      },
    }),
    resolveAction: useMutation({
      mutationFn: ({ actionId, status }: { actionId: string; status: 'accepted' | 'dismissed' }) =>
        resolveTabletopAction(actionId, status),
      onSuccess: (action) => {
        if (sceneId) {
          updateCachedTabletopStates(queryClient, sceneId, (state) =>
            upsertActionInState(state, action, action.userId)
          );
        }
      },
    }),
    syncCombatants: useMutation({
      mutationFn: () => syncTabletopCombatants(sceneId!),
      onSuccess: (tokens) => {
        if (sceneId) updateCachedTabletopStates(queryClient, sceneId, (state) => replaceTokensInState(state, tokens));
      },
    }),
    uploadMap: useMutation({
      mutationFn: (params: { file: File; width: number; height: number }) =>
        uploadVttMap({ sceneId: sceneId!, ...params }),
      onSuccess: (state) => setCachedTabletopState(queryClient, state),
    }),
  };
}
