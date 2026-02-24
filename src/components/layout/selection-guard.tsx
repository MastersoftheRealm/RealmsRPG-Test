/**
 * SelectionGuard
 * ===============
 * Mitigates "Range.selectNode: the given Node has no parent" when the selection's
 * anchor node has been detached (e.g. modal/content unmounted before mouseup).
 * The error originates from dependency code (React/Next chunk) that touches selection
 * on mouseup; we clear invalid selection so no code runs against a detached node.
 */

'use client';

import { useEffect } from 'react';

export function SelectionGuard() {
  useEffect(() => {
    const handleMouseUp = () => {
      try {
        const sel = typeof document !== 'undefined' ? document.getSelection() : null;
        if (!sel || sel.rangeCount === 0) return;
        const anchor = sel.anchorNode;
        if (anchor && !document.contains(anchor)) {
          sel.removeAllRanges();
        }
      } catch {
        // Ignore; guard is best-effort
      }
    };

    document.addEventListener('mouseup', handleMouseUp, true);
    return () => document.removeEventListener('mouseup', handleMouseUp, true);
  }, []);

  return null;
}
