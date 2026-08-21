'use client';

import { useTheme } from 'next-themes';
import type { PlaceholderTheme } from '@/lib/placeholder-art';

/** Resolved light/dark for placeholder art (defaults to light until mounted). */
export function usePlaceholderTheme(): PlaceholderTheme {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? 'dark' : 'light';
}
