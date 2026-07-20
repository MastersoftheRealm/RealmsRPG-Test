'use client';

/**
 * UnifiedSelectionModal - One Modal to Rule Them All
 * ===================================================
 * A configurable selection modal that works for ANY selection scenario:
 * - Adding skills, feats, powers, techniques, equipment, etc.
 * - Used in character sheet, character creator, creature creator
 * - Consistent UI patterns: search, filters, GridListRow list, footer
 * 
 * Design Principles:
 * - Same as Codex/Library patterns for familiarity
 * - GridListRow for all list items
 * - Unified search, filter, sort patterns
 * - Flexible column/chip configuration per item type
 */

import { useState, useMemo, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Alert, Modal, Button } from '@/components/ui';
import { TabContentPanel } from '@/components/ui/tab-navigation';
import { 
  GridListRow, 
  SearchInput, 
  ListHeader,
  gridColumnsWithInlineSelection,
  FilterSection,
  ListEmptyState as EmptyState,
  LoadingState,
  type ColumnValue,
  type ChipData,
  type ListRowThumbnailProps,
} from '@/components/shared';
import { useSort } from '@/hooks/use-sort';

/** True when current selection/quantities differ from the modal’s open seed (TASK-574). */
function selectionDiffersFromInitial(
  selectedIds: Set<string>,
  initialIds: Set<string>,
  showQuantity: boolean,
  quantities: Record<string, number>,
  initialQuantities: Record<string, number>
): boolean {
  if (selectedIds.size === 0) return false;
  if (selectedIds.size !== initialIds.size) return true;
  for (const id of selectedIds) {
    if (!initialIds.has(id)) return true;
  }
  if (!showQuantity) return false;
  for (const id of selectedIds) {
    const current = quantities[id] ?? 1;
    const seeded =
      initialQuantities[id] ??
      initialQuantities[id.toLowerCase()] ??
      1;
    const normalizedSeed = Math.max(1, Math.floor(Number(seeded)) || 1);
    if (current !== normalizedSeed) return true;
  }
  return false;
}

// =============================================================================
// Types
// =============================================================================

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
  detailSections?: Array<{ label: string; chips: ChipData[]; hideLabelIfSingle?: boolean }>;
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

// =============================================================================
// Component
// =============================================================================

