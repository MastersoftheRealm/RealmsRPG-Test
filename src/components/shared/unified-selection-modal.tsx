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

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Alert, Modal } from '@/components/ui';
import { useSort } from '@/hooks/use-sort';
import { selectionDiffersFromInitial } from './unified-selection-modal-helpers';
import { UnifiedSelectionModalFooter } from './unified-selection-modal-footer';
import { UnifiedSelectionModalLeavePrompt } from './unified-selection-modal-leave-prompt';
import {
  UnifiedSelectionModalColumnHeaders,
  UnifiedSelectionModalList,
} from './unified-selection-modal-list';
import { UnifiedSelectionModalToolbar } from './unified-selection-modal-toolbar';
import type { SelectableItem, UnifiedSelectionModalProps } from './unified-selection-modal-types';

export type {
  SelectableItem,
  ColumnHeader,
  FilterOption,
  UnifiedSelectionModalProps,
} from './unified-selection-modal-types';

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
  nextSelectedIds,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const { sortState, handleSort, sortItems } = useSort('name');
  const [wasOpen, setWasOpen] = useState(false);
  const [openInitialIds, setOpenInitialIds] = useState<Set<string>>(() => new Set());
  const [openInitialQuantities, setOpenInitialQuantities] = useState<Record<string, number>>({});
  const hasThumbnailColumn = useMemo(
    () => items.some((item) => Boolean(item.thumbnail)),
    [items]
  );
  const hasOptions = Boolean(headerExtra) || Boolean(showFilters && filterContent);

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

  const filteredItems = useMemo(() => {
    let result = displayFilter ? items.filter(displayFilter) : items;

    if (hideDisabled) {
      result = result.filter(item => !item.disabled);
    }

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

    return sortItems(result);
  }, [items, displayFilter, searchQuery, searchFields, hideDisabled, sortItems]);

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
      } else if (nextSelectedIds) {
        const nextSet = new Set(nextSelectedIds([...prev], key));
        if (showQuantity) {
          setQuantities(q => {
            const nextQ: Record<string, number> = {};
            for (const idKey of nextSet) {
              nextQ[idKey] = q[idKey] ?? 1;
            }
            return nextQ;
          });
        }
        return nextSet;
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
  }, [showQuantity, maxSelections, nextSelectedIds]);

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

  const handleConfirm = useCallback(() => {
    if (overSelectionLimit) return;
    if (confirmDisabled?.(selectedItems)) return;
    const selected = selectedItems;
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

  const handleRequestClose = useCallback(() => {
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
  }, [selectedIds, openInitialIds, showQuantity, quantities, openInitialQuantities, onClose]);

  const handleDiscardAndClose = useCallback(() => {
    setLeaveConfirmOpen(false);
    onClose();
  }, [onClose]);

  const handleQuantityChange = useCallback(
    (itemIdStr: string, delta: number, isSelected: boolean) => {
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
    },
    [quantities, maxSelections]
  );

  const isLoadConfirm = /load/i.test(confirmLabel);
  const leavePromptTitle = isLoadConfirm ? 'Load selected?' : 'Add selected?';
  const discardLabel = isLoadConfirm ? "Don't load" : "Don't add";
  const leavePromptDescription = primaryActions
    ? `You have ${selectedIds.size} ${itemLabel}${selectedIds.size !== 1 ? 's' : ''} selected. Leave without adding them?`
    : `You have ${selectedIds.size} ${itemLabel}${selectedIds.size !== 1 ? 's' : ''} selected. ${
        isLoadConfirm ? 'Load them before leaving?' : 'Add them before leaving?'
      }`;

  const resolvedSearchPlaceholder = searchPlaceholder || `Search ${itemLabel}s...`;
  const resolvedEmptyMessage = emptyMessage || `No ${itemLabel}s found`;

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
          'flex flex-col flex-1 min-h-0 gap-2 overflow-hidden px-4 pt-4 pb-0 md:gap-3 md:px-6 md:pt-6 md:pb-0 md:max-h-[70vh]',
          className
        )}
        footer={
          <UnifiedSelectionModalFooter
            selectedItems={selectedItems}
            selectedCount={selectedIds.size}
            itemLabel={itemLabel}
            maxSelections={maxSelections}
            footerExtra={footerExtra}
            onRequestClose={handleRequestClose}
            onConfirm={handleConfirm}
            isConfirmDisabled={isConfirmDisabled}
            confirmLabel={confirmLabel}
            primaryActions={primaryActions}
          />
        }
      >
        <UnifiedSelectionModalToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={resolvedSearchPlaceholder}
          hasOptions={hasOptions}
          optionsLabel={optionsLabel}
          optionsExpanded={optionsExpanded}
          onOptionsExpandedChange={setOptionsExpanded}
          optionsActiveCount={optionsActiveCount}
          optionsSummary={optionsSummary}
          scopeExtra={scopeExtra}
          headerExtra={headerExtra}
          showFilters={showFilters}
          filterContent={filterContent}
        />

        {limitWarningText ? (
          <Alert variant="warning" className="shrink-0">
            {limitWarningText}
          </Alert>
        ) : null}

        <UnifiedSelectionModalColumnHeaders
          columns={columns}
          gridColumns={gridColumns}
          hasThumbnailColumn={hasThumbnailColumn}
          sortState={sortState}
          onSort={handleSort}
          showQuantity={showQuantity}
        />

        <UnifiedSelectionModalList
          isLoading={isLoading}
          error={error}
          filteredItems={filteredItems}
          emptyMessage={resolvedEmptyMessage}
          emptySubMessage={emptySubMessage}
          gridColumns={gridColumns}
          selectedIds={selectedIds}
          quantities={quantities}
          showQuantity={showQuantity}
          onToggleSelection={toggleSelection}
          onQuantityChange={handleQuantityChange}
          tabPanelA11y={tabPanelA11y}
        />
      </Modal>

      <UnifiedSelectionModalLeavePrompt
        isOpen={isOpen && leaveConfirmOpen}
        onClose={() => setLeaveConfirmOpen(false)}
        title={primaryActions ? 'Leave without adding?' : leavePromptTitle}
        description={leavePromptDescription}
        discardLabel={discardLabel}
        showConfirm={!primaryActions}
        onConfirm={handleConfirm}
        isConfirmDisabled={isConfirmDisabled}
        confirmLabel={confirmLabel}
        selectedCount={selectedIds.size}
        onDiscard={handleDiscardAndClose}
      />
    </>
  );
}
