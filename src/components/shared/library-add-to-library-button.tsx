'use client';

import type { MouseEvent, ReactNode } from 'react';
import { BookPlus, UserPlus } from 'lucide-react';
import { IconButton } from '@/components/ui';
import {
  GRID_LIST_ROW_ACTION_ICON_BUTTON_SIZE,
  GRID_LIST_ROW_ACTION_ICON_CLASS,
} from './grid-list-row-chrome';

const ADD_ICON_BUTTON_CLASS =
  'text-primary-link-fg hover:text-primary-fg-hover hover:bg-primary-subtle-bg';

function LibraryRowAddIconButton({
  onClick,
  label,
  children,
}: {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <IconButton
      variant="ghost"
      size={GRID_LIST_ROW_ACTION_ICON_BUTTON_SIZE}
      onClick={onClick}
      label={label}
      className={ADD_ICON_BUTTON_CLASS}
    >
      {children}
    </IconButton>
  );
}

/**
 * Realms Library row action — add official item to My Library.
 * BookPlus (not Plus) so it stays distinct from add-to-character UserPlus (TASK-731).
 */
export function LibraryAddToLibraryButton({
  onClick,
  label = 'Add to my library',
}: {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  label?: string;
}) {
  return (
    <LibraryRowAddIconButton onClick={onClick} label={label}>
      <BookPlus className={GRID_LIST_ROW_ACTION_ICON_CLASS} />
    </LibraryRowAddIconButton>
  );
}

/**
 * Add a library row to the filtered character. UserPlus (not Plus / BookPlus)
 * so dual-action Realms rows stay learn-once (TASK-731).
 */
export function LibraryAddToCharacterButton({
  onClick,
  kind,
}: {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
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
  return (
    <LibraryRowAddIconButton onClick={onClick} label={label}>
      <UserPlus className={GRID_LIST_ROW_ACTION_ICON_CLASS} />
    </LibraryRowAddIconButton>
  );
}
