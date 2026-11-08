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
  continuationBusy: boolean;
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

export type AdminUsersDirectoryAction<T extends { id: string }> =
  | { type: 'query_switch'; owner: AdminUsersListOwner }
  | { type: 'initial_page'; owner: AdminUsersListOwner; users: T[]; hasMore: boolean }
  | { type: 'continuation_begin' }
  | {
      type: 'continuation_success';
      request: AdminUsersListFetchContext;
      users: T[];
      hasMore: boolean;
    }
  | { type: 'continuation_failure'; request: AdminUsersListFetchContext; error: string }
  | { type: 'continuation_settle'; request: AdminUsersListFetchContext };

export function adminUsersDirectoryReducer<T extends { id: string }>(
  state: AdminUsersDirectorySlice<T>,
  action: AdminUsersDirectoryAction<T>,
): AdminUsersDirectorySlice<T> {
  switch (action.type) {
    case 'query_switch':
      return {
        owner: action.owner,
        users: [],
        hasMore: false,
        continuationError: null,
        continuationBusy: false,
      };
    case 'initial_page':
      if (!adminUsersOwnersMatch(state.owner, action.owner)) return state;
      return {
        ...state,
        users: action.users,
        hasMore: action.hasMore,
        continuationError: null,
        continuationBusy: false,
      };
    case 'continuation_begin':
      return { ...state, continuationError: null, continuationBusy: true };
    case 'continuation_success':
    case 'continuation_failure': {
      const applied = tryApplyContinuationResult(state, action.request, applyPayload(action));
      return { ...applied, continuationBusy: false };
    }
    case 'continuation_settle': {
      const requestOwner = adminUsersRequestOwner(action.request);
      if (!adminUsersOwnersMatch(state.owner, requestOwner)) return state;
      if (state.continuationBusy) return { ...state, continuationBusy: false };
      return state;
    }
    default:
      return state;
  }
}

function applyPayload<T extends { id: string }>(
  action: Extract<
    AdminUsersDirectoryAction<T>,
    { type: 'continuation_success' } | { type: 'continuation_failure' }
  >,
): { ok: true; users: T[]; hasMore: boolean } | { ok: false; error: string } {
  if (action.type === 'continuation_success') {
    return { ok: true, users: action.users, hasMore: action.hasMore };
  }
  return { ok: false, error: action.error };
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

export function createEmptyAdminUsersDirectorySlice<T extends { id: string }>(
  owner: AdminUsersListOwner = { generation: 0, q: '' },
): AdminUsersDirectorySlice<T> {
  return {
    owner,
    users: [],
    hasMore: false,
    continuationError: null,
    continuationBusy: false,
  };
}
