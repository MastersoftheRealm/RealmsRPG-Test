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

// Filter/Sort types
export interface FilterOption {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'checkbox' | 'range';
  options?: { value: string; label: string }[] | undefined;
  placeholder?: string | undefined;
}

export interface SortOption {
  id: string;
  label: string;
  field: string;
  type: 'string' | 'number';
}

export interface FilterState {
  search: string;
  [key: string]: string | string[] | boolean | number | [number, number] | undefined;
}

export interface ItemSortState {
  field: string;
  direction: 'asc' | 'desc';
}

// Item category types
export type ItemCategory =
  | 'power'
  | 'technique'
  | 'weapon'
  | 'armor'
  | 'equipment'
  | 'feat'
  | 'property'
  | 'part'
  | 'species'
  | 'trait'
  | 'skill'
  | 'creature';

// Transformation function type
export type ItemTransformer<T> = (item: T, context?: TransformContext) => DisplayItem;

export interface TransformContext {
  // Reference data needed for calculations
  parts?: Record<string, unknown>[] | undefined;
  properties?: Record<string, unknown>[] | undefined;

  // Character context for requirement checking
  characterLevel?: number | undefined;
  characterAbilities?: Record<string, number> | undefined;
  characterSkills?: Record<string, number> | undefined;

  // Selection context
  selectedIds?: Set<string> | undefined;
  maxSelections?: number | undefined;
  currentSelectionCount?: number | undefined;
}

// List mode types
export type ListMode =
  | 'view' // Read-only display (Codex, character sheet view mode)
  | 'select' // Select items (Character creator, adding items)
  | 'manage'; // Edit/delete items (Library, character sheet edit mode)

// Action callbacks
export interface ItemActions {
  onSelect?: ((item: DisplayItem) => void) | undefined;
  onDeselect?: ((item: DisplayItem) => void) | undefined;
  onEdit?: ((item: DisplayItem) => void) | undefined;
  onDelete?: ((item: DisplayItem) => void) | undefined;
  onView?: ((item: DisplayItem) => void) | undefined;
  onDuplicate?: ((item: DisplayItem) => void) | undefined;
}
