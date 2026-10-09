/**
 * Unsaved creator draft checks (86e3jzbkx).
 * Reload, in-app links, Back, and Load should ask before a dirty draft is discarded.
 */

export const CREATOR_BACK_SENTINEL_KEY = 'creatorUnsavedGuard';

export function creatorDraftIsDirty(current: string, clean: string): boolean {
  return current !== clean;
}

export function isCreatorBackSentinel(state: unknown): boolean {
  return (
    !!state &&
    typeof state === 'object' &&
    (state as Record<string, unknown>)[CREATOR_BACK_SENTINEL_KEY] === true
  );
}

/** Copy the router history state and mark the one Back sentinel. */
export function creatorBackSentinelState(state: unknown): Record<string, unknown> {
  const preserved =
    state && typeof state === 'object' ? { ...(state as Record<string, unknown>) } : {};
  return { ...preserved, [CREATOR_BACK_SENTINEL_KEY]: true };
}

/** Dirty arms one sentinel. Accepting the draft (clean) removes it. A second arm does not push. */
export function creatorBackSentinelAction(
  isDirty: boolean,
  state: unknown,
): 'push' | 'back' | 'none' {
  const armed = isCreatorBackSentinel(state);
  if (isDirty) return armed ? 'none' : 'push';
  return armed ? 'back' : 'none';
}

let creatorSentinelRemovalQueued = false;

/** One in-flight removal, so a second clean pass does not pop the creator entry too. */
export function takeCreatorSentinelRemoval(): boolean {
  if (creatorSentinelRemovalQueued) return false;
  creatorSentinelRemovalQueued = true;
  return true;
}

export function finishCreatorSentinelRemoval(): void {
  creatorSentinelRemovalQueued = false;
}

export type CreatorBackHistory = {
  readonly state: unknown;
  readonly length: number;
  back: () => void;
};

export type CreatorBackLocation = {
  href: string;
};

/**
 * Confirmed Back leaves this creator document.
 * Extra same-URL sentinels are stepped past. This is not a fixed history.go(-2).
 */
export function stepCreatorBackUntilLeft(
  history: CreatorBackHistory,
  location: CreatorBackLocation,
  listen: (onPop: () => void) => () => void,
): void {
  const creatorUrl = location.href;
  let previousHref = location.href;
  let previousState = history.state;
  let remove = () => {};
  const onPop = () => {
    const moved = location.href !== previousHref || history.state !== previousState;
    previousHref = location.href;
    previousState = history.state;
    if (!moved || location.href !== creatorUrl) {
      remove();
      return;
    }
    history.back();
  };
  remove = listen(onPop);
  history.back();
}

export function creatorBeforeUnloadListener(shouldBlock: () => boolean) {
  return (event: { preventDefault: () => void; returnValue: string }) => {
    if (!shouldBlock()) return;
    event.preventDefault();
    event.returnValue = '';
  };
}

/** Toolbar Load: login, confirm discard, or open the library. */
export function creatorToolbarLoadAction(input: {
  unsavedDirty: boolean;
  needsLogin: boolean;
}): 'login' | 'confirm-discard' | 'open' {
  if (input.needsLogin) return 'login';
  if (input.unsavedDirty) return 'confirm-discard';
  return 'open';
}

/** Same-origin link that would leave this page. Hash-only and new-tab links do not. */
export function creatorInternalNavigationHref(input: {
  href: string | null;
  target: string | null;
  download: boolean;
  pageUrl: string;
}): string | null {
  if (input.download) return null;
  if (input.target && input.target !== '_self') return null;
  if (!input.href) return null;
  let next: URL;
  let page: URL;
  try {
    next = new URL(input.href);
    page = new URL(input.pageUrl);
  } catch {
    return null;
  }
  if (next.origin !== page.origin) return null;
  if (next.pathname === page.pathname && next.search === page.search) return null;
  return `${next.pathname}${next.search}${next.hash}`;
}
