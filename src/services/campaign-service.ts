/**
 * Campaign Service
 * =================
 * Client-side API calls for campaign data. Uses /api/campaigns (Supabase).
 */

import type { Campaign, CampaignCharacterEncounterData, CampaignSummary } from '@/types/campaign';
import type { Character } from '@/types';
import { apiFetch, apiFetchOrNull } from '@/lib/api-client';
import { normalizeInviteCodeInput, isValidInviteCodeFormat } from '@/lib/campaign-invite';
import type { GetCharacterResult, LibraryForView } from '@/services/character-service';

const API_BASE = '/api/campaigns';

/**
 * Get campaigns the current user owns or is a member of (full Campaign with characters).
 */
export async function getMyCampaignsFull(): Promise<Campaign[]> {
  return apiFetch<Campaign[]>(`${API_BASE}?full=true`);
}

/**
 * Get campaigns the current user owns or is a member of.
 */
export async function getMyCampaigns(): Promise<CampaignSummary[]> {
  return apiFetch<CampaignSummary[]>(API_BASE);
}

/**
 * Get a single campaign by ID.
 */
export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  return apiFetchOrNull<Campaign>(`${API_BASE}/${encodeURIComponent(campaignId)}`);
}

/**
 * Get a roster character for the read-only Realm Master view.
 * Campaign-scoped route — roster membership, RM authorization and the character's
 * `visibility` are enforced there, so this is not interchangeable with
 * `getCharacter` / `/api/characters/[id]`.
 */
export async function getCampaignCharacterForView(
  campaignId: string,
  userId: string,
  characterId: string
): Promise<GetCharacterResult> {
  const data = await apiFetch<Character & { libraryForView?: LibraryForView }>(
    `${API_BASE}/${encodeURIComponent(campaignId)}/characters/${encodeURIComponent(userId)}/${encodeURIComponent(characterId)}`,
    { cache: 'no-store' }
  );
  const { libraryForView, ...character } = data;
  return { character, libraryForView };
}

/**
 * Minimal HP/EN/AP payload for combat/skill add and linked-character sync.
 * `?scope=encounter` is member-readable and skips `libraryForView` — not the RM-view GET.
 */
export async function getCampaignCharacterForEncounter(
  campaignId: string,
  userId: string,
  characterId: string,
  init?: RequestInit
): Promise<CampaignCharacterEncounterData | null> {
  return apiFetchOrNull<CampaignCharacterEncounterData>(
    `${API_BASE}/${encodeURIComponent(campaignId)}/characters/${encodeURIComponent(userId)}/${encodeURIComponent(characterId)}?scope=encounter`,
    { ...init, cache: 'no-store' }
  );
}

/**
 * Look up a campaign by invite code (for join flow).
 */
export async function getCampaignByInviteCode(inviteCode: string): Promise<{ id: string; name: string } | null> {
  const code = normalizeInviteCodeInput(inviteCode);
  if (!isValidInviteCodeFormat(code)) return null;
  return apiFetchOrNull<{ id: string; name: string }>(
    `${API_BASE}/invite/${encodeURIComponent(code)}`
  );
}
