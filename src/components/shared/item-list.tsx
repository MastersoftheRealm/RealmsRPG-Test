'use client';

/**
 * ItemList - Unified List Component with Filtering & Sorting
 * ==========================================================
 * Reusable list component for displaying arrays of game items
 * Supports view, select, and manage modes
 */

import { useState, useMemo, useCallback } from 'react';
import { Search, SortAsc, SortDesc, Filter, Grid, List, X } from 'lucide-react';
import { ItemCard } from './item-card';
import type { DisplayItem, ListMode, ItemActions, FilterOption, SortOption, FilterState, SortState } from '@/types/items';

interface ItemListProps {
  items: DisplayItem[];
  mode?: ListMode;
  actions?: ItemActions;
  
  // Layout
  layout?: 'list' | 'grid';
  columns?: 1 | 2 | 3 | 4;
  compact?: boolean;
  
  // Filtering & Sorting
  filterOptions?: FilterOption[];
  sortOptions?: SortOption[];
  defaultSort?: SortState;
  
  // Search
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFields?: string[];
  
  // Selection (for select mode)
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  maxSelections?: number;
  
  // UI
  showHeader?: boolean;
  showCount?: boolean;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

export function ItemList({
  items,
  mode = 'view',
  actions,
  layout = 'list',
  columns = 1,
  compact = false,
  filterOptions = [],
  sortOptions = [],
  defaultSort = { field: 'name', direction: 'asc' },
  searchable = true,
  searchPlaceholder = 'Search items...',
  searchFields = ['name', 'description', 'type', 'category'],
  selectedIds: externalSelectedIds,
  onSelectionChange,
  maxSelections,
  showHeader = true,
  showCount = true,
  emptyMessage = 'No items found',
  loading = false,
  className = '',
}: ItemListProps) {
  // Local state
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());
  const [filterState, setFilterState] = useState<FilterState>({ search: '' });
  const [sortState, setSortState] = useState<SortState>(defaultSort);
  const [currentLayout, setCurrentLayout] = useState(layout);
  const [showFilters, setShowFilters] = useState(false);
  
  // Use external selection if provided, otherwise internal
  const selectedIds = externalSelectedIds ?? internalSelectedIds;
  
  // Handle selection changes
  const handleSelect = useCallback((item: DisplayItem) => {
    const newSelected = new Set(selectedIds);
    
    if (maxSelections === 1) {
      // Single select mode
      newSelected.clear();
      newSelected.add(item.id);
    } else if (maxSelections && newSelected.size >= maxSelections) {
      // At max, don't add
      return;
    } else {
      newSelected.add(item.id);
    }
    
    if (onSelectionChange) {
      onSelectionChange(newSelected);
    } else {
      setInternalSelectedIds(newSelected);
    }
    actions?.onSelect?.(item);
  }, [selectedIds, maxSelections, onSelectionChange, actions]);
  
