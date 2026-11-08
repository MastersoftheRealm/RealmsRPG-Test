/**
 * Stale-response guards for admin users list pagination (server search + load more).
 */

export type AdminUsersListFetchContext = {
  generation: number;
  q: string;
  offset: number;
};

export type AdminUsersListActiveContext = {
  generation: number;
  q: string;
  usersLength: number;
};

/** True when a completed fetch should update list state (search, generation, or offset moved on). */
export function shouldCommitAdminUsersFetch(
  request: AdminUsersListFetchContext,
  active: AdminUsersListActiveContext,
): boolean {
  return (
    request.generation === active.generation &&
    request.q === active.q &&
    request.offset === active.usersLength
  );
}
