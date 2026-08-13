'use client';

import type { ReactNode } from 'react';

/** Inline GLR actions (add-to-character, add-to-library, sync, etc.). */
export function LibraryRowActionSlot({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-0.5" data-expand-ignore>
      {children}
    </div>
  );
}
