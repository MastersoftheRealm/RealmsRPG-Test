'use client';

import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { IconButton } from '@/components/ui';

export function NotesTabEditControls({
  title,
  visibleOutsideEdit,
  hideBlocked,
  canMoveUp,
  canMoveDown,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
}: {
  title: string;
  visibleOutsideEdit: boolean;
  hideBlocked: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggleVisibility?: (() => void) | undefined;
  onMoveUp?: (() => void) | undefined;
  onMoveDown?: (() => void) | undefined;
}) {
  if (!onToggleVisibility && !onMoveUp && !onMoveDown) return null;

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {onMoveUp ? (
        <IconButton
          variant="ghost"
          size="sm"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          disabled={!canMoveUp}
          label={`Move ${title} up`}
          className="-mr-0.5"
        >
          <ChevronUp className="h-4 w-4" />
        </IconButton>
      ) : null}
      {onMoveDown ? (
        <IconButton
          variant="ghost"
          size="sm"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          disabled={!canMoveDown}
          label={`Move ${title} down`}
          className="-mr-0.5"
        >
          <ChevronDown className="h-4 w-4" />
        </IconButton>
      ) : null}
      {onToggleVisibility ? (
        <IconButton
          variant="ghost"
          size="sm"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          disabled={hideBlocked}
          label={`${visibleOutsideEdit ? 'Hide' : 'Show'} ${title} when not editing`}
          className="-mr-0.5 shrink-0"
        >
          {visibleOutsideEdit ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4 text-text-muted" />
          )}
        </IconButton>
      ) : null}
    </div>
  );
}
