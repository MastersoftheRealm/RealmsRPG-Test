import { notFound, redirect } from 'next/navigation';
import { isGuestCharacterId } from '@/lib/guest-character-storage';
import { fetchInternalApi } from '@/lib/server/internal-api-fetch';

function denyResourcePage(apiStatus: number, returnPath: string): never {
  if (apiStatus === 404) notFound();
  if (apiStatus === 401) {
    redirect(`/login?returnTo=${encodeURIComponent(returnPath)}`);
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
  } catch {
    denyResourcePage(500, returnPath);
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
  } catch {
    denyResourcePage(500, returnPath);
  }
  if (!res.ok) denyResourcePage(res.status, returnPath);
}
