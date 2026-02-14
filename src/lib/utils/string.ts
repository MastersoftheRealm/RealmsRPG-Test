/**
 * String Utilities
 * =================
 * Centralized string manipulation functions
 */

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string | null | undefined): string {
  if (!str) return '';
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

/**
 * Safely format a damage value for display.
 * Handles both string damage values and damage objects.
 * Prevents React Error #31 (objects as children).
 */
export function formatDamageDisplay(
  damage: unknown
): string {
  // Already a string
  if (typeof damage === 'string') return damage;
  
  // Null/undefined
  if (damage == null) return '';
  
  // Single damage object: { amount, size, type }
  if (typeof damage === 'object' && !Array.isArray(damage)) {
    const d = damage as Record<string, unknown>;
    if (d.amount && d.size) {
      const typeStr = d.type && d.type !== 'none' ? ` ${d.type}` : '';
      return `${d.amount}d${d.size}${typeStr}`;
    }
    return '';
  }
  
  // Array of damage objects
  if (Array.isArray(damage)) {
    const formatted = damage
      .filter((d): d is Record<string, unknown> => d && typeof d === 'object')
      .map(d => {
        if (d.amount && d.size) {
          const typeStr = d.type && d.type !== 'none' ? ` ${d.type}` : '';
          return `${d.amount}d${d.size}${typeStr}`;
        }
        return '';
      })
      .filter(Boolean);
    return formatted.join(', ');
  }
  
  return '';
}

/**
 * Format feat ability (sorting) for list display: "Strength, Intelligence" etc.
 * Handles array, comma-separated string, or concatenated names (e.g. "StrengthIntelligence" → "Strength, Intelligence").
 */
export function formatAbilityList(ability: string | string[] | null | undefined): string {
  if (ability == null || ability === '') return '-';
  if (Array.isArray(ability)) return ability.filter(Boolean).join(', ') || '-';
  const s = String(ability).trim();
  if (!s) return '-';
  if (s.includes(',')) return s.split(',').map((a: string) => a.trim()).filter(Boolean).join(', ');
  return s.replace(/([a-z])([A-Z])/g, '$1, $2');
}
