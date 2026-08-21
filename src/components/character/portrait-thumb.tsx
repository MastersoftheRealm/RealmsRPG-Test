'use client';

import { useEffectivePortrait } from '@/hooks/use-effective-portrait';
import { usePortraitFallbackUrl } from '@/hooks/use-portrait-fallback-url';
import { cn } from '@/lib/utils';

export interface PortraitThumbProps {
  portrait?: string | null | undefined;
  className?: string | undefined;
}

/** Decorative portrait thumb — theme-aware fallback, soft matte behind transparent PNGs. */
export function PortraitThumb({ portrait, className }: PortraitThumbProps) {
  const src = useEffectivePortrait(portrait);
  const fallbackUrl = usePortraitFallbackUrl();
  return (
    // eslint-disable-next-line @next/next/no-img-element -- dynamic portrait URL
    <img
      src={src}
      alt=""
      className={cn('bg-image-matte object-contain', className)}
      onError={(e) => {
        (e.target as HTMLImageElement).src = fallbackUrl;
      }}
    />
  );
}
