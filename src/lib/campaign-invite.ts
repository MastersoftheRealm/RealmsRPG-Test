/**
 * Campaign invite codes & visibility when joining a campaign
 * ===========================================================
 * Invite codes are 8 chars from ALPHANUMERIC (no I, O, 0, 1).
 * Visibility: joining should set `campaign` only when needed; never downgrade `public`.
 */

import type { CharacterVisibility } from '@/types/character';

/** Same charset as server generation + API validation */
export const INVITE_CODE_CHARS = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/;

/**
 * Normalize pasted codes: remove spaces/dashes, uppercase.
 * Does not validate length/charset — use isValidInviteCodeFormat after.
 */
export function normalizeInviteCodeInput(raw: string | undefined): string {
  return (raw ?? '').replace(/[\s-]/g, '').trim().toUpperCase();
}

export function isValidInviteCodeFormat(code: string): boolean {
  return code.length === 8 && INVITE_CODE_CHARS.test(code);
}

/**
 * When adding a character to a campaign: use `campaign` visibility unless
 * already `campaign` or `public` (preserve broader sharing).
 */
export function visibilityForCampaignMembership(current: unknown): {
  visibility: CharacterVisibility;
  visibilityUpdated: boolean;
} {
  const v = typeof current === 'string' ? current.trim().toLowerCase() : '';
  if (v === 'public') {
    return { visibility: 'public', visibilityUpdated: false };
  }
  if (v === 'campaign') {
    return { visibility: 'campaign', visibilityUpdated: false };
  }
  return { visibility: 'campaign', visibilityUpdated: true };
}
