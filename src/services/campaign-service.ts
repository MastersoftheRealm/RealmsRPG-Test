/**
 * Campaign Service
 * =================
 * Client-side API calls for campaign data. Uses /api/campaigns (Prisma).
 */

import type { Campaign, CampaignSummary } from '@/types/campaign';
import { apiFetch } from '@/lib/api-client';

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
  const res = await fetch(`${API_BASE}/${encodeURIComponent(campaignId)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Request failed');
  }
  return res.json();
}

/**
 * Look up a campaign by invite code (for join flow).
 */
export async function getCampaignByInviteCode(inviteCode: string): Promise<{ id: string; name: string } | null> {
  const code = inviteCode?.trim().toUpperCase();
  if (!code || code.length < 4) return null;
  const res = await fetch(`${API_BASE}/invite/${encodeURIComponent(code)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Request failed');
  }
  return res.json();
}
