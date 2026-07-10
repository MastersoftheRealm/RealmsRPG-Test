import { apiFetch, apiFetchOrNull, apiUpload } from '@/lib/api-client';
import type { VttAction, VttGridConfig, VttTabletopState, VttToken } from '@/types/tabletop';

export async function openEncounterTabletop(encounterId: string): Promise<{ sceneId: string; campaignId: string }> {
  return apiFetch(`/api/encounters/${encodeURIComponent(encounterId)}/tabletop`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getActiveCampaignTabletop(campaignId: string): Promise<VttTabletopState | null> {
  return apiFetchOrNull(`/api/tabletop/campaigns/${encodeURIComponent(campaignId)}/active-scene`);
}

export async function getTabletopScene(sceneId: string): Promise<VttTabletopState | null> {
  return apiFetchOrNull(`/api/tabletop/scenes/${encodeURIComponent(sceneId)}`);
}

export async function updateTabletopScene(
  sceneId: string,
  updates: {
    name?: string;
    isActive?: boolean;
    grid?: Partial<VttGridConfig>;
    fog?: VttTabletopState['scene']['fog'];
    settings?: Partial<VttTabletopState['scene']['settings']>;
  }
): Promise<VttTabletopState> {
  return apiFetch(`/api/tabletop/scenes/${encodeURIComponent(sceneId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function syncTabletopCombatants(sceneId: string): Promise<VttToken[]> {
  return apiFetch(`/api/tabletop/scenes/${encodeURIComponent(sceneId)}/tokens`, {
    method: 'POST',
    body: JSON.stringify({ action: 'sync-combatants' }),
  });
}

export async function updateTabletopToken(sceneId: string, id: string, updates: Partial<VttToken>): Promise<VttToken> {
  return apiFetch(`/api/tabletop/scenes/${encodeURIComponent(sceneId)}/tokens`, {
    method: 'PATCH',
    body: JSON.stringify({ id, updates }),
  });
}

export async function createTabletopAction(
  sceneId: string,
  action: Pick<VttAction, 'type' | 'tokenId' | 'fromX' | 'fromY' | 'toX' | 'toY' | 'message'>
): Promise<VttAction> {
  return apiFetch(`/api/tabletop/scenes/${encodeURIComponent(sceneId)}/actions`, {
    method: 'POST',
    body: JSON.stringify(action),
  });
}

export async function resolveTabletopAction(
  actionId: string,
  status: 'accepted' | 'dismissed'
): Promise<VttAction> {
  return apiFetch(`/api/tabletop/actions/${encodeURIComponent(actionId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function uploadVttMap(params: {
  sceneId: string;
  file: File;
  width: number;
  height: number;
}): Promise<VttTabletopState> {
  const formData = new FormData();
  formData.append('sceneId', params.sceneId);
  formData.append('width', String(params.width));
  formData.append('height', String(params.height));
  formData.append('file', params.file);
  return apiUpload('/api/upload/vtt-map', formData);
}

