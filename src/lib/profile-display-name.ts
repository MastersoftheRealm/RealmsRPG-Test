/**
 * How display_name is written on user_profiles.
 * `undefined` means "do not change the stored value" on update.
 */

export const PROFILE_DISPLAY_NAME_MAX_LENGTH = 50;

const CONTROL_CHAR = /[\u0000-\u001F\u007F]/;

export function validateProfileDisplayName(
  displayName: string,
): { ok: true } | { ok: false; error: string } {
  if (CONTROL_CHAR.test(displayName)) {
    return { ok: false, error: 'Display name contains invalid characters' };
  }
  const trimmed = displayName.trim();
  if (trimmed.length > PROFILE_DISPLAY_NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Display name must be at most ${PROFILE_DISPLAY_NAME_MAX_LENGTH} characters`,
    };
  }
  return { ok: true };
}

export function profileDisplayNameWriteValue(
  displayName: string | undefined,
): string | null | undefined {
  if (displayName === undefined) return undefined;
  const trimmed = displayName.trim();
  return trimmed.length > 0 ? trimmed : null;
}
