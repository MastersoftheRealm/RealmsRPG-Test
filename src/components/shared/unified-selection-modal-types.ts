import type { ReactNode } from 'react';
import type { ColumnValue, ChipData } from './grid-list-row-types';
import type { ListRowThumbnailProps } from './list-row-thumbnail';
import type { MetadataDetailSection } from '@/lib/chip/list-row-metadata';
import type { PowerTechniqueFilterableRow } from '@/lib/library/power-technique-filters';

/** Represents an item that can be selected in the modal */
export interface SelectableItem {
  id: string;
  name: string;
  description?: string;
  /** Columns to display in the row */
  columns?: ColumnValue[];
  /** Chips/tags to show when expanded */
  chips?: ChipData[];
  /** Labeled chip sections (Type, Requirements, etc.); overrides chips when set */
  detailSections?: MetadataDetailSection[];
  /** Total cost (TP, etc.) to show in expanded view */
  totalCost?: number;
  /** Cost label (e.g. "Training Points"; dense L3 columns may still use "TP") */
  costLabel?: string;
  /** Badges to display */
  badges?: Array<{ label: string; color?: 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red' }>;
  /** Whether this item is disabled (e.g., doesn't meet requirements) */
  disabled?: boolean;
  /** Warning message if disabled or has requirements */
  warningMessage?: string;
  /** List-row art for art-capable entities (powers, techniques, equipment, etc.). */
  thumbnail?: ListRowThumbnailProps;
  /** Any extra data attached to the item (e.g. raw Feat, Skill for onConfirm) */
  data?: unknown;
  /**
   * Power/technique advanced-filter row for `applyPowerTechniqueFilters` (USM).
   * Does not replace `data` — confirm mappers still read the raw library item from `data`.
   */
  powerTechniqueFilter?: PowerTechniqueFilterableRow;
  /**
   * Extra searchable text (tags, category, etc.) — include in `searchFields`
   * so search covers more than name/description (guided feats L2/L3 — TASK-684).
   */
  keywords?: string;
}

/** Column header definition for sorting.
 * Data columns should be sortable (default true in ListHeader). Only set
 * `sortable: false` for spacer/action columns (empty label, `_actions`, thumbnails).
 */
export interface ColumnHeader {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

/** Filter option definition */
export interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'toggle';
  options?: Array<{ value: string; label: string }>;
}

export interface UnifiedSelectionModalProps {
  // Basic modal props
  isOpen: boolean;
  onClose: () => void;

  // Header
  title: string;
  description?: string;

  // Data
  items: SelectableItem[];
  isLoading?: boolean;

  // Selection behavior
  onConfirm: (selectedItems: SelectableItem[]) => void;
  maxSelections?: number;
  /**
   * When set with maxSelections: soft capacity — rows stay readable/selectable over the limit;
   * this message is shown and Add Selected is blocked until selection is within max.
   * Prefer this over greying out the whole list when budget is exhausted (maxSelections === 0).
   */
  selectionLimitMessage?: string;
  /**
   * Add-path only: replace default `prev ∪ {id}` with a caller-built id list (e.g. innate
   * energy last-in swap). Deselect still removes the id. Insertion order of the returned
   * array is preserved (Set).
   */
  nextSelectedIds?: (currentIds: string[], id: string) => string[];
  initialSelectedIds?: Set<string>;
  /** Hide items that don't qualify instead of graying them out */
  hideDisabled?: boolean;

  // Display configuration
  columns?: ColumnHeader[];
  gridColumns?: string;
  itemLabel?: string; // "feat", "skill", etc.
  emptyMessage?: string;
  emptySubMessage?: string;

  // Search
  searchPlaceholder?: string;
  searchFields?: (keyof SelectableItem)[];

  /**
   * Always-visible primary mode/scope chrome (Powers vs Empowered, Armaments vs Equipment,
   * feat-source tabs, inventory type). Stays outside the Filters disclosure so users can
   * switch catalog identity without opening Filters (TASK-564).
   */
  scopeExtra?: ReactNode;
  /**
   * Secondary chrome (SourceFilter, advanced filters, custom-add forms).
   * Collapsed into the Filters panel with filterContent — not mode tabs (use scopeExtra).
   */
  headerExtra?: ReactNode;
  /** When set, only items passing this filter are shown in the list; selection and confirm still use the full items list so selections from other "tabs" are kept. */
  displayFilter?: (item: SelectableItem) => boolean;

  // Filters (optional) — collapsed by default with headerExtra in the same Filters panel
  filterContent?: ReactNode;
  showFilters?: boolean;
  /** Badge on the Filters toggle when collapsed (non-default filters / options in use). */
  optionsActiveCount?: number;
  /** One-line hint under the toolbar when Filters are collapsed (e.g. current source). */
  optionsSummary?: ReactNode;
  /** Filters toggle label (default "Filters"). */
  optionsLabel?: string;

  // Quantity support (for equipment)
  showQuantity?: boolean;
  /** Seed quantities when the modal opens (keys = string item ids). */
  initialQuantities?: Record<string, number>;

  /** Optional extra content in footer (e.g. per-item options for selected items) */
  footerExtra?: (selectedItems: SelectableItem[]) => ReactNode;
  /** When tabs live in scopeExtra, wire list region to TabNavigation aria-controls (TASK-355) */
  tabPanelA11y?: {
    tabGroupId: string;
    id: string;
    activeTab: string;
  };
  /** Optional: disable the confirm button based on selected items (e.g. missing required choices) */
  confirmDisabled?: (selectedItems: SelectableItem[]) => boolean;
  /** Primary confirm button label (default: "Add Selected"). Use "Load" for creator load flows. */
  confirmLabel?: string;
  /** Optional error shown in the list region (e.g. load failures) */
  error?: Error | null;

  // Styling
  size?: 'md' | 'lg' | 'xl';
  className?: string;
  /**
   * Flex column layout for sticky header/footer + scrollable list.
   * Defaults to true — selection list modals need this on mobile.
   */
  flexLayout?: boolean;
  /**
   * When set, replaces the default primary confirm button (e.g. dual “Add as species / ancestry”).
   * Cancel remains. Caller is responsible for closing the modal after actions.
   */
  primaryActions?: ReactNode | ((selectedItems: SelectableItem[]) => ReactNode);
}
