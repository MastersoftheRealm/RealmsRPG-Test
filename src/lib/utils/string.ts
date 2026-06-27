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
  return String(str).charAt(0).toUpperCase() + String(str).slice(1).toLowerCase();
}

/**
 * Capitalize each word (e.g. "slashing" → "Slashing", "fire" → "Fire").
 */
export function capitalizeWords(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format codex/list column keys for UI display when no explicit `label` is set.
 * Prefers curated labels for known schema keys; otherwise title-cases the key.
 */
const COLUMN_KEY_LABELS: Record<string, string> = {
  uses_per_rec: 'Uses',
  rec_period: 'Recovery',
  uses_per_rec_per_tier: 'Uses / Tier',
  lvl_req: 'Req. Level',
  feat_lvl: 'Feat Level',
  category: 'Category',
  ability: 'Ability',
  attack: 'Attack',
  damage: 'Damage',
  range: 'Range',
  type: 'Type',
  rarity: 'Rarity',
  pow_abil_req: 'Power Ability',
  mart_abil_req: 'Martial Ability',
  pow_prof_req: 'Power Prof.',
  mart_prof_req: 'Martial Prof.',
  speed_req: 'Speed',
  req_desc: 'Requirements',
  abil_req_val: 'Ability Req.',
  skill_req: 'Skill Req.',
  skill_req_val: 'Skill Req. Value',
  feat_cat_req: 'Feat Category',
};

export function formatColumnKeyLabel(key: string): string {
  if (!key) return '';
  const trimmed = key.trim();
  const override = COLUMN_KEY_LABELS[trimmed.toLowerCase()];
  if (override) return override;
  if (trimmed.includes(' ') && !trimmed.includes('_')) {
    return formatListCellLabel(trimmed);
  }
  return formatListCellLabel(trimmed.replace(/_/g, ' '));
}

/**
 * Format taxonomy / enum-style labels for collapsed list cells (item type, category, size, rarity, creature type, etc.).
 * - Title-cases whitespace-separated words (after replacing `_` with spaces).
 * - Hyphenated compounds (no spaces): each segment is title-cased (e.g. `powered-martial` → `Powered-Martial`).
 * - Preserves 2–3 letter ALL-CAPS tokens (e.g. recovery abbreviations).
 * - Numbers pass through as string; empty → `'-'`.
 */
export function formatListCellLabel(value: unknown): string {
  if (value == null || value === '') return '-';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  const s = String(value).trim();
  if (!s) return '-';
  if (s === '-') return '-';
  if (/^[A-Z]{2,3}$/.test(s)) return s;
  const underscored = s.replace(/_/g, ' ');
  if (underscored.includes('-') && !/\s/.test(underscored)) {
    return underscored
      .split('-')
      .map((part) => capitalize(part.trim()))
      .filter(Boolean)
      .join('-');
  }
  return capitalizeWords(underscored);
}

/**
 * Safely format a damage value for display.
 * Handles both string damage values and damage objects.
 * Prevents React Error #31 (objects as children).
 */
export function formatDamageDisplay(
  damage: unknown
): string {
  // Already a string — capitalize damage type (e.g. "2d6 slashing" → "2d6 Slashing")
  if (typeof damage === 'string') {
    const trimmed = damage.trim();
    const lastSpace = trimmed.lastIndexOf(' ');
    if (lastSpace > 0) {
      const dice = trimmed.slice(0, lastSpace);
      const typePart = trimmed.slice(lastSpace + 1);
      return `${dice} ${capitalize(typePart)}`;
    }
    return trimmed;
  }
  
  // Null/undefined
  if (damage == null) return '';
  
  // Single damage object: { amount, size, type }
  if (typeof damage === 'object' && !Array.isArray(damage)) {
    const d = damage as Record<string, unknown>;
    if (d.amount && d.size) {
      const typeStr = d.type && d.type !== 'none' ? ` ${capitalize(String(d.type))}` : '';
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
          const typeStr = d.type && d.type !== 'none' ? ` ${capitalize(String(d.type))}` : '';
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
 * Normalize range display for consistent spacing and casing across list/detail/library views (TASK-290).
 * Trims, collapses multiple spaces to one, and standardizes "Spaces"/"Space" to lowercase.
 */
export function normalizeRangeDisplay(range: string | number | null | undefined): string {
  if (range == null) return '';
  const s = String(range).trim().replace(/\s+/g, ' ');
  if (!s) return '';
  return s.replace(/\bSpaces\b/g, 'spaces').replace(/\bSpace\b/g, 'space');
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
