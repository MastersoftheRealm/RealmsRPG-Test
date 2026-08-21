import type { ReactNode } from 'react';
import type { ColumnValue, ChipData } from '../list/grid-list-row-types';
import type { ListRowThumbnailProps } from '../list/list-row-thumbnail';
import type { MetadataDetailSection } from '@/lib/chip/list-row-metadata';
import type { PowerTechniqueFilterableRow } from '@/lib/library/power-technique-filters';
import type { AllowUndefinedOptionals } from '@/lib/utils/exact-optional';

/** Represents an item that can be selected in the modal */
interface SelectableItemFields {
  id: string;
  name: string;
  description?: string | undefined;
  /** Columns to display in the row */
  columns?: ColumnValue[] | undefined;
  /** Chips/tags to show when expanded */
  chips?: ChipData[] | undefined;
  /** Labeled chip sections (Type, Requirements, etc.); overrides chips when set */
  detailSections?: MetadataDetailSection[] | undefined;
  /** Total cost (TP, etc.) to show in expanded view */
  totalCost?: number | undefined;
  /** Cost label (e.g. "Training Points"; dense L3 columns may still use "TP") */
  costLabel?: string | undefined;
  /** Badges to display */
  badges?:
    | Array<{
        label: string;
        color?: 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red' | undefined;
      }>
    | undefined;
  /** Put badges on the name row (path chips while filtering) instead of the expanded slot. */
  showBadgesInName?: boolean | undefined;
  /** Whether this item is disabled (e.g., doesn't meet requirements) */
  disabled?: boolean | undefined;
  /** Warning message if disabled or has requirements */
  warningMessage?: string | undefined;
  /** List-row art for art-capable entities (powers, techniques, equipment, etc.). */
  thumbnail?: ListRowThumbnailProps | undefined;
  /** Any extra data attached to the item (e.g. raw Feat, Skill for onConfirm) */
  data?: unknown | undefined;
  /**
   * Power/technique advanced-filter row for `applyPowerTechniqueFilters` (USM).
   * Does not replace `data` — confirm mappers still read the raw library item from `data`.
   */
  powerTechniqueFilter?: PowerTechniqueFilterableRow | undefined;
  /**
   * Extra searchable text (tags, category, etc.) — include in `searchFields`
   * so search covers more than name/description (guided feats L2/L3 — TASK-684).
   */
  keywords?: string | undefined;
}

export type SelectableItem = AllowUndefinedOptionals<SelectableItemFields>;

/** Column header definition for sorting.
 * Data columns should be sortable (default true in ListHeader). Only set
 * `sortable: false` for spacer/action columns (empty label, `_actions`, thumbnails).
 */
interface ColumnHeaderFields {
  key: string;
  label: string;
  sortable?: boolean | undefined;
  align?: 'left' | 'center' | 'right' | undefined;
}

export type ColumnHeader = AllowUndefinedOptionals<ColumnHeaderFields>;

/** Filter option definition */
export interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'toggle';
  options?: Array<{ value: string; label: string }> | undefined;
}

interface UnifiedSelectionModalPropsFields {
  // Basic modal props
  isOpen: boolean;
  onClose: () => void;

  // Header
  title: string;
  description?: string | undefined;

  // Data
  items: SelectableItem[];
  isLoading?: boolean | undefined;

  // Selection behavior
  onConfirm: (selectedItems: SelectableItem[]) => void;
  maxSelections?: number | undefined;
  /**
   * When set with maxSelections: soft capacity — rows stay readable/selectable over the limit;
   * this message is shown and Add Selected is blocked until selection is within max.
   * Prefer this over greying out the whole list when budget is exhausted (maxSelections === 0).
   */
  selectionLimitMessage?: string | undefined;
  /**
   * Add-path only: replace default `prev ∪ {id}` with a caller-built id list (e.g. innate
   * energy last-in swap). Deselect still removes the id. Insertion order of the returned
   * array is preserved (Set).
   */
  nextSelectedIds?: ((currentIds: string[], id: string) => string[]) | undefined;
  initialSelectedIds?: Set<string> | undefined;
  /** Hide items that don't qualify instead of graying them out */
  hideDisabled?: boolean | undefined;

  // Display configuration
  columns?: ColumnHeader[] | undefined;
  gridColumns?: string | undefined;
  itemLabel?: string | undefined; // "feat", "skill", etc.
  emptyMessage?: string | undefined;
  emptySubMessage?: string | undefined;

  // Search
  searchPlaceholder?: string | undefined;
  searchFields?: (keyof SelectableItem)[] | undefined;

  /**
   * Always-visible primary chrome under Search (Powers vs Empowered, Armaments vs Equipment,
   * feat-source tabs, inventory type, sheet Add equipment custom-item form). Stays outside
   * the Filters disclosure (TASK-564 / TASK-815).
   */
  scopeExtra?: ReactNode | undefined;
  /**
   * Secondary chrome (SourceFilter, advanced filters).
   * Collapsed into the Filters panel with filterContent — not mode tabs or custom-add
   * (use scopeExtra).
   */
  headerExtra?: ReactNode | undefined;
  /** When set, only items passing this filter are shown in the list; selection and confirm still use the full items list so selections from other "tabs" are kept. */
  displayFilter?: ((item: SelectableItem) => boolean) | undefined;

  // Filters (optional) — collapsed by default with headerExtra in the same Filters panel
  filterContent?: ReactNode | undefined;
  showFilters?: boolean | undefined;
  /** Badge on the Filters toggle when collapsed (non-default filters / options in use). */
  optionsActiveCount?: number | undefined;
  /** One-line hint under the toolbar when Filters are collapsed (e.g. current source). */
  optionsSummary?: ReactNode | undefined;
  /** Filters toggle label (default "Filters"). */
  optionsLabel?: string | undefined;
  /** When the modal opens, start with Filters expanded (guided See more — TASK-753). */
  optionsDefaultExpanded?: boolean | undefined;

  // Quantity support (for equipment)
  showQuantity?: boolean | undefined;
  /** Seed quantities when the modal opens (keys = string item ids). */
  initialQuantities?: Record<string, number> | undefined;

  /** Optional extra content in footer (e.g. per-item options for selected items) */
  footerExtra?: ((selectedItems: SelectableItem[]) => ReactNode) | undefined;
  /** When tabs live in scopeExtra, wire list region to TabNavigation aria-controls (TASK-355) */
  tabPanelA11y?:
    | {
        tabGroupId: string;
        id: string;
        activeTab: string;
      }
    | undefined;
  /** Optional: disable the confirm button based on selected items (e.g. missing required choices) */
  confirmDisabled?: ((selectedItems: SelectableItem[]) => boolean) | undefined;
  /** Primary confirm button label (default: "Add Selected"). Use "Load" for creator load flows. */
  confirmLabel?: string | undefined;
  /** Optional error shown in the list region (e.g. load failures) */
  error?: Error | null | undefined;

  // Styling
  size?: 'md' | 'lg' | 'xl' | undefined;
  className?: string | undefined;
  /**
   * Flex column layout for sticky header/footer + scrollable list.
   * Defaults to true — selection list modals need this on mobile.
   */
  flexLayout?: boolean | undefined;
  /**
   * When set, replaces the default primary confirm button (e.g. dual “Add as species / ancestry”).
   * Cancel remains. Caller is responsible for closing the modal after actions.
   */
  primaryActions?: ReactNode | ((selectedItems: SelectableItem[]) => ReactNode) | undefined;
}

export type UnifiedSelectionModalProps = AllowUndefinedOptionals<UnifiedSelectionModalPropsFields>;
