/**
 * RealmsRPG Shared Utilities - String Functions
 * ==============================================
 * Centralized string manipulation functions used across the site.
 */

/**
 * Sanitize a string to create a valid HTML ID or CSS class name.
 * Converts to lowercase, replaces spaces with hyphens, removes special characters.
 * 
 * @param {string} str - The string to sanitize
 * @returns {string} A sanitized string safe for use as an ID
 * 
 * @example
 * sanitizeId('Fire Ball') // returns 'fire-ball'
 * sanitizeId('Power (Level 3)') // returns 'power-level-3'
 */
export function sanitizeId(str) {
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
 * 
 * @param {string} str - The string to capitalize
 * @returns {string} The string with the first letter capitalized
 * 
 * @example
 * capitalize('hello') // returns 'Hello'
 * capitalize('WORLD') // returns 'WORLD' (only affects first letter)
 */
export function capitalize(str) {
    if (!str) return '';
    return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

/**
 * Capitalize the first letter of each word in a string.
 * 
 * @param {string} str - The string to title case
 * @returns {string} The string with each word capitalized
 * 
 * @example
 * capitalizeWords('fire damage') // returns 'Fire Damage'
 * capitalizeWords('COLD damage') // returns 'Cold Damage' (lowercases first)
 */
export function capitalizeWords(str) {
    if (!str) return '';
    return String(str)
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Alias for capitalizeWords - specifically for damage type formatting.
 * 
 * @param {string} str - The damage type string
 * @returns {string} The formatted damage type
 */
export function capitalizeDamageType(str) {
    return capitalizeWords(str);
}

/**
 * Truncate a string to a maximum length, adding ellipsis if truncated.
 * 
 * @param {string} str - The string to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @param {string} [suffix='...'] - Suffix to add when truncated
 * @returns {string} The truncated string
 * 
 * @example
 * truncate('Hello World', 8) // returns 'Hello...'
 */
export function truncate(str, maxLength, suffix = '...') {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - suffix.length).trim() + suffix;
}

/**
 * Convert a string to a URL-friendly slug.
 * 
 * @param {string} str - The string to slugify
 * @returns {string} A URL-friendly slug
 * 
 * @example
 * slugify('Hello World!') // returns 'hello-world'
 */
export function slugify(str) {
    if (!str) return '';
    return String(str)
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Escape HTML special characters to prevent XSS.
 * 
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 * 
 * @example
 * escapeHtml('<script>alert("xss")</script>') // returns '&lt;script&gt;...'
 */
export function escapeHtml(str) {
    if (!str) return '';
    const htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return String(str).replace(/[&<>"']/g, char => htmlEscapes[char]);
}

/**
 * Remove HTML tags from a string.
 * 
 * @param {string} str - The string containing HTML
 * @returns {string} The string without HTML tags
 * 
 * @example
 * stripHtml('<p>Hello <b>World</b></p>') // returns 'Hello World'
 */
export function stripHtml(str) {
    if (!str) return '';
    return String(str).replace(/<[^>]*>/g, '');
}

/**
 * Check if a string is empty or only contains whitespace.
 * 
 * @param {string} str - The string to check
 * @returns {boolean} True if the string is empty or whitespace only
 */
export function isBlank(str) {
    return !str || String(str).trim().length === 0;
}

/**
 * Convert camelCase to kebab-case.
 * 
 * @param {string} str - The camelCase string
 * @returns {string} The kebab-case string
 * 
 * @example
 * camelToKebab('backgroundColor') // returns 'background-color'
 */
export function camelToKebab(str) {
    if (!str) return '';
    return String(str).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case to camelCase.
 * 
 * @param {string} str - The kebab-case string
 * @returns {string} The camelCase string
 * 
 * @example
 * kebabToCamel('background-color') // returns 'backgroundColor'
 */
export function kebabToCamel(str) {
    if (!str) return '';
    return String(str).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Pluralize a word based on count.
 * 
 * @param {number} count - The count to check
 * @param {string} singular - The singular form
 * @param {string} [plural] - The plural form (defaults to singular + 's')
 * @returns {string} The appropriate form based on count
 * 
 * @example
 * pluralize(1, 'item') // returns 'item'
 * pluralize(2, 'item') // returns 'items'
 * pluralize(2, 'child', 'children') // returns 'children'
 */
export function pluralize(count, singular, plural) {
    if (count === 1) return singular;
    return plural || singular + 's';
}

/**
 * Format a count with its label (e.g., "3 items").
 * 
 * @param {number} count - The count
 * @param {string} singular - The singular label
 * @param {string} [plural] - The plural label
 * @returns {string} Formatted count string
 * 
 * @example
 * formatCount(3, 'point') // returns '3 points'
 */
export function formatCount(count, singular, plural) {
    return `${count} ${pluralize(count, singular, plural)}`;
}
