'use client';

/**
 * GridListRow - Unified Expandable List Row Component
 * =====================================================
 * A single source of truth for ALL expandable list rows across the site:
 * - Library page (powers, techniques, armaments, creatures)
 * - Codex page (feats, skills, species, equipment, properties, parts)
 * - Character sheet modals (add feat, add power, add technique, add item)
 * - Creator pages (power/technique/item part selection)
 * 
 * Design principles:
 * - Consistent visual patterns across the entire site
 * - Grid-aligned columns match headers
 * - Flexible expanded content via render prop or default slots
 * - Selection mode for modals
 * - Action buttons for editable content
 * - Accessible and responsive
 */

import { useState, ReactNode } from 'react';
import { ChevronDown, Edit, Trash2, Copy, Zap, Check, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

export interface ColumnValue {
  /** Column key (for mobile labels and accessibility) */
  key: string;
  /** Display value */
  value: string | number | ReactNode;
  /** Optional highlight styling (primary color) */
  highlight?: boolean;
  /** Custom className for styling */
  className?: string;
  /** Hide on mobile */
  hideOnMobile?: boolean;
}

export interface ChipData {
  /** Chip label/name */
  name: string;
  /** Description (shown when chip is expanded) */
  description?: string;
  /** Cost value (TP, IP, etc.) */
  cost?: number;
  /** Cost label (default: 'TP') */
  costLabel?: string;
  /** Optional level indicator */
  level?: number;
  /** Chip category for styling */
  category?: 'default' | 'cost' | 'tag' | 'warning' | 'success' | 'archetype' | 'skill';
}

export interface GridListRowProps {
  /** Unique item ID */
  id: string;
  /** Display name (first column) */
  name: string;
  /** Item description (shown in default expanded view) */
  description?: string;
  /** Column values to display in collapsed row */
  columns?: ColumnValue[];
  /** Grid template columns CSS (must match headers) */
  gridColumns?: string;
  
  // ===== Expanded Content Options =====
  /** Chips to show in expanded view (parts, properties, tags, etc.) */
  chips?: ChipData[];
  /** Label for chips section */
  chipsLabel?: string;
  /** Total cost (TP, etc.) to display */
  totalCost?: number;
  /** Cost label */
  costLabel?: string;
  /** Custom badges/tags to show */
  badges?: Array<{ label: string; color?: 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red' }>;
  /** Requirements or additional info */
  requirements?: ReactNode;
  /** Custom expanded content (replaces default slots) */
  expandedContent?: ReactNode;
  
  // ===== Selection Mode (for modals) =====
  /** Enable selection mode */
  selectable?: boolean;
  /** Is currently selected */
  isSelected?: boolean;
  /** Selection callback */
  onSelect?: () => void;
  /** Disable selection */
  disabled?: boolean;
  /** Warning message (shown when disabled or for requirements) */
  warningMessage?: string;
  
  // ===== Action Buttons (for editable content) =====
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  
  // ===== UI Options =====
  /** Start expanded */
  defaultExpanded?: boolean;
  /** Control expanded state externally */
  expanded?: boolean;
  /** Callback when expand state changes */
  onExpandChange?: (expanded: boolean) => void;
  /** Compact mode (smaller padding) */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Badge Color Map
// =============================================================================

const BADGE_COLORS = {
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-800',
  gray: 'bg-gray-100 text-gray-700',
  red: 'bg-red-100 text-red-700',
};

const CHIP_STYLES = {
  default: 'bg-primary-50 border-primary-200 text-primary-700 hover:bg-primary-100',
  cost: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100',
  tag: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
  warning: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
  archetype: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
  skill: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
};

// =============================================================================
// Component
// =============================================================================

export function GridListRow({
  id,
  name,
  description,
  columns = [],
  gridColumns,
  chips = [],
  chipsLabel = 'Details',
  totalCost,
  costLabel = 'TP',
  badges = [],
  requirements,
  expandedContent,
  selectable = false,
  isSelected = false,
  onSelect,
  disabled = false,
  warningMessage,
  onEdit,
  onDelete,
  onDuplicate,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onExpandChange,
  compact = false,
  className,
}: GridListRowProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const [expandedChipIndex, setExpandedChipIndex] = useState<number | null>(null);
  
  // Support both controlled and uncontrolled expansion
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  
  const setExpanded = (value: boolean) => {
    if (controlledExpanded === undefined) {
      setInternalExpanded(value);
    }
    onExpandChange?.(value);
  };
  
  const hasDetails = description || chips.length > 0 || badges.length > 0 || requirements || expandedContent;
  const showActions = onEdit || onDelete || onDuplicate;
  const showExpander = hasDetails || showActions;
  
  const handleChipClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedChipIndex(expandedChipIndex === index ? null : index);
  };
  
  const handleRowClick = () => {
    if (selectable && !disabled && onSelect) {
      onSelect();
    } else if (showExpander) {
      setExpanded(!isExpanded);
    }
  };

  // Determine row styling based on state
  const rowStyles = cn(
    'bg-white transition-all',
    isSelected && 'bg-primary-50 border-l-4 border-l-primary-500',
    disabled && 'opacity-50',
    className
  );

  // Build grid style
  const gridStyle = gridColumns 
    ? { display: 'grid', gridTemplateColumns: gridColumns, gap: '0.5rem', alignItems: 'center' }
    : {};
    
  const useFlex = !gridColumns;

  return (
    <div className={rowStyles}>
      {/* Main Row */}
      <div className="flex">
        {/* Selection Button (for modals) */}
        {selectable && (
          <button
            onClick={(e) => { e.stopPropagation(); if (!disabled) onSelect?.(); }}
            disabled={disabled}
            className={cn(
              'w-10 flex-shrink-0 flex items-center justify-center border-r transition-colors',
              isSelected 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-50 text-gray-400 hover:bg-gray-100',
              disabled && 'cursor-not-allowed'
            )}
            aria-label={isSelected ? 'Deselect' : 'Select'}
          >
            {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        )}
        
        {/* Clickable Row Content */}
        <button
          onClick={handleRowClick}
          disabled={disabled && !showExpander}
          className={cn(
            'flex-1 text-left transition-colors',
            showExpander && 'hover:bg-gray-50',
            compact ? 'px-3 py-2' : 'px-4 py-3',
            disabled && 'cursor-default'
          )}
          style={gridStyle}
        >
          {/* Name column */}
          <div className={cn(
            'font-medium text-gray-900 truncate',
            useFlex && 'flex-1'
          )}>
            {name}
            {/* Inline badges for compact view */}
            {compact && badges.length > 0 && (
              <span className="ml-2 inline-flex gap-1">
                {badges.slice(0, 2).map((badge, i) => (
                  <span 
                    key={i} 
                    className={cn(
                      'px-1.5 py-0.5 rounded text-xs',
                      BADGE_COLORS[badge.color || 'gray']
                    )}
                  >
                    {badge.label}
                  </span>
                ))}
              </span>
            )}
          </div>
          
          {/* Data columns */}
          {columns.map((col) => (
            <div 
              key={col.key} 
              className={cn(
                'text-sm truncate',
                col.hideOnMobile !== false && 'hidden lg:block',
                col.highlight ? 'text-primary-600 font-medium' : 'text-gray-600',
                col.className
              )}
            >
              {col.value ?? '-'}
            </div>
          ))}
          
          {/* Flex mode: show key stats inline */}
          {useFlex && columns.length > 0 && (
            <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
              {columns.slice(0, 3).map((col) => (
                <span key={col.key} className="whitespace-nowrap">
                  <span className="text-gray-400">{col.key}:</span>{' '}
                  <span className={cn(col.highlight && 'text-primary-600 font-medium', col.className)}>
                    {col.value ?? '-'}
                  </span>
                </span>
              ))}
            </div>
          )}
          
          {/* Warning indicator */}
          {warningMessage && (
            <div className="flex items-center text-amber-500" title={warningMessage}>
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
          
          {/* Expand icon */}
          {showExpander && (
            <div className={cn('flex items-center justify-end', useFlex && 'ml-2')}>
              <ChevronDown 
                className={cn(
                  'w-4 h-4 text-gray-400 transition-transform',
                  isExpanded && 'rotate-180'
                )} 
              />
            </div>
          )}
        </button>
      </div>

      {/* Mobile summary row (only when grid mode with columns) */}
      {gridColumns && columns.length > 0 && (
        <div className="lg:hidden px-4 pb-2 flex flex-wrap gap-2 text-xs text-gray-600">
          {columns.slice(0, 3).map((col) => (
            col.value && (
              <span key={col.key} className="flex items-center gap-1">
                <span className="text-gray-400">{col.key}:</span>
                <span className={cn(col.highlight && 'text-primary-600 font-medium')}>
                  {col.value}
                </span>
              </span>
            )
          ))}
        </div>
      )}
      
      {/* Expanded Content */}
      {isExpanded && hasDetails && (
        <div className={cn(
          'border-t border-gray-100 bg-gray-50',
          compact ? 'px-3 pb-3 pt-2' : 'px-4 pb-4 pt-2',
          selectable && 'ml-10' // Indent when selection button present
        )}>
          {/* Custom expanded content takes precedence */}
          {expandedContent ? (
            expandedContent
          ) : (
            <>
              {/* Description */}
              {description && (
                <p className="text-gray-700 text-sm mb-4 p-3 bg-gray-100 rounded-lg">
                  {description}
                </p>
              )}
              
              {/* Warning message */}
              {warningMessage && (
                <p className="text-xs text-amber-600 mb-3 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {warningMessage}
                </p>
              )}
              
              {/* Badges */}
              {badges.length > 0 && !compact && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {badges.map((badge, i) => (
                    <span 
                      key={i}
                      className={cn(
                        'px-2 py-1 rounded text-sm',
                        BADGE_COLORS[badge.color || 'gray']
                      )}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              )}

              {/* All stats on mobile */}
              {gridColumns && columns.length > 0 && (
                <div className="lg:hidden grid grid-cols-2 gap-2 mb-4 text-sm">
                  {columns.map((col) => (
                    <div key={col.key} className="flex items-center gap-2">
                      <span className="text-gray-500 capitalize">{col.key}:</span>
                      <span className={cn('font-medium text-gray-900', col.highlight && 'text-primary-600')}>
                        {col.value ?? '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total Cost */}
              {totalCost !== undefined && totalCost > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                    <Zap className="w-4 h-4" />
                    Total {costLabel}: {totalCost}
                  </span>
                </div>
              )}
              
              {/* Requirements */}
              {requirements && (
                <div className="mb-4 text-sm">
                  {requirements}
                </div>
              )}

              {/* Chips Section */}
              {chips.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {chipsLabel}
                  </h4>

                  {/* Chips */}
                  <div className="flex flex-wrap gap-2">
                    {chips.map((chip, index) => {
                      const hasCost = (chip.cost ?? 0) > 0;
                      const isChipExpanded = expandedChipIndex === index;
                      const category = chip.category || (hasCost ? 'cost' : 'default');
                      
                      return (
                        <button
                          key={index}
                          onClick={(e) => handleChipClick(index, e)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                            'border cursor-pointer',
                            CHIP_STYLES[category],
                            isChipExpanded && 'ring-2 ring-offset-1 ring-current'
                          )}
                        >
                          <span>{chip.name}</span>
                          {chip.level && chip.level > 1 && (
                            <span className="text-xs opacity-75">(Lv.{chip.level})</span>
                          )}
                          {hasCost && (
                            <>
                              <span className="opacity-40">|</span>
                              <span className="text-xs font-semibold">{chip.costLabel || costLabel}: {chip.cost}</span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Expanded Chip Details */}
                  {expandedChipIndex !== null && chips[expandedChipIndex] && (
                    <div className="mt-2 p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h5 className="font-semibold text-gray-900">{chips[expandedChipIndex].name}</h5>
                        {(chips[expandedChipIndex].cost ?? 0) > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            <Zap className="w-3 h-3" />
                            {chips[expandedChipIndex].cost} {chips[expandedChipIndex].costLabel || costLabel}
                          </span>
                        )}
                      </div>
                      {chips[expandedChipIndex].description && (
                        <p className="text-sm text-gray-600">{chips[expandedChipIndex].description}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {showActions && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                  {onEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  {onDuplicate && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default GridListRow;
