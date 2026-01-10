/**
 * Array Utilities
 * ================
 * Centralized array manipulation functions
 */

/**
 * Convert a value to an array of strings.
 */
export function toStrArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(',').map(s => s.trim());
  return [];
}

/**
 * Convert a value to an array of numbers.
 */
export function toNumArray(value: unknown): number[] {
  if (Array.isArray(value)) return value.map(Number).filter(n => !isNaN(n));
  if (typeof value === 'string') {
    return value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
  }
  return [];
}

/**
 * Get unique values from an array.
 */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * Get unique values from an array based on a key function.
 */
export function uniqueBy<T>(arr: T[], keyFn: (item: T) => unknown): T[] {
  const seen = new Set();
  return arr.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Group an array by a key function.
 */
export function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/**
 * Sort an array by a key function.
 */
export function sortBy<T>(arr: T[], keyFn: (item: T) => string | number, desc: boolean = false): T[] {
  return [...arr].sort((a, b) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return desc ? -comparison : comparison;
  });
}

/**
 * Filter an array by a search term.
 */
export function filterBySearch<T>(
  arr: T[],
  searchTerm: string,
  getSearchText: (item: T) => string
): T[] {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return arr;
  return arr.filter(item => getSearchText(item).toLowerCase().includes(term));
}

/**
 * Split an array into chunks of a specified size.
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Flatten a nested array.
 */
export function flatten<T>(arr: (T | T[])[]): T[] {
  return arr.flat() as T[];
}

/**
 * Take the first n items from an array.
 */
export function take<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

/**
 * Take the last n items from an array.
 */
export function takeLast<T>(arr: T[], n: number): T[] {
  return arr.slice(-n);
}

/**
 * Check if an array is empty.
 */
export function isEmpty<T>(arr: T[] | null | undefined): boolean {
  return !arr || arr.length === 0;
}

/**
 * Find an item by a predicate function.
 */
export function findBy<T>(arr: T[], predicate: (item: T) => boolean): T | undefined {
  return arr.find(predicate);
}

/**
 * Remove an item from an array (returns new array).
 */
export function removeItem<T>(arr: T[], item: T): T[] {
  return arr.filter(i => i !== item);
}

/**
 * Remove items matching a predicate (returns new array).
 */
export function removeBy<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  return arr.filter(item => !predicate(item));
}

/**
 * Shuffle an array randomly.
 */
export function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get the intersection of two arrays.
 */
export function intersection<T>(arr1: T[], arr2: T[]): T[] {
  const set = new Set(arr2);
  return arr1.filter(item => set.has(item));
}

/**
 * Get the difference of two arrays (items in arr1 not in arr2).
 */
export function difference<T>(arr1: T[], arr2: T[]): T[] {
  const set = new Set(arr2);
  return arr1.filter(item => !set.has(item));
}
