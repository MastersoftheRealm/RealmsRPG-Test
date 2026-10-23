/**
 * A second `onAuthStateChange` listener can emit `INITIAL_SESSION` with a null
 * session before cookie storage is read. Applying that null wipes a signed-in
 * user and makes guest-only UI appear (86e3q9vhq). Real sign-out is `SIGNED_OUT`.
 */
export function shouldIgnoreNullAuthSession(options: {
  event: string;
  previousUserId: string | null | undefined;
  nextUserId: string | null | undefined;
}): boolean {
  const previousUserId = options.previousUserId?.trim() || null;
  const nextUserId = options.nextUserId?.trim() || null;
  return !nextUserId && !!previousUserId && options.event !== 'SIGNED_OUT';
}
