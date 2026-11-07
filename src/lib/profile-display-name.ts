/**
 * How display_name is written on user_profiles (PAGES1-001).
 * `undefined` means "do not change the stored value" on update.
 */

export function profileDisplayNameWriteValue(
  displayName: string | undefined,
): string | null | undefined {
  if (displayName === undefined) return undefined;
  const trimmed = displayName.trim();
  return trimmed.length > 0 ? trimmed : null;
}
