/**
 * Stable empty fallbacks for React hook dependency arrays.
 * Never mutate these — always copy first if writing.
 */

import type { PathGuidanceGroup } from '@/types/archetype';

export const EMPTY_STRING_ARRAY: string[] = [];
export const EMPTY_NUMBER_RECORD: Record<string, number> = {};
export const EMPTY_GUIDANCE_GROUPS: PathGuidanceGroup[] = [];
