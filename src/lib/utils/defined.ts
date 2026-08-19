/**
 * Narrow `T | undefined` from indexed access (`noUncheckedIndexedAccess`).
 * Throws when the value is missing — same class of failure as reading `.prop` on undefined.
 */
export function defined<T>(value: T | undefined, message?: string): T {
  if (value === undefined) {
    throw new Error(message ?? 'Expected a defined value');
  }
  return value;
}

export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
