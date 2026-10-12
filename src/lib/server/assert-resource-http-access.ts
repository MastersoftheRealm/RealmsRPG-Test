import { notFound } from 'next/navigation';
import { isGuestCharacterId } from '@/lib/guest-character-storage';
import { fetchInternalApi } from '@/lib/server/internal-api-fetch';

/** Align HTML denial with GET /api/characters/[id] (404 when not readable). */
export async function assertCharacterSheetHttpAccess(characterId: string): Promise<void> {
  const id = characterId?.trim();
  if (!id || isGuestCharacterId(id)) return;

  const res = await fetchInternalApi(`/api/characters/${encodeURIComponent(id)}`);
  if (res.status === 404) notFound();
}

/** Align HTML denial with GET /api/campaigns/[id] (404 when not a member). */
export async function assertCampaignDetailHttpAccess(campaignId: string): Promise<void> {
  const id = campaignId?.trim();
  if (!id) return;

  const res = await fetchInternalApi(`/api/campaigns/${encodeURIComponent(id)}`);
  if (res.status === 404) notFound();
}
