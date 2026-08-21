/**
 * Find an item in a library by ID or name (case-insensitive)
 */
export function findInLibrary<T extends { id: string; name: string }>(
  library: T[],
  reference: string | { id?: string | number | undefined; name?: string | undefined },
): T | undefined {
  if (!library || library.length === 0) return undefined;

  // If reference is a string, treat as name
  if (typeof reference === 'string') {
    const searchName = reference.toLowerCase();
    return library.find(
      (item) => String(item.name ?? '').toLowerCase() === searchName || item.id === reference,
    );
  }

  // If reference is an object, try ID first, then name
  if (reference.id !== undefined) {
    const found = library.find((item) => item.id === String(reference.id));
    if (found) return found;
  }

  if (reference.name) {
    const searchName = String(reference.name ?? '').toLowerCase();
    return library.find((item) => String(item.name ?? '').toLowerCase() === searchName);
  }

  return undefined;
}
