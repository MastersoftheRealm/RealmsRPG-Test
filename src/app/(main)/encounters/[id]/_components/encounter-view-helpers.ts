/**
 * Shared encounter view helpers (TASK-608)
 * ========================================
 * Identical id / initiative helpers used by combat + skill facades.
 */

import { generateId } from '@/lib/utils';

export { generateId };

export function rollInitiative(acuity: number = 0): number {
  return Math.floor(Math.random() * 20) + 1 + acuity;
}
