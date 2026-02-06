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
  description?: string;
}

// Display-ready item for unified rendering
export interface DisplayItem extends BaseGameItem {
  // Allow dynamic field access for filtering/sorting
  [key: string]: unknown;
  
  // Core display fields
  subtitle?: string;
  category?: string;
  type?: string;
  
  // Cost/value fields
  cost?: number | string;
  costLabel?: string;
  secondaryCost?: number | string;
  secondaryCostLabel?: string;
  
  // Tags and badges
  tags?: string[];
  badges?: ItemBadge[];
  
  // Stats for quick display
  stats?: ItemStat[];
  
  // Extended details for expanded view
  details?: ItemDetail[];
  
  // Requirements
  requirements?: ItemRequirement[];
  
  // Selection state (for use in selectors)
  isSelected?: boolean;
  isDisabled?: boolean;
  disabledReason?: string;
  
  // Source data for editing/saving
  sourceData?: Record<string, unknown>;
}

export interface ItemBadge {
  label: string;
  variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export interface ItemStat {
  label: string;
  value: string | number;
  icon?: string;
}

export interface ItemDetail {
  label: string;
  value: string | number | string[];
}

export interface ItemRequirement {
  type: 'ability' | 'skill' | 'level' | 'feat' | 'other';
  name: string;
  value?: number;
  met: boolean;
}

// Filter/Sort types
export interface FilterOption {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'checkbox' | 'range';
  options?: { value: string; label: string }[];
  placeholder?: string;
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
  parts?: Record<string, unknown>[];
  properties?: Record<string, unknown>[];
  
  // Character context for requirement checking
  characterLevel?: number;
  characterAbilities?: Record<string, number>;
  characterSkills?: Record<string, number>;
  
  // Selection context
  selectedIds?: Set<string>;
  maxSelections?: number;
  currentSelectionCount?: number;
}

// List mode types
export type ListMode = 
  | 'view'       // Read-only display (Codex, character sheet view mode)
  | 'select'     // Select items (Character creator, adding items)
  | 'manage';    // Edit/delete items (Library, character sheet edit mode)

// Action callbacks
export interface ItemActions {
  onSelect?: (item: DisplayItem) => void;
  onDeselect?: (item: DisplayItem) => void;
  onEdit?: (item: DisplayItem) => void;
  onDelete?: (item: DisplayItem) => void;
  onView?: (item: DisplayItem) => void;
  onDuplicate?: (item: DisplayItem) => void;
}
