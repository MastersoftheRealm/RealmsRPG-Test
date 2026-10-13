'use client';

import type { ReactNode } from 'react';
import { IconButton } from '@/components/ui';
import { Pencil, Copy, X } from 'lucide-react';

type NamedEntity = { id: string; name?: string | undefined };

/** Four w-7 icon buttons, gap-1, and the row actions' end padding. */
export const ADMIN_CODEX_ROW_ACTIONS_WIDTH = '8.5rem';

/** Species listing control plus the three row actions. */
export const ADMIN_CODEX_SPECIES_ACTIONS_WIDTH = '15rem';

/**
 * Admin Codex list row Edit / Duplicate / Delete (TASK-842).
 * Delete opens DeleteConfirmModal via the entity hook — no inline Yes/No.
 */
export function AdminCodexRowActions<T extends NamedEntity>({
  entity,
  onEdit,
  onDuplicate,
  onDelete,
  extraBefore,
}: {
  entity: T;
  onEdit: (entity: T) => void;
  onDuplicate: (entity: T) => void;
  onDelete: (entity: T) => void;
  extraBefore?: ReactNode | undefined;
}) {
  return (
    <div className="flex items-center gap-1 pr-2">
      {extraBefore}
      <IconButton variant="ghost" size="sm" onClick={() => onEdit(entity)} label="Edit">
        <Pencil className="h-4 w-4" />
      </IconButton>
      <IconButton variant="ghost" size="sm" onClick={() => onDuplicate(entity)} label="Duplicate">
        <Copy className="h-4 w-4" />
      </IconButton>
      <IconButton
        variant="ghost"
        size="sm"
        onClick={() => onDelete(entity)}
        label="Delete"
        className="text-danger-fg hover:bg-transparent hover:opacity-80"
      >
        <X className="h-4 w-4" />
      </IconButton>
    </div>
  );
}
