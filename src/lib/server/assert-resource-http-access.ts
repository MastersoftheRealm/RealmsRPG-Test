import { notFound, redirect } from 'next/navigation';
import { isGuestCharacterId } from '@/lib/guest-character-storage';
import { fetchInternalApi } from '@/lib/server/internal-api-fetch';
import { ResourceAccessUnavailableError } from '@/lib/server/resource-access-unavailable';

function denyResourcePage(apiStatus: number | 'network', returnPath: string): never {
  if (apiStatus === 404) notFound();
  if (apiStatus === 401) {
    redirect(`/login?returnTo=${encodeURIComponent(returnPath)}`);
  }
  if (
    apiStatus === 'network' ||
    apiStatus === 429 ||
    (typeof apiStatus === 'number' && apiStatus >= 500)
  ) {
    console.error('[resource-access] Access preflight unavailable', {
      status: apiStatus,
      returnPath,
    });
    throw new ResourceAccessUnavailableError(
      apiStatus === 'network' ? 'network' : apiStatus,
      returnPath,
    );
  }
  notFound();
}

/** Align HTML denial with GET /api/characters/[id] (404 when not readable). */
export async function assertCharacterSheetHttpAccess(characterId: string): Promise<void> {
  const id = characterId?.trim();
  if (!id || isGuestCharacterId(id)) return;

  const returnPath = `/characters/${encodeURIComponent(id)}`;
  let res: Response;
  try {
    res = await fetchInternalApi(`/api/characters/${encodeURIComponent(id)}`);
  } catch (err) {
    console.error('[resource-access] Character access preflight failed', err);
    denyResourcePage('network', returnPath);
  }
  if (!res.ok) denyResourcePage(res.status, returnPath);
}

/** Align HTML denial with GET /api/campaigns/[id] (404 when not a member). */
export async function assertCampaignDetailHttpAccess(campaignId: string): Promise<void> {
  const id = campaignId?.trim();
  if (!id) return;

  const returnPath = `/campaigns/${encodeURIComponent(id)}`;
  let res: Response;
  try {
    res = await fetchInternalApi(`/api/campaigns/${encodeURIComponent(id)}`);
  } catch (err) {
    console.error('[resource-access] Campaign access preflight failed', err);
    denyResourcePage('network', returnPath);
  }
  if (!res.ok) denyResourcePage(res.status, returnPath);
}
