'use client';

/**
 * ListRowThumbnail — small entity art in grid/list rows (D&D Beyond–style).
 * Thin wrapper over ExpandableImage for GridListRow.thumbnail.
 */

import { cn } from '@/lib/utils';
import { getThemedPlaceholderSrc } from '@/lib/placeholder-art';
import { usePlaceholderTheme } from '@/hooks/use-placeholder-theme';
import { ExpandableImage } from './expandable-image';

export interface ListRowThumbnailProps {
  src: string;
  alt: string;
  isPlaceholder?: boolean;
  className?: string;
}

export function ListRowThumbnail({
  src,
  alt,
  isPlaceholder = false,
  className,
}: ListRowThumbnailProps) {
  const theme = usePlaceholderTheme();
  const displaySrc = isPlaceholder ? getThemedPlaceholderSrc(src, theme) : src;

  return (
    <ExpandableImage
      src={displaySrc}
      alt={alt}
      isPlaceholder={isPlaceholder}
      stopPropagation
      className={cn(
        'relative flex-shrink-0 rounded-md border border-border-light bg-image-matte',
        'h-11 min-h-[44px] w-11 min-w-[44px]',
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displaySrc}
        alt=""
        className="absolute inset-0 h-full w-full object-contain object-center"
        loading="lazy"
        decoding="async"
      />
    </ExpandableImage>
  );
}
