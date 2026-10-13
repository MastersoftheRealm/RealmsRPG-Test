/**
 * Current HP / EN ink for the written sheet states.
 * Gold when over max. Health below 0 is dark red. Health at or below −max uses
 * the darkest text token (light near-black, dark near-white). Energy has no
 * negative or death color. Zero Health stays the caller's normal ink.
 */
export function resourceCurrentValueClass(
  pool: 'health' | 'energy',
  current: number,
  max: number,
): string | null {
  if (current > max) return 'text-warning-fg';
  if (pool !== 'health' || max <= 0) return null;
  if (current <= -max) return 'text-text-primary';
  if (current < 0) return 'text-danger-900 dark:text-danger-fg';
  return null;
}
