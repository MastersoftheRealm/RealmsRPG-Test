'use client';

/**
 * ListRowThumbnail — small entity art in grid/list rows (D&D Beyond–style).
 * Thin wrapper over ExpandableImage for GridListRow.thumbnail.
 */

import { cn } from '@/lib/utils';
import { ExpandableImage } from './expandable-image';

export interface ListRowThumbnailProps {
  src: string;
  alt: string;
  isPlaceholder?: boolean;
  className?: string;
}

export function ListRowThumbnail({ src, alt, isPlaceholder = false, className }: ListRowThumbnailProps) {
  return (
    <ExpandableImage
      src={src}
      alt={alt}
      isPlaceholder={isPlaceholder}
      stopPropagation
      className={cn(
        'relative flex-shrink-0 rounded-md border border-border-light bg-image-matte',
        'min-w-[44px] min-h-[44px] w-11 h-11',
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        loading="lazy"
        decoding="async"
      />
    </ExpandableImage>
  );
}
