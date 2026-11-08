'use client';

export type AdminUsersListFetchContext = {
  generation: number;
  q: string;
  offset: number;
};

export type AdminUsersListOwner = {
  generation: number;
  q: string;
};

export type AdminUsersDirectorySlice<T extends { id: string }> = {
  owner: AdminUsersListOwner;
  users: T[];
  hasMore: boolean;
  continuationError: string | null;
};

export function adminUsersOwnerKey(owner: AdminUsersListOwner): string {
  return `${owner.generation}\u0000${owner.q}`;
}

function adminUsersOwnersMatch(a: AdminUsersListOwner, b: AdminUsersListOwner): boolean {
  return a.generation === b.generation && a.q === b.q;
}

function adminUsersRequestOwner(request: AdminUsersListFetchContext): AdminUsersListOwner {
  return { generation: request.generation, q: request.q };
}

export function nextContinuationBusyMap(
  prev: Record<string, boolean>,
  key: string,
  busy: boolean,
): Record<string, boolean> {
  if (busy) {
    if (prev[key]) return prev;
    return { ...prev, [key]: true };
  }
  if (!prev[key]) return prev;
  const next = { ...prev };
  delete next[key];
  return next;
}

export function tryApplyContinuationResult<T extends { id: string }>(
  slice: AdminUsersDirectorySlice<T>,
  request: AdminUsersListFetchContext,
  result: { ok: true; users: T[]; hasMore: boolean } | { ok: false; error: string },
): AdminUsersDirectorySlice<T> {
  const requestOwner = adminUsersRequestOwner(request);
  if (!adminUsersOwnersMatch(slice.owner, requestOwner)) return slice;
  if (slice.users.length !== request.offset) return slice;

  if (result.ok) {
    return {
      ...slice,
      users: [...slice.users, ...result.users],
      hasMore: result.hasMore,
      continuationError: null,
    };
  }

  return { ...slice, continuationError: result.error };
}
