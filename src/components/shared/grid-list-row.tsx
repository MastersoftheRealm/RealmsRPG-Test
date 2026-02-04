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
 * - Selection mode for modals (using SelectionToggle for + → ✓ UX)
 * - Action buttons for editable content
 * - Accessible and responsive
 */

import { useState, ReactNode } from 'react';
import { Edit, Trash2, Copy, Zap, Check, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { SelectionToggle } from './selection-toggle';
import { QuantitySelector, QuantityBadge } from './quantity-selector';

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
  
  // ===== Character Sheet Slots (Phase 1 Unification) =====
  /** Left slot content (e.g., innate toggle, equip checkbox) - renders before name */
  leftSlot?: ReactNode;
  /** Right slot content (e.g., use button, roll buttons) - renders after columns */
  rightSlot?: ReactNode;
  /** Visual state: item is equipped (green border/bg styling) */
  equipped?: boolean;
  /** Visual state: item is innate (purple styling) */
  innate?: boolean;
  /** Uses tracking for feats with limited uses */
  uses?: { current: number; max: number };
  /** Quantity for stackable items (equipment, consumables) */
  quantity?: number;
  /** Callback when quantity changes (enables +/- controls) */
  onQuantityChange?: (delta: number) => void;
  
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
// Badge Color Map (using design tokens)
// =============================================================================

const BADGE_COLORS = {
  blue: 'bg-info-100 text-info-700',
  purple: 'bg-power-light text-power-text',
  green: 'bg-success-100 text-success-700',
  amber: 'bg-tp-light text-tp-text',
  gray: 'bg-surface-alt text-text-secondary',
  red: 'bg-danger-100 text-danger-700',
};

const CHIP_STYLES = {
  default: 'bg-primary-50 border-primary-200 text-primary-700 hover:bg-primary-100',
  cost: 'bg-tp-light border-tp-border text-tp-text hover:bg-tp-light/80',
  tag: 'bg-success-50 border-success-200 text-success-700 hover:bg-success-100',
  warning: 'bg-danger-50 border-danger-200 text-danger-700 hover:bg-danger-100',
  success: 'bg-success-50 border-success-200 text-success-700 hover:bg-success-100',
  archetype: 'bg-power-light border-power-border text-power-text hover:bg-power-light/80',
  skill: 'bg-info-50 border-info-200 text-info-700 hover:bg-info-100',
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
  // Character sheet slots (Phase 1 Unification)
  leftSlot,
  rightSlot,
  equipped = false,
  innate = false,
  uses,
  quantity,
  onQuantityChange,
  // UI options
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
    // Row click always toggles expansion, selection is handled by SelectionToggle button
    if (showExpander) {
      setExpanded(!isExpanded);
    }
  };

  // Determine row styling based on state
  const rowStyles = cn(
    'bg-surface transition-all rounded-lg border overflow-hidden',
    // Selection state
    isSelected && 'bg-primary-50 border-l-4 border-l-primary-500',
    // Equipped state (green styling)
    equipped && !isSelected && 'border-green-300 bg-green-50',
    // Innate state (purple styling)
    innate && !isSelected && !equipped && 'border-violet-300 bg-violet-50',
    // Default border
    !isSelected && !equipped && !innate && 'border-border-light',
    // Disabled state
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
      <div className="flex items-center">
        {/* Left Slot - renders before clickable content (e.g., equip toggle, innate toggle) */}
        {leftSlot && (
          <div className="flex-shrink-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {leftSlot}
          </div>
        )}
        
        {/* Clickable Row Content */}
        <button
          onClick={handleRowClick}
          disabled={disabled && !showExpander}
          className={cn(
            'flex-1 text-left transition-colors',
            showExpander && 'hover:bg-surface-alt',
            compact ? 'px-3 py-2' : 'px-4 py-3',
            disabled && 'cursor-default'
          )}
          style={gridStyle}
        >
          {/* Name column with optional state indicators */}
          <div className={cn(
            'font-medium text-text-primary truncate flex items-center gap-2',
            useFlex && 'flex-1'
          )}>
            <span className="truncate">{name}</span>
            {/* Equipped indicator */}
            {equipped && (
              <span className="text-green-600 flex-shrink-0">✓</span>
            )}
            {/* Innate indicator */}
            {innate && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-violet-200 text-violet-600 flex-shrink-0">★</span>
            )}
            {/* Uses display */}
            {uses && (
              <span className="text-xs text-text-muted flex-shrink-0">
                ({uses.current}/{uses.max})
              </span>
            )}
            {/* Quantity display - editable if onQuantityChange provided */}
            {quantity !== undefined && quantity > 0 && (
              onQuantityChange ? (
                <QuantitySelector
                  quantity={quantity}
                  onChange={(val) => onQuantityChange(val - quantity)}
                  size="sm"
                  min={1}
                />
              ) : (
                <QuantityBadge quantity={quantity} className="flex-shrink-0" />
              )
            )}
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
                col.highlight ? 'text-primary-600 font-medium' : 'text-text-secondary',
                col.className
              )}
            >
              {col.value ?? '-'}
            </div>
          ))}
          
          {/* Flex mode: show key stats inline */}
          {useFlex && columns.length > 0 && (
            <div className="hidden md:flex items-center gap-4 text-sm text-text-secondary">
              {columns.slice(0, 3).map((col) => (
                <span key={col.key} className="whitespace-nowrap">
                  <span className="text-text-muted">{col.key}:</span>{' '}
                  <span className={cn(col.highlight && 'text-primary-600 font-medium', col.className)}>
                    {col.value ?? '-'}
                  </span>
                </span>
              ))}
            </div>
          )}
          
          {/* Warning indicator */}
          {warningMessage && (
            <div className="flex items-center text-warning-500" title={warningMessage}>
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
          

        </button>
        
        {/* Right Slot - renders after clickable content (e.g., roll buttons, use button) */}
        {rightSlot && (
          <div className="flex items-center flex-shrink-0 pr-2" onClick={(e) => e.stopPropagation()}>
            {rightSlot}
          </div>
        )}
        
        {/* Selection Button (for modals) - uses unified SelectionToggle - positioned on right */}
        {selectable && (
          <div className={cn(
            'w-10 flex-shrink-0 flex items-center justify-center',
            disabled && 'cursor-not-allowed opacity-50'
          )}>
            <SelectionToggle
              isSelected={!!isSelected}
              onToggle={() => !disabled && onSelect?.()}
              disabled={disabled}
              size="md"
              label={isSelected ? 'Remove from selection' : 'Add to selection'}
            />
          </div>
        )}
      </div>

      {/* Mobile summary row (only when grid mode with columns) */}
      {gridColumns && columns.length > 0 && (
        <div className="lg:hidden px-4 pb-2 flex flex-wrap gap-2 text-xs text-text-secondary">
          {columns.slice(0, 3).map((col) => (
            col.value && (
              <span key={col.key} className="flex items-center gap-1">
                <span className="text-text-muted">{col.key}:</span>
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
          'border-t border-border-light bg-surface-alt',
          compact ? 'px-3 pb-3 pt-2' : 'px-4 pb-4 pt-2',
          selectable && 'mr-10' // Indent on right when selection button present
        )}>
          {/* Custom expanded content takes precedence */}
          {expandedContent ? (
            expandedContent
          ) : (
            <>
              {/* Description */}
              {description && (
                <p className="text-text-secondary text-sm mb-4 p-3 bg-surface rounded-lg">
                  {description}
                </p>
              )}
              
              {/* Warning message */}
              {warningMessage && (
                <p className="text-xs text-warning-600 mb-3 flex items-center gap-1">
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
                      <span className="text-text-muted capitalize">{col.key}:</span>
                      <span className={cn('font-medium text-text-primary', col.highlight && 'text-primary-600')}>
                        {col.value ?? '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total Cost */}
              {totalCost !== undefined && totalCost > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-tp-light text-tp-text">
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
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    {chipsLabel}
                  </h4>

                  {/* Chips */}
                  <div className="flex flex-wrap gap-2">
                    {chips.map((chip, index) => {
                      const hasCost = (chip.cost ?? 0) > 0;
                      const isChipExpanded = expandedChipIndex === index;
                      const category = chip.category || (hasCost ? 'cost' : 'default');
                      
                      return (
                        <div 
                          key={index}
                          className={cn(
                            'flex flex-col',
                            isChipExpanded && 'w-full'
                          )}
                        >
                          <button
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
                          {/* Inline expanded details - shows below the chip when expanded */}
                          {isChipExpanded && (
                            <div className="mt-2 p-3 rounded-lg bg-surface border border-border shadow-sm w-full">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h5 className="font-semibold text-text-primary">{chip.name}</h5>
                                {hasCost && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-tp-light text-tp-text">
                                    <Zap className="w-3 h-3" />
                                    {chip.cost} {chip.costLabel || costLabel}
                                  </span>
                                )}
                              </div>
                              {chip.description && (
                                <p className="text-sm text-text-secondary">{chip.description}</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {showActions && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border-light">
                  {onEdit && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  )}
                  {onDuplicate && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
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
