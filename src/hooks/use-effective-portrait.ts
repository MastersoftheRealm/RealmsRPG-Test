'use client';

import { getEffectivePortrait } from '@/lib/portrait';
import { usePlaceholderTheme } from './use-placeholder-theme';

/** Theme-aware portrait URL for client display surfaces. */
export function useEffectivePortrait(portrait: string | null | undefined): string {
  const theme = usePlaceholderTheme();
  return getEffectivePortrait(portrait, theme);
}
