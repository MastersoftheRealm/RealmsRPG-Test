/**
 * Campaign invite codes
 * =====================
 * Invite codes are 8 chars from ALPHANUMERIC (no I, O, 0, 1).
 */

/** Same charset as server generation + API validation */
const INVITE_CODE_CHARS = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/;

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
