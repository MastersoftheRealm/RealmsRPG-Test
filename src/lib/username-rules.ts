/**
 * Shared username validation — register, profile create, and change-username flows.
 */

export const USERNAME_BLOCKLIST = [
  'admin',
  'moderator',
  'support',
  'realmsrpg',
  'realms',
  'official',
  'null',
  'undefined',
  'delete',
  'remove',
  'system',
  'root',
] as const;

export const USERNAME_MIN_LEN = 3;
export const USERNAME_MAX_LEN = 24;

export type UsernameValidationResult = { ok: true } | { ok: false; error: string };

export function validateUsername(
  raw: string,
  options?: { isAdmin?: boolean; allowEmpty?: boolean }
): UsernameValidationResult {
  const trimmed = raw.trim();
  const normalized = trimmed.toLowerCase();
  const isAdmin = options?.isAdmin ?? false;
  const allowEmpty = options?.allowEmpty ?? false;

  if (!trimmed) {
    return allowEmpty ? { ok: true } : { ok: false, error: 'Username is required' };
  }

  if (isAdmin) {
    return { ok: true };
  }

  if (trimmed.length < USERNAME_MIN_LEN) {
    return { ok: false, error: `Username must be at least ${USERNAME_MIN_LEN} characters` };
  }
  if (trimmed.length > USERNAME_MAX_LEN) {
    return { ok: false, error: `Username must be at most ${USERNAME_MAX_LEN} characters` };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { ok: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  const blocked = USERNAME_BLOCKLIST.some((word) => normalized.includes(word));
  if (blocked) {
    return { ok: false, error: 'This username is not allowed' };
  }

  return { ok: true };
}
