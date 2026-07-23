'use client';

import { getFallbackPortraitDataUrl } from '@/lib/placeholder-art';
import { usePlaceholderTheme } from './use-placeholder-theme';

/** Theme-aware inline portrait placeholder for onError handlers and comparisons. */
export function usePortraitFallbackUrl(): string {
  const theme = usePlaceholderTheme();
  return getFallbackPortraitDataUrl(theme);
}
