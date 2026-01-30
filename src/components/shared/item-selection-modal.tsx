'use client';

/**
 * ItemSelectionModal - Modal for Selecting Items
 * ==============================================
 * Used in Character Creator and Character Sheet for selecting
 * powers, techniques, equipment, feats, etc.
 */

import { useState, useEffect, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import { ItemList } from './item-list';
import { IconButton, Button } from '@/components/ui';
import type { DisplayItem, FilterOption, SortOption } from '@/types/items';

interface ItemSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedItems: DisplayItem[]) => void;
  
  // Items to select from
  items: DisplayItem[];
  
  // Selection config
  title: string;
  description?: string;
  maxSelections?: number;
  initialSelectedIds?: Set<string>;
  
  // List config
  filterOptions?: FilterOption[];
  sortOptions?: SortOption[];
  searchPlaceholder?: string;
  
  // Validation
  validateSelection?: (selected: DisplayItem[]) => { valid: boolean; message?: string };
  
  // Loading
  loading?: boolean;
}

export function ItemSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  items,
  title,
  description,
  maxSelections,
  initialSelectedIds = new Set(),
  filterOptions = [],
  sortOptions = [],
  searchPlaceholder,
  validateSelection,
  loading = false,
}: ItemSelectionModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(initialSelectedIds);
  const [validationError, setValidationError] = useState<string>();
  
  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(initialSelectedIds));
      setValidationError(undefined);
    }
  }, [isOpen, initialSelectedIds]);
  
  // Get selected items
  const getSelectedItems = useCallback(() => {
    return items.filter(item => selectedIds.has(item.id));
  }, [items, selectedIds]);
  
  // Handle confirmation
  const handleConfirm = () => {
    const selected = getSelectedItems();
    
    if (validateSelection) {
      const result = validateSelection(selected);
      if (!result.valid) {
        setValidationError(result.message);
        return;
      }
    }
    
    onConfirm(selected);
    onClose();
  };
  
  // Handle selection change
  const handleSelectionChange = (newIds: Set<string>) => {
    setSelectedIds(newIds);
    setValidationError(undefined);
  };
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const selectedCount = selectedIds.size;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] m-4 flex flex-col bg-surface rounded-xl shadow-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-4 border-b border-border">
          <div>
            <h2 id="modal-title" className="text-xl font-semibold text-text-primary">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-text-muted mt-1">{description}</p>
            )}
          </div>
          <IconButton
            label="Close modal"
            variant="ghost"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </IconButton>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <ItemList
            items={items}
            mode="select"
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
            maxSelections={maxSelections}
            filterOptions={filterOptions}
            sortOptions={sortOptions}
            searchPlaceholder={searchPlaceholder}
            loading={loading}
            emptyMessage="No items available"
          />
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between gap-4 p-4 border-t border-border bg-surface-alt">
          {/* Selection count */}
          <div className="text-sm text-text-muted">
            {selectedCount} selected
            {maxSelections && ` / ${maxSelections} max`}
          </div>
          
          {/* Validation error */}
          {validationError && (
            <div className="text-sm text-danger-600">{validationError}</div>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={selectedCount === 0}
            >
              <Check className="w-4 h-4" />
              Confirm Selection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemSelectionModal;
