/**
 * Shared encounter view helpers (TASK-608)
 * ========================================
 * Identical id / initiative helpers used by combat + skill facades.
 */

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function rollInitiative(acuity: number = 0): number {
  return Math.floor(Math.random() * 20) + 1 + acuity;
}
