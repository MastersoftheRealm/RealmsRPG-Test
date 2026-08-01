'use client';

import { Plus } from 'lucide-react';
import { IconButton } from '@/components/ui';

/** Realms Library row action — add official item to My Library. */
export function LibraryAddToLibraryButton({
  onClick,
  label = 'Add to my library',
}: {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  label?: string;
}) {
  return (
    <IconButton
      variant="ghost"
      size="sm"
      onClick={onClick}
      label={label}
      className="text-primary-link-fg hover:text-primary-fg-hover hover:bg-primary-subtle-bg"
    >
      <Plus className="w-4 h-4" />
    </IconButton>
  );
}
