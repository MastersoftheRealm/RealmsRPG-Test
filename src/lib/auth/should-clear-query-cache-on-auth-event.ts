/** Clear React Query only on real auth identity change / SIGNED_OUT (TASK-903). */

export function shouldClearQueryCacheOnAuthEvent(options: {
  event: string;
  previousUserId: string | null | undefined;
  nextUserId: string | null | undefined;
}): boolean {
  const previousUserId = options.previousUserId?.trim() || null;
  const nextUserId = options.nextUserId?.trim() || null;

  if (options.event === 'SIGNED_OUT') return true;

  if (options.event === 'SIGNED_IN' || options.event === 'USER_UPDATED') {
    return previousUserId !== nextUserId;
  }

  return false;
}
