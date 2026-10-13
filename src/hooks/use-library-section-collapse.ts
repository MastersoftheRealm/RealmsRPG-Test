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
): boolean {
  if (userToggled) return expanded;
  if (itemCount > 0) return true;
  return expanded;
}

/**
 * Session UI collapse for character sheet library sections.
 * Default expanded when itemCount > 0; expand after add when collapsible.
 */
export function useLibrarySectionCollapse(
  collapsible: boolean,
  itemCount: number,
  onAdd?: () => void,
) {
  const [expanded, setExpanded] = useState(() => itemCount > 0);
  const userToggledRef = useRef(false);

  useEffect(() => {
    setExpanded((current) =>
      librarySectionExpandedForCount(current, userToggledRef.current, itemCount),
    );
  }, [itemCount]);

  const onExpandedChange = useCallback((next: boolean) => {
    userToggledRef.current = true;
    setExpanded(next);
  }, []);

  const onAddWithExpand = useCallback(() => {
    onAdd?.();
    if (collapsible) {
      setExpanded(true);
    }
  }, [onAdd, collapsible]);

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
