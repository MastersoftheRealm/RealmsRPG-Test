/**
 * In-context ability effect blurbs for the character creator (Layer 1).
 * No DB change — REALMS_PRODUCT_OVERVIEW.md Appendix C.
 */

import type { AbilityName } from '@/types';

export function formatAbilityLabel(name: AbilityName): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
