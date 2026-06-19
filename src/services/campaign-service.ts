/**
 * Campaign Service
 * =================
 * Client-side API calls for campaign data. Uses /api/campaigns (Supabase).
 */

import type { Campaign, CampaignSummary } from '@/types/campaign';
import { apiFetch, apiFetchOrNull } from '@/lib/api-client';
import { normalizeInviteCodeInput, isValidInviteCodeFormat } from '@/lib/campaign-invite';

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
 * Look up a campaign by invite code (for join flow).
 */
export async function getCampaignByInviteCode(inviteCode: string): Promise<{ id: string; name: string } | null> {
  const code = normalizeInviteCodeInput(inviteCode);
  if (!isValidInviteCodeFormat(code)) return null;
  return apiFetchOrNull<{ id: string; name: string }>(
    `${API_BASE}/invite/${encodeURIComponent(code)}`
  );
}
