/**
 * Codex Spreadsheet — cell/value helpers (TASK-617)
 */

export function cellValueToString(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

export function isFiniteNumberString(str: string): boolean {
  if (!str.trim()) return false;
  const n = Number(str);
  return Number.isFinite(n);
}

export function stringToCellValue(str: string, original: unknown): unknown {
  const trimmed = str.trim();
  if (trimmed === '') return undefined;
  if (typeof original === 'number') {
    const n = parseFloat(trimmed);
    return isNaN(n) ? original : n;
  }
  if (typeof original === 'boolean') {
    const lower = trimmed.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    return original;
  }
  if (Array.isArray(original) || (typeof original === 'object' && original !== null)) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

/** Next available numeric ID: max(existing numeric ids) + 1, or "1" if none. */
export function generateNextNumericId(existingIds: Set<string>): string {
  const nums = [...existingIds]
    .map((s) => parseInt(s, 10))
    .filter((n) => !Number.isNaN(n) && n >= 0);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return String(next);
}

export function rowDataWithoutId(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).filter(([key]) => key !== 'id'));
}
