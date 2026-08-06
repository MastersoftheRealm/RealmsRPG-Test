'use client';

import type { ReactNode } from 'react';
import { LibraryAddToLibraryButton } from './library-add-to-library-button';

/** Inline GLR actions (add-to-character, add-to-library, sync, etc.). */
export function LibraryRowActionSlot({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-0.5" data-expand-ignore>
      {children}
    </div>
  );
}

export function LibraryAddToCharacterButton({
  onClick,
  kind,
}: {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  kind: 'power' | 'technique' | 'weapon' | 'armor' | 'shield';
}) {
  const label =
    kind === 'power'
      ? "Add to character's powers"
      : kind === 'technique'
        ? "Add to character's techniques"
        : kind === 'weapon'
          ? "Add to character's weapons"
          : kind === 'armor'
            ? "Add to character's armor"
            : "Add to character's shields";
  return <LibraryAddToLibraryButton onClick={onClick} label={label} />;
}
