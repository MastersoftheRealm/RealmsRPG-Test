/**
 * Unified Item Types
 * ==================
 * Shared types for all game items (powers, techniques, equipment, feats, etc.)
 * Used across Codex, Library, Character Creator, and Character Sheet
 */

// Base item interface that all game items share
export interface BaseGameItem {
  id: string;
  name: string;
  description?: string | undefined;
}

// Display-ready item for unified rendering
export interface DisplayItem extends BaseGameItem {
  // Allow dynamic field access for filtering/sorting
  [key: string]: unknown;

  // Core display fields
  subtitle?: string | undefined;
  category?: string | undefined;
  type?: string | undefined;

  // Cost/value fields
  cost?: number | string | undefined;
  costLabel?: string | undefined;
  secondaryCost?: number | string | undefined;
  secondaryCostLabel?: string | undefined;

  // Tags and badges
  tags?: string[] | undefined;
  badges?: ItemBadge[] | undefined;

  // Stats for quick display
  stats?: ItemStat[] | undefined;

  // Extended details for expanded view
  details?: ItemDetail[] | undefined;

  // Requirements
  requirements?: ItemRequirement[] | undefined;

  // Selection state (for use in selectors)
  isSelected?: boolean | undefined;
  isDisabled?: boolean | undefined;
  disabledReason?: string | undefined;

  // Source data for editing/saving (creature creator stores typed payloads)
  sourceData?: unknown | undefined;
}

export interface ItemBadge {
  label: string;
  variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export interface ItemStat {
  label: string;
  value: string | number;
  icon?: string | undefined;
}

export interface ItemDetail {
  label: string;
  value: string | number | string[];
}

export interface ItemRequirement {
  type: 'ability' | 'skill' | 'level' | 'feat' | 'other';
  name: string;
  value?: number | undefined;
  met: boolean;
}
