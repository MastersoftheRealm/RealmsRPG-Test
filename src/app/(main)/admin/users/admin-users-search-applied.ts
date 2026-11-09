/** True when debounced input differs from the query already driving the list/API key. */
export function shouldApplyAdminUsersSearchChange(applied: string, incoming: string): boolean {
  return applied !== incoming;
}
