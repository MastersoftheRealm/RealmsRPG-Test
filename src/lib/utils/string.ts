/**
 * String Utilities
 * =================
 * Centralized string manipulation functions
 */

/**
 * Sanitize a string to create a valid HTML ID or CSS class name.
 */
export function sanitizeId(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string | null | undefined): string {
  if (!str) return '';
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

/**
 * Capitalize the first letter of each word in a string.
 */
export function capitalizeWords(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Truncate a string to a maximum length, adding ellipsis if truncated.
 */
export function truncate(
  str: string | null | undefined,
  maxLength: number,
  suffix: string = '...'
): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length).trim() + suffix;
}

/**
 * Convert a string to a URL-friendly slug.
 */
export function slugify(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Escape HTML special characters to prevent XSS.
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return String(str).replace(/[&<>"']/g, char => htmlEscapes[char] || char);
}

/**
 * Strip HTML tags from a string.
 */
export function stripHtml(str: string | null | undefined): string {
  if (!str) return '';
  return String(str).replace(/<[^>]*>/g, '');
}

/**
 * Check if a string is blank (empty or only whitespace).
 */
export function isBlank(str: string | null | undefined): boolean {
  return !str || String(str).trim().length === 0;
}

/**
 * Convert camelCase to kebab-case.
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case to camelCase.
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Pluralize a word based on count.
 */
export function pluralize(
  word: string,
  count: number,
  plural?: string
): string {
  if (count === 1) return word;
  return plural || word + 's';
}

/**
 * Format a count with its plural label.
 */
export function formatCount(count: number, singular: string, plural?: string): string {
  return `${count} ${pluralize(singular, count, plural)}`;
}