  const handleDeselect = useCallback((item: DisplayItem) => {
    const newSelected = new Set(selectedIds);
    newSelected.delete(item.id);
    
    if (onSelectionChange) {
      onSelectionChange(newSelected);
    } else {
      setInternalSelectedIds(newSelected);
    }
    actions?.onDeselect?.(item);
  }, [selectedIds, onSelectionChange, actions]);
  
  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search filter
      if (filterState.search) {
        const searchLower = filterState.search.toLowerCase();
        const matchesSearch = searchFields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchLower);
          }
          if (Array.isArray(value)) {
            return value.some(v => String(v).toLowerCase().includes(searchLower));
          }
          return false;
        });
        if (!matchesSearch) return false;
      }
      
      // Custom filters
      for (const filter of filterOptions) {
        const filterValue = filterState[filter.id];
        if (filterValue === undefined || filterValue === '' || (Array.isArray(filterValue) && filterValue.length === 0)) {
          continue;
        }
        
        const itemValue = item[filter.id];
        
        if (filter.type === 'select' || filter.type === 'text') {
          if (typeof filterValue === 'string' && filterValue !== '') {
            if (String(itemValue).toLowerCase() !== filterValue.toLowerCase()) {
              return false;
            }
          }
        } else if (filter.type === 'multiselect') {
          if (Array.isArray(filterValue) && filterValue.length > 0) {
            const itemVal = String(itemValue).toLowerCase();
            if (!filterValue.some(v => String(v).toLowerCase() === itemVal)) {
              return false;
            }
          }
        } else if (filter.type === 'checkbox') {
          if (filterValue === true && !itemValue) {
            return false;
          }
        }
      }
      
      return true;
    });
  }, [items, filterState, filterOptions, searchFields]);
  
  // Sort items
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const aValue = a[sortState.field];
      const bValue = b[sortState.field];
      
      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue ?? '').localeCompare(String(bValue ?? ''));
      }
      
      return sortState.direction === 'desc' ? -comparison : comparison;
    });
  }, [filteredItems, sortState]);
  
  // Enhance items with selection state
  const displayItems = useMemo(() => {
    return sortedItems.map(item => ({
      ...item,
      isSelected: selectedIds.has(item.id),
    }));
  }, [sortedItems, selectedIds]);
  
  // Toggle sort
  const toggleSort = (field: string) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilterState({ search: '' });
  };
  
  // Check if any filters are active
  const hasActiveFilters = filterState.search !== '' || 
    filterOptions.some(f => {
      const v = filterState[f.id];
      return v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0);
    });
  
  // Grid column classes
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with search, filters, sort */}
      {showHeader && (
        <div className="space-y-3">
          {/* Main controls row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            {searchable && (
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={filterState.search}
                  onChange={(e) => setFilterState(prev => ({ ...prev, search: e.target.value }))}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {filterState.search && (
                  <button
                    onClick={() => setFilterState(prev => ({ ...prev, search: '' }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            
            {/* Filter toggle */}
            {filterOptions.length > 0 && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  showFilters || hasActiveFilters
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            )}
            
            {/* Sort dropdown */}
            {sortOptions.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={sortState.field}
                  onChange={(e) => setSortState(prev => ({ ...prev, field: e.target.value }))}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.id} value={opt.field}>{opt.label}</option>
                  ))}
                </select>
                {(() => {
                  const currentSort = sortOptions.find(opt => opt.field === sortState.field);
                  const isString = currentSort?.type === 'string';
                  const isAsc = sortState.direction === 'asc';
                  
                  // Direction labels based on type
                  const ascLabel = isString ? 'A→Z' : '0→9';
                  const descLabel = isString ? 'Z→A' : '9→0';
                  
                  return (
                    <button
                      onClick={() => setSortState(prev => ({ 
                        ...prev, 
                        direction: prev.direction === 'asc' ? 'desc' : 'asc' 
                      }))}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                      title={`Click to sort ${isAsc ? descLabel : ascLabel}`}
                    >
                      {isAsc 
                        ? <SortAsc className="w-4 h-4" />
                        : <SortDesc className="w-4 h-4" />
                      }
                      <span className="font-medium">{isAsc ? ascLabel : descLabel}</span>
                    </button>
                  );
                })()}
              </div>
            )}
            
            {/* Layout toggle */}
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setCurrentLayout('list')}
                className={`p-2 transition-colors ${
                  currentLayout === 'list' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentLayout('grid')}
                className={`p-2 transition-colors ${
                  currentLayout === 'grid' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
            
            {/* Count */}
            {showCount && (
              <span className="text-sm text-muted-foreground ml-auto">
                {displayItems.length} item{displayItems.length !== 1 ? 's' : ''}
                {mode === 'select' && selectedIds.size > 0 && (
                  <> ({selectedIds.size} selected{maxSelections ? ` / ${maxSelections}` : ''})</>
                )}
              </span>
            )}
          </div>
          
          {/* Filter panel */}
          {showFilters && filterOptions.length > 0 && (
            <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg border border-border bg-muted/30">
              {filterOptions.map(filter => (
                <div key={filter.id} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {filter.label}
                  </label>
                  {filter.type === 'select' && filter.options && (
                    <select
                      value={(filterState[filter.id] as string) || ''}
                      onChange={(e) => setFilterState(prev => ({ 
                        ...prev, 
                        [filter.id]: e.target.value 
                      }))}
                      className="px-3 py-1.5 rounded border border-border bg-background text-sm min-w-[140px]"
                    >
                      <option value="">All</option>
                      {filter.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                  {filter.type === 'checkbox' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!filterState[filter.id]}
                        onChange={(e) => setFilterState(prev => ({ 
                          ...prev, 
                          [filter.id]: e.target.checked 
                        }))}
                        className="rounded border-border"
                      />
                      <span className="text-sm">{filter.placeholder || 'Yes'}</span>
                    </label>
                  )}
                </div>
              ))}
              
              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-destructive hover:text-destructive/80 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Empty state */}
      {!loading && displayItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
      
      {/* Item list/grid */}
      {!loading && displayItems.length > 0 && (
        <div className={
          currentLayout === 'grid' 
            ? `grid ${gridCols[columns]} gap-3`
            : 'space-y-2'
        }>
          {displayItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              mode={mode}
              compact={compact}
              actions={{
                ...actions,
                onSelect: handleSelect,
                onDeselect: handleDeselect,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ItemList;