export function UnifiedSelectionModal({
  isOpen,
  onClose,
  title,
  description,
  items,
  isLoading = false,
  onConfirm,
  maxSelections,
  selectionLimitMessage,
  initialSelectedIds = new Set(),
  hideDisabled = false,
  columns = [],
  gridColumns,
  itemLabel = 'item',
  emptyMessage,
  emptySubMessage,
  searchPlaceholder,
  searchFields = ['name', 'description'],
  scopeExtra,
  headerExtra,
  displayFilter,
  filterContent,
  showFilters = false,
  optionsActiveCount = 0,
  optionsSummary,
  optionsLabel = 'Filters',
  showQuantity = false,
  initialQuantities = {},
  footerExtra,
  confirmDisabled,
  confirmLabel = 'Add Selected',
  error = null,
  tabPanelA11y,
  size = 'lg',
  className,
  flexLayout = true,
  primaryActions,
}: UnifiedSelectionModalProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  /** Prompt when dismissing with unconfirmed picks (TASK-574). */
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const { sortState, handleSort, sortItems } = useSort('name');
  const [wasOpen, setWasOpen] = useState(false);
  /** Snapshot of seed selection at open — stable for dirty checks (avoids new Set() each render). */
  const [openInitialIds, setOpenInitialIds] = useState<Set<string>>(() => new Set());
  const [openInitialQuantities, setOpenInitialQuantities] = useState<Record<string, number>>({});
  const hasThumbnailColumn = useMemo(
    () => items.some((item) => Boolean(item.thumbnail)),
    [items]
  );
  // Filters disclosure = secondary only; primary mode tabs use scopeExtra (always visible).
  const hasOptions = Boolean(headerExtra) || Boolean(showFilters && filterContent);

  // Reset only when modal first opens (render-time adjust — TASK-430). Do not depend on
  // initialSelectedIds identity: callers often pass `new Set()` each render.
  if (isOpen && !wasOpen) {
    const ids = new Set([...initialSelectedIds].map((id) => String(id)));
    setOpenInitialIds(ids);
    setSelectedIds(ids);
    if (showQuantity) {
      const next: Record<string, number> = {};
      for (const id of ids) {
        const seeded =
          initialQuantities[id] ??
          initialQuantities[id.toLowerCase()] ??
          1;
        next[id] = Math.max(1, Math.floor(Number(seeded)) || 1);
      }
      setOpenInitialQuantities(next);
      setQuantities(next);
    } else {
      setOpenInitialQuantities({});
      setQuantities({});
    }
    setSearchQuery('');
    setOptionsExpanded(false);
    setLeaveConfirmOpen(false);
    setWasOpen(true);
  } else if (!isOpen && wasOpen) {
    setLeaveConfirmOpen(false);
    setWasOpen(false);
  }
  
  // Filter items for display (displayFilter e.g. by source tab; selection still uses full items)
  const filteredItems = useMemo(() => {
    let result = displayFilter ? items.filter(displayFilter) : items;
    
    // Hide disabled items if configured
    if (hideDisabled) {
      result = result.filter(item => !item.disabled);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => {
        for (const field of searchFields) {
          const value = item[field];
          if (typeof value === 'string' && value.toLowerCase().includes(query)) {
            return true;
          }
        }
        return false;
      });
    }
    
    // Sort (sortItems already closes over sortState from useSort)
    return sortItems(result);
  }, [items, displayFilter, searchQuery, searchFields, hideDisabled, sortItems]);
  
  // Toggle selection — normalize id to string so selection works when codex returns number ids.
  // Soft capacity (maxSelections > 1 or 0): allow selecting past max; confirm blocked + warning.
  // Single-select (maxSelections === 1): replace selection like radio (creator Load flows).
  const toggleSelection = useCallback((id: string | number) => {
    const key = String(id);
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
        setQuantities(q => {
          const newQ = { ...q };
          delete newQ[key];
          return newQ;
        });
      } else if (maxSelections === 1) {
        setQuantities(showQuantity ? { [key]: 1 } : {});
        return new Set([key]);
      } else {
        newSet.add(key);
        if (showQuantity) {
          setQuantities(q => ({ ...q, [key]: 1 }));
        }
      }
      return newSet;
    });
  }, [showQuantity, maxSelections]);
  
  // Selected items (for footerExtra and confirmDisabled)
  const selectedItems = useMemo(
    () => items.filter(item => selectedIds.has(String(item.id))),
    [items, selectedIds]
  );

  const overSelectionLimit =
    maxSelections !== undefined && selectedIds.size > maxSelections;
  const showSelectionLimitWarning =
    maxSelections !== undefined &&
    (maxSelections === 0 || overSelectionLimit);
  const limitWarningText = showSelectionLimitWarning
    ? selectionLimitMessage ??
      (maxSelections === 0
        ? 'You cannot add more right now. Free up capacity first, then try again.'
        : `You've selected more than the limit (max ${maxSelections}). Deselect some to continue.`)
    : undefined;

  // Handle confirm — match by string id so codex number ids work
  const handleConfirm = useCallback(() => {
    if (overSelectionLimit) return;
    if (confirmDisabled?.(selectedItems)) return;
    const selected = selectedItems;
    // Attach quantities to items if needed
    if (showQuantity) {
      selected.forEach(item => {
        (item as SelectableItem & { quantity?: number }).quantity = quantities[String(item.id)] || 1;
      });
    }
    setLeaveConfirmOpen(false);
    onConfirm(selected);
    onClose();
  }, [
    overSelectionLimit,
    confirmDisabled,
    selectedItems,
    showQuantity,
    quantities,
    onConfirm,
    onClose,
  ]);

  const isConfirmDisabled =
    selectedIds.size === 0 ||
    overSelectionLimit ||
    (confirmDisabled?.(selectedItems) ?? false);

  /** Intercept Cancel / X / backdrop / Escape when picks would be lost (TASK-574). */
  const handleRequestClose = useCallback(() => {
    // Nested leave-confirm is open — ignore parent dismiss (Escape hits both listeners).
    if (leaveConfirmOpen) return;
    const hasUnconfirmedSelection = selectionDiffersFromInitial(
      selectedIds,
      openInitialIds,
      showQuantity,
      quantities,
      openInitialQuantities
    );
    if (hasUnconfirmedSelection) {
      setLeaveConfirmOpen(true);
      return;
    }
    onClose();
  }, [leaveConfirmOpen, selectedIds, openInitialIds, showQuantity, quantities, openInitialQuantities, onClose]);

  const handleDiscardAndClose = useCallback(() => {
    setLeaveConfirmOpen(false);
    onClose();
  }, [onClose]);

  const isLoadConfirm = /load/i.test(confirmLabel);
  const leavePromptTitle = isLoadConfirm ? 'Load selected?' : 'Add selected?';
  const discardLabel = isLoadConfirm ? "Don't load" : "Don't add";
  const leavePromptDescription = primaryActions
    ? `You have ${selectedIds.size} ${itemLabel}${selectedIds.size !== 1 ? 's' : ''} selected. Leave without adding them?`
    : `You have ${selectedIds.size} ${itemLabel}${selectedIds.size !== 1 ? 's' : ''} selected. ${
        isLoadConfirm ? 'Load them before leaving?' : 'Add them before leaving?'
      }`;

  const searchField = (
    <SearchInput
      value={searchQuery}
      onChange={setSearchQuery}
      placeholder={searchPlaceholder || `Search ${itemLabel}s...`}
      aria-label={searchPlaceholder || `Search ${itemLabel}s`}
    />
  );
  
  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={handleRequestClose}
      title={title}
      description={description}
      size={size}
      fullScreenOnMobile
      flexLayout={flexLayout}
      contentClassName={cn(
        // overflow-hidden: Modal skips its default overflow-y-auto; only the list region scrolls
        // so the footer (Add Selected) stays pinned on mobile. See MOBILE_UX.md.
        // Tighter gap keeps chrome compact so the list is the dominant region (TASK-564).
        // pb-0: avoid a blank strip between the list and the sticky footer (TASK-574).
        'flex flex-col flex-1 min-h-0 gap-2 overflow-hidden px-4 pt-4 pb-0 md:gap-3 md:px-6 md:pt-6 md:pb-0 md:max-h-[70vh]',
        className
      )}
      footer={
        <div className="flex flex-col gap-3 border-t border-border-light bg-surface px-4 py-3 md:px-6">
          {footerExtra?.(selectedItems)}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-text-muted dark:text-text-secondary">
              {selectedIds.size} {itemLabel}{selectedIds.size !== 1 ? 's' : ''} selected
              {maxSelections !== undefined && maxSelections !== 1 && ` (max ${maxSelections})`}
            </span>
            {/* [&_button]: cover confirmLabel and primaryActions (species trait dual-add, etc.) */}
            <div className="flex gap-2 w-full sm:w-auto [&_button]:min-h-11 [&_button]:flex-1 sm:[&_button]:flex-initial">
              <Button variant="secondary" onClick={handleRequestClose}>
                Cancel
              </Button>
              {primaryActions ? (
                typeof primaryActions === 'function' ? (
                  primaryActions(selectedItems)
                ) : (
                  primaryActions
                )
              ) : (
                <Button onClick={handleConfirm} disabled={isConfirmDisabled}>
                  {confirmLabel}
                  {selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                </Button>
              )}
            </div>
          </div>
        </div>
      }
    >
      {/* DESIGN_INTENT (TASK-564): List-first — Search (+ Filters) on one row; primary mode
          tabs (scopeExtra) always visible under search; SourceFilter / advanced filters collapse. */}
      <div className="shrink-0">
        {hasOptions ? (
          <FilterSection
            variant="compact"
            label={optionsLabel}
            expanded={optionsExpanded}
            onExpandedChange={setOptionsExpanded}
            activeCount={optionsActiveCount}
            summary={optionsSummary}
            toolbarStart={searchField}
            belowToolbar={scopeExtra}
          >
            {headerExtra}
            {showFilters && filterContent ? filterContent : null}
          </FilterSection>
        ) : (
          <div className="space-y-2">
            {searchField}
            {scopeExtra ? <div className="shrink-0">{scopeExtra}</div> : null}
          </div>
        )}
      </div>

      {limitWarningText ? (
        <Alert variant="warning" className="shrink-0">
          {limitWarningText}
        </Alert>
      ) : null}

      {/* Column Headers (if columns defined) — must match row grid for alignment */}
      {columns.length > 0 ? (
        <div className="shrink-0">
          <ListHeader
            columns={columns.map(col => ({
              key: col.key,
              label: col.label,
              sortable: col.sortable !== false,
              align: col.align,
            }))}
            gridColumns={gridColumns}
            sortState={sortState}
            onSort={handleSort}
            hasSelectionColumn
            hasThumbnailColumn={hasThumbnailColumn}
            compact
          />
        </div>
      ) : null}

      {/* Items List — only this region scrolls; footer stays pinned via Modal footer slot */}
      {(() => {
        const listBody = (
          <>
            {isLoading ? (
              <LoadingState message="Loading..." size="md" padding="md" />
            ) : error ? (
              <Alert variant="danger" className="mx-4">
                {error.message}
              </Alert>
            ) : filteredItems.length === 0 ? (
              <EmptyState
                title={emptyMessage || `No ${itemLabel}s found`}
                description={emptySubMessage}
                size="sm"
              />
            ) : (
              <div className="space-y-1 min-w-0">
                {filteredItems.map(item => {
                  const itemIdStr = String(item.id);
                  const isSelected = selectedIds.has(itemIdStr);
                  // Only item.disabled greys a row — never capacity/maxSelections
                  // (budget-exhausted lists stay readable for browsing).
                  const isSelectionDisabled = Boolean(item.disabled);
                  const qty = showQuantity
                    ? quantities[itemIdStr] ?? (isSelected ? 1 : 0)
                    : undefined;

                  return (
                    <div key={itemIdStr} className="min-w-0">
                      <GridListRow
                        id={itemIdStr}
                        name={item.name}
                        description={item.description}
                        thumbnail={item.thumbnail}
                        columns={item.columns}
                        chips={item.chips}
                        detailSections={item.detailSections}
                        totalCost={item.totalCost}
                        costLabel={item.costLabel}
                        badges={item.badges}
                        gridColumns={
                          gridColumns ? gridColumnsWithInlineSelection(gridColumns) : undefined
                        }
                        selectable
                        isSelected={isSelected}
                        onSelect={() => toggleSelection(item.id)}
                        disabled={isSelectionDisabled}
                        warningMessage={item.warningMessage}
                        compact
                        quantity={qty}
                        quantityMin={showQuantity ? 0 : 1}
                        quantityDecrementLabel={
                          showQuantity
                            ? `Decrease quantity for ${item.name}`
                            : undefined
                        }
                        quantityIncrementLabel={
                          showQuantity
                            ? `Increase quantity for ${item.name}`
                            : undefined
                        }
                        onQuantityChange={
                          showQuantity && !isSelectionDisabled
                            ? (delta) => {
                                const current = quantities[itemIdStr] ?? (isSelected ? 1 : 0);
                                const next = Math.max(0, Math.min(99, current + delta));
                                if (next <= 0) {
                                  setSelectedIds((prev) => {
                                    const nextSet = new Set(prev);
                                    nextSet.delete(itemIdStr);
                                    return nextSet;
                                  });
                                  setQuantities((q) => {
                                    const nextQ = { ...q };
                                    delete nextQ[itemIdStr];
                                    return nextQ;
                                  });
                                  return;
                                }
                                if (maxSelections === 1) {
                                  setSelectedIds(new Set([itemIdStr]));
                                  setQuantities({ [itemIdStr]: next });
                                  return;
                                }
                                setQuantities((q) => ({ ...q, [itemIdStr]: next }));
                                setSelectedIds((prev) => {
                                  if (prev.has(itemIdStr)) return prev;
                                  const nextSet = new Set(prev);
                                  nextSet.add(itemIdStr);
                                  return nextSet;
                                });
                              }
                            : undefined
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        );

        const listRegion = tabPanelA11y ? (
          <TabContentPanel
            tabGroupId={tabPanelA11y.tabGroupId}
            id={tabPanelA11y.id}
            activeTab={tabPanelA11y.activeTab}
            className="flex-1 overflow-y-auto overflow-x-auto min-h-0"
          >
            {listBody}
          </TabContentPanel>
        ) : (
          <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">{listBody}</div>
        );

        return listRegion;
      })()}
    </Modal>

    {/* Leave with unconfirmed picks — Add selected? (TASK-574) */}
    <Modal
      isOpen={isOpen && leaveConfirmOpen}
      onClose={() => setLeaveConfirmOpen(false)}
      title={primaryActions ? 'Leave without adding?' : leavePromptTitle}
      description={leavePromptDescription}
      size="sm"
      showCloseButton
    >
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          variant="secondary"
          onClick={handleDiscardAndClose}
          className="min-h-11 w-full sm:w-auto"
        >
          {discardLabel}
        </Button>
        {!primaryActions ? (
          <Button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="min-h-11 w-full sm:w-auto"
          >
            {confirmLabel}
            {selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
          </Button>
        ) : null}
      </div>
    </Modal>
    </>
  );
}

export default UnifiedSelectionModal;
