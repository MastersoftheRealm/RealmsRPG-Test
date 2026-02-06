/**
 * Object Utilities
 * =================
 * Shared utilities for object manipulation
 */

/**
 * Remove undefined values from an object recursively.
 * Useful for preparing data for Firestore which doesn't accept undefined values.
 * 
 * @param obj - The object to clean
 * @returns A new object with all undefined values removed
 * 
 * @example
 * const data = { name: 'Test', value: undefined, nested: { a: 1, b: undefined } };
 * removeUndefined(data); // { name: 'Test', nested: { a: 1 } }
 */
export function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(item => 
      typeof item === 'object' && item !== null 
        ? removeUndefined(item as Record<string, unknown>) 
        : item
    ) as unknown as T;
  } else if (obj && typeof obj === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        clean[k] = typeof v === 'object' && v !== null 
          ? removeUndefined(v as Record<string, unknown>) 
          : v;
      }
    }
    return clean as T;
  }
  return obj;
}
