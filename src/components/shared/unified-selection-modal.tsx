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

import { useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal, Button, IconButton, Spinner } from '@/components/ui';
import { 
  GridListRow, 
  SearchInput, 
  SortHeader, 
  FilterSection,
  QuantitySelector,
  type ColumnValue,
  type ChipData,
} from '@/components/shared';
import { useSort } from '@/hooks/use-sort';

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
  /** Badges to display */
  badges?: Array<{ label: string; color?: 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red' }>;
  /** Whether this item is disabled (e.g., doesn't meet requirements) */
  disabled?: boolean;
  /** Warning message if disabled or has requirements */
  warningMessage?: string;
  /** Any extra data attached to the item */
  data?: unknown;
}

/** Column header definition for sorting */
export interface ColumnHeader {
  key: string;
  label: string;
  sortable?: boolean;
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
  
  // Filters (optional)
  filterContent?: ReactNode;
  showFilters?: boolean;
  
  // Quantity support (for equipment)
  showQuantity?: boolean;
  
  // Styling
  size?: 'md' | 'lg' | 'xl';
  className?: string;
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
  initialSelectedIds = new Set(),
  hideDisabled = false,
  columns = [],
  gridColumns,
  itemLabel = 'item',
  emptyMessage,
  emptySubMessage,
  searchPlaceholder,
  searchFields = ['name', 'description'],
  filterContent,
  showFilters = false,
  showQuantity = false,
  size = 'lg',
  className,
}: UnifiedSelectionModalProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { sortState, handleSort, sortItems } = useSort('name');
  
  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(initialSelectedIds));
      setQuantities({});
      setSearchQuery('');
    }
  }, [isOpen, initialSelectedIds]);
  
  // Filter items
  const filteredItems = useMemo(() => {
    let result = items;
    
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
    
    // Sort
    return sortItems(result);
  }, [items, searchQuery, searchFields, sortState, hideDisabled, sortItems]);
  
  // Toggle selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        // Remove quantity
        setQuantities(q => {
          const newQ = { ...q };
          delete newQ[id];
          return newQ;
        });
      } else {
        // Check max selections
        if (maxSelections && newSet.size >= maxSelections) {
          return prev;
        }
        newSet.add(id);
        // Initialize quantity for equipment
        if (showQuantity) {
          setQuantities(q => ({ ...q, [id]: 1 }));
        }
      }
      return newSet;
    });
  }, [maxSelections, showQuantity]);
  
  // Handle confirm
  const handleConfirm = () => {
    const selected = items.filter(item => selectedIds.has(item.id));
    // Attach quantities to items if needed
    if (showQuantity) {
      selected.forEach(item => {
        (item as SelectableItem & { quantity?: number }).quantity = quantities[item.id] || 1;
      });
    }
    onConfirm(selected);
    onClose();
  };
  
  
  const sizeClasses = {
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size} showCloseButton={false}>
      <div className={cn('flex flex-col h-[70vh]', className)}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary">{title}</h2>
            {description && (
              <p className="text-sm text-text-muted mt-1">{description}</p>
            )}
          </div>
          <IconButton variant="ghost" size="sm" onClick={onClose} label="Close">
            <X className="w-5 h-5" />
          </IconButton>
        </div>
        
        {/* Search */}
        <div className="mb-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={searchPlaceholder || `Search ${itemLabel}s...`}
          />
        </div>
        
        {/* Filters (optional) */}
        {showFilters && filterContent && (
          <FilterSection defaultExpanded={false}>
            {filterContent}
          </FilterSection>
        )}
        
        {/* Column Headers (if columns defined) — must match row grid for alignment */}
        {columns.length > 0 && (
          <div 
            className="hidden lg:grid gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/30 border-b border-border-light text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wider rounded-t-lg"
            style={gridColumns ? { gridTemplateColumns: `${gridColumns} 2.5rem` } : undefined}
          >
            {columns.map(col => (
              col.sortable !== false ? (
                <SortHeader
                  key={col.key}
                  label={col.label}
                  col={col.key}
                  sortState={sortState}
                  onSort={handleSort}
                />
              ) : (
                <span key={col.key}>{col.label}</span>
              )
            ))}
            <span className="text-center" aria-hidden="true">{'\u00A0'}</span>
          </div>
        )}
        
        {/* Items List */}
        <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 border border-border-light rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <p className="text-lg font-medium">
                {emptyMessage || `No ${itemLabel}s found`}
              </p>
              {emptySubMessage && (
                <p className="text-sm mt-1">{emptySubMessage}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2 p-2 min-w-0">
              {filteredItems.map(item => {
                const isSelected = selectedIds.has(item.id);
                
                return (
                  <div key={item.id} className="flex items-center gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <GridListRow
                        id={item.id}
                        name={item.name}
                        description={item.description}
                        columns={item.columns}
                        chips={item.chips}
                        badges={item.badges}
                        gridColumns={gridColumns ? `${gridColumns} 2.5rem` : undefined}
                        selectable
                        isSelected={isSelected}
                        onSelect={() => toggleSelection(item.id)}
                        disabled={item.disabled}
                        warningMessage={item.warningMessage}
                        compact
                      />
                    </div>
                    {/* Quantity selector for selected items */}
                    {showQuantity && isSelected && (
                      <div className="flex-shrink-0 px-2">
                        <QuantitySelector
                          quantity={quantities[item.id] || 1}
                          onChange={(qty) => setQuantities(q => ({ ...q, [item.id]: qty }))}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border-light mt-4">
          <span className="text-sm text-text-muted">
            {selectedIds.size} {itemLabel}{selectedIds.size !== 1 ? 's' : ''} selected
            {maxSelections && ` (max ${maxSelections})`}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
            >
              Add Selected {selectedIds.size > 0 && `(${selectedIds.size})`}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default UnifiedSelectionModal;
