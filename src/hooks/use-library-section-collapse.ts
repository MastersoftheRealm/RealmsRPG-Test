'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Open a library section when rows show up, unless the user already toggled it.
 * The first count can be 0 while trait names are still resolving (86e3jvjh8).
 */
export function librarySectionExpandedForCount(
  expanded: boolean,
  userToggled: boolean,
  itemCount: number,
  expandedWhenEmpty = false,
): boolean {
  if (userToggled) return expanded;
  if (itemCount > 0) return true;
  if (expandedWhenEmpty) return true;
  return expanded;
}

export type LibrarySectionSession = { expanded: boolean; userToggled: boolean };

const librarySectionSessions = new Map<string, LibrarySectionSession>();

export function readLibrarySectionSession(sessionKey: string): LibrarySectionSession | undefined {
  return librarySectionSessions.get(sessionKey);
}

export function rememberLibrarySectionSession(
  sessionKey: string,
  session: LibrarySectionSession,
): void {
  librarySectionSessions.set(sessionKey, session);
}

/** Remount keeps a collapse from earlier in this page session. Otherwise open when there are rows. */
export function librarySectionStateForMount(
  itemCount: number,
  stored: LibrarySectionSession | undefined,
  expandedWhenEmpty = false,
): LibrarySectionSession {
  if (stored) return stored;
  return { expanded: itemCount > 0 || expandedWhenEmpty, userToggled: false };
}

/**
 * Session UI collapse for character sheet library sections.
 * Default expanded when itemCount > 0; expand after add when collapsible.
 */
export function useLibrarySectionCollapse(
  collapsible: boolean,
  itemCount: number,
  onAdd?: () => void,
  sessionKey?: string,
  expandedWhenEmpty = false,
) {
  const [expanded, setExpanded] = useState(() => {
    const stored = sessionKey ? readLibrarySectionSession(sessionKey) : undefined;
    return librarySectionStateForMount(itemCount, stored, expandedWhenEmpty).expanded;
  });
  const userToggledRef = useRef(
    sessionKey ? (readLibrarySectionSession(sessionKey)?.userToggled ?? false) : false,
  );

  useEffect(() => {
    setExpanded((current) => {
      const next = librarySectionExpandedForCount(
        current,
        userToggledRef.current,
        itemCount,
        expandedWhenEmpty,
      );
      if (sessionKey) {
        rememberLibrarySectionSession(sessionKey, {
          expanded: next,
          userToggled: userToggledRef.current,
        });
      }
      return next;
    });
  }, [itemCount, sessionKey, expandedWhenEmpty]);

  const onExpandedChange = useCallback(
    (next: boolean) => {
      userToggledRef.current = true;
      setExpanded(next);
      if (sessionKey) {
        rememberLibrarySectionSession(sessionKey, { expanded: next, userToggled: true });
      }
    },
    [sessionKey],
  );

  const onAddWithExpand = useCallback(() => {
    onAdd?.();
    if (collapsible) {
      setExpanded(true);
      if (sessionKey) {
        rememberLibrarySectionSession(sessionKey, {
          expanded: true,
          userToggled: userToggledRef.current,
        });
      }
    }
  }, [onAdd, collapsible, sessionKey]);

  const isContentVisible = !collapsible || expanded;

  const headerCollapseProps = collapsible
    ? ({
        collapsible: true as const,
        expanded,
        onExpandedChange,
      } as const)
    : {};

  return {
    isContentVisible,
    onAdd: onAdd ? onAddWithExpand : undefined,
    headerCollapseProps,
    expand: () => setExpanded(true),
  };
}

export type LibrarySectionCollapseHeaderProps = {
  collapsible?: boolean | undefined;
  expanded?: boolean | undefined;
  onExpandedChange?: ((expanded: boolean) => void) | undefined;
};
