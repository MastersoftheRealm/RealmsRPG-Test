/**
 * Unsaved creator draft checks (86e3jzbkx).
 * Reload, in-app links, Back, and Load should ask before a dirty draft is discarded.
 */

export function creatorDraftIsDirty(current: string, clean: string): boolean {
  return current !== clean;
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
