/**
 * Drop `?edit=` after a creator save (86e3jwurq).
 *
 * A dirty draft arms a same-URL history sentinel. Accepting the draft pops that
 * sentinel, and Next treats the pop as a navigation to the current address.
 * That pop discards a `router.replace` that already started, so the edit query
 * stays. Clear the query after the pop, or immediately when no sentinel is armed.
 * Same search-param deletion as the guided creator entry bootstrap.
 */

import { isCreatorBackSentinel } from './creator-unsaved-guard';

/** Path + search + hash with one query key removed. */
export function hrefWithoutSearchParam(href: string, key: string): string {
  const url = new URL(href, 'https://realmsrpg.local');
  url.searchParams.delete(key);
  const qs = url.searchParams.toString();
  return `${url.pathname}${qs ? `?${qs}` : ''}${url.hash}`;
}

export function creatorPathWithoutEdit(href: string): string {
  return hrefWithoutSearchParam(href, 'edit');
}

export type CreatorEditClear = {
  when: 'after-sentinel-pop' | 'now';
  href: string;
};

export function creatorEditClearPlan(href: string, historyState: unknown): CreatorEditClear {
  return {
    when: isCreatorBackSentinel(historyState) ? 'after-sentinel-pop' : 'now',
    href: creatorPathWithoutEdit(href),
  };
}

/**
 * Run `clear` now, or on the next turn after the sentinel pop.
 * The pop handler must not clear in the same turn: Next's popstate listener
 * is already queued and would discard that navigation.
 */
export function bindCreatorEditClear(
  plan: CreatorEditClear,
  clear: (href: string) => void,
  listen: (onPop: () => void) => () => void,
): void {
  if (plan.when === 'now') {
    clear(plan.href);
    return;
  }
  let stop = () => {};
  stop = listen(() => {
    stop();
    queueMicrotask(() => clear(plan.href));
  });
}
