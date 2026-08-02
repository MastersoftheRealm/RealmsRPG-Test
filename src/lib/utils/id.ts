/**
 * Lightweight client-side id generation for ephemeral encounter/session rows.
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
