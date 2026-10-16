'use client';

import { Eye, EyeOff } from 'lucide-react';
import { IconButton } from '@/components/ui';
import {
  LIBRARY_SECTION_LABELS,
  resolveLibrarySectionVisibility,
} from '@/lib/character-library-section-visibility';
import type { CharacterLibrarySectionId } from '@/types';
import type { AllowUndefinedOptionals } from '@/lib/utils';

type LibrarySectionVisibilityToggleProps = AllowUndefinedOptionals<{
  sectionId: CharacterLibrarySectionId;
  sectionVisibility?: Partial<Record<CharacterLibrarySectionId, boolean>> | undefined;
  onSectionVisibilityChange?:
    | ((next: Partial<Record<CharacterLibrarySectionId, boolean>>) => void)
    | undefined;
}>;

export function LibrarySectionVisibilityToggle({
  sectionId,
  sectionVisibility,
  onSectionVisibilityChange,
}: LibrarySectionVisibilityToggleProps) {
  if (!onSectionVisibilityChange) return null;

  const resolved = resolveLibrarySectionVisibility(sectionVisibility);
  const visibleOutsideEdit = resolved[sectionId] !== false;
  const label = LIBRARY_SECTION_LABELS[sectionId];

  return (
    <IconButton
      variant="ghost"
      size="sm"
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSectionVisibilityChange({
          ...resolved,
          [sectionId]: !visibleOutsideEdit,
        });
      }}
      label={`${visibleOutsideEdit ? 'Hide' : 'Show'} ${label} section when not editing`}
      className="-mr-0.5 shrink-0"
    >
      {visibleOutsideEdit ? (
        <Eye className="h-4 w-4" />
      ) : (
        <EyeOff className="h-4 w-4 text-text-muted" />
      )}
    </IconButton>
  );
}
