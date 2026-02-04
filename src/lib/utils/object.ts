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

/**
 * Deep merge two objects, with source values overwriting target values.
 * Arrays are replaced, not merged.
 * 
 * @param target - The target object
 * @param source - The source object to merge from
 * @returns A new merged object
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const output = { ...target };
  
  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceValue = source[key];
    const targetValue = target[key];
    
    if (
      sourceValue !== undefined &&
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      output[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[keyof T];
    } else if (sourceValue !== undefined) {
      output[key] = sourceValue as T[keyof T];
    }
  }
  
  return output;
}
