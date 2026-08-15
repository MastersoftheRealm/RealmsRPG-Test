'use client';

import { useCallback, useState } from 'react';

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
        onExpandedChange: setExpanded,
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
  collapsible?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};
