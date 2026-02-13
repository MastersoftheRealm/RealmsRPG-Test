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
import { Edit, Copy, Zap, Check, Plus, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, IconButton } from '@/components/ui';
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
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
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
  /** Multiple labeled chip sections for consistent metadata display (Tags, Requirements, Type, etc.). When provided, replaces chips/chipsLabel. */
  detailSections?: Array<{ label: string; chips: ChipData[]; hideLabelIfSingle?: boolean }>;
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
  /** Add to my library (for public library items) */
  onAddToLibrary?: () => void;
  
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
  /** When true, do not show (current/max) after name (e.g. when Uses column has a stepper) */
  hideUsesInName?: boolean;
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
  /** Override hover class for colored rows (e.g. senses/movement) - use hover:bg-* to match row color */
  rowHoverClass?: string;
}

// =============================================================================
// Badge Color Map (using design tokens)
// =============================================================================

const BADGE_COLORS = {
  blue: 'bg-info-100 dark:bg-info-900/40 text-info-700 dark:text-info-400',
  purple: 'bg-power-light dark:bg-power-900/30 text-power-text dark:text-power-300',
  green: 'bg-success-100 dark:bg-success-900/40 text-success-700 dark:text-success-400',
  amber: 'bg-tp-light dark:bg-amber-900/30 text-tp-text dark:text-amber-400',
  gray: 'bg-surface-alt text-text-secondary',
  red: 'bg-danger-100 dark:bg-danger-900/40 text-danger-700 dark:text-danger-400',
};

const CHIP_STYLES = {
  default: 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800/50 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-800/40',
  cost: 'bg-tp-light dark:bg-amber-900/30 border-tp-border text-tp-text hover:bg-tp-light/80 dark:hover:bg-amber-800/30',
  tag: 'bg-success-50 dark:bg-success-900/30 border-success-200 dark:border-success-800/50 text-success-700 dark:text-success-400 hover:bg-success-100 dark:hover:bg-success-800/40',
  warning: 'bg-danger-50 dark:bg-danger-900/30 border-danger-200 dark:border-danger-800/50 text-danger-700 dark:text-danger-400 hover:bg-danger-100 dark:hover:bg-danger-800/40',
  success: 'bg-success-50 dark:bg-success-900/30 border-success-200 dark:border-success-800/50 text-success-700 dark:text-success-400 hover:bg-success-100 dark:hover:bg-success-800/40',
  archetype: 'bg-power-light dark:bg-power-900/30 border-power-border text-power-text dark:text-power-300 hover:bg-power-light/80 dark:hover:bg-power-800/30',
  skill: 'bg-info-50 dark:bg-info-900/30 border-info-200 dark:border-info-800/50 text-info-700 dark:text-info-400 hover:bg-info-100 dark:hover:bg-info-800/40',
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
  detailSections,
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
  onAddToLibrary,
  // Character sheet slots (Phase 1 Unification)
  leftSlot,
  rightSlot,
  equipped = false,
  innate = false,
  uses,
  hideUsesInName = false,
  quantity,
  onQuantityChange,
  // UI options
  defaultExpanded = false,
  expanded: controlledExpanded,
  onExpandChange,
  compact = false,
  className,
  rowHoverClass,
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
  
  const hasDetailSections = (detailSections?.length ?? 0) > 0;
  const hasChips = chips.length > 0 && !hasDetailSections;
  const hasDetails = description || hasChips || hasDetailSections || badges.length > 0 || requirements || expandedContent;
  const showActions = onEdit || onDuplicate || onAddToLibrary; // Delete is now inline X, not in expanded actions
  const showExpander = hasDetails || showActions || onDelete;
  
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
    equipped && !isSelected && 'border-green-300 dark:border-green-600/50 bg-green-50 dark:bg-green-900/30',
    // Innate state (purple styling)
    innate && !isSelected && !equipped && 'border-violet-300 dark:border-violet-600/50 bg-violet-50 dark:bg-violet-900/30',
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
      <div className="flex items-center min-h-[44px]">
        {/* Left Slot - renders before clickable content (e.g., equip toggle, innate toggle) */}
        {leftSlot && (
          <div className="flex-shrink-0 flex items-center justify-center pl-1" onClick={(e) => e.stopPropagation()}>
            {leftSlot}
          </div>
        )}
        
        {/* Clickable Row Content */}
        <button
          onClick={handleRowClick}
          disabled={disabled && !showExpander}
          className={cn(
            'flex-1 text-left transition-colors',
            showExpander && (rowHoverClass ?? 'hover:bg-surface-alt'),
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
              <span className="text-[10px] px-1 py-0.5 rounded bg-violet-200 dark:bg-violet-800/50 text-violet-600 dark:text-violet-300 flex-shrink-0">★</span>
            )}
            {/* Uses display (hidden when Uses column shows stepper) */}
            {uses && !hideUsesInName && (
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
                col.align === 'center' && 'text-center',
                col.align === 'right' && 'text-right',
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
        
        {/* Inline Edit pencil - visible in collapsed state for quick editing */}
        {onEdit && (
          <div className="flex items-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              label="Edit"
              className="text-text-muted hover:text-primary-600 hover:bg-transparent"
            >
              <Edit className="w-4 h-4" />
            </IconButton>
          </div>
        )}

        {/* Delete X - simple red X matching add button style, visible in collapsed state */}
        {onDelete && (
          <div className="flex items-center flex-shrink-0 pr-1" onClick={(e) => e.stopPropagation()}>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              label="Remove"
              className="text-danger hover:text-danger-600 hover:bg-transparent"
            >
              <X className="w-4 h-4" />
            </IconButton>
          </div>
        )}
        
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
          compact ? 'px-3 py-3' : 'px-4 py-4',
          selectable && 'mr-10' // Indent on right when selection button present
        )}>
          {/* Custom expanded content takes precedence */}
          {expandedContent ? (
            expandedContent
          ) : (
            <>
              {/* Description - equal margin above/below for consistent item card spacing */}
              {description && (
                <p className="text-text-secondary text-sm mb-3 p-3 bg-surface rounded-lg">
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
              
              {/* Requirements - legacy raw content; prefer detailSections for structured display */}
              {requirements && !hasDetailSections && (
                <div className="mb-4 text-sm">
                  {requirements}
                </div>
              )}

              {/* Detail Sections - multiple header+chips groups (Tags, Requirements, Type, etc.) */}
              {hasDetailSections && detailSections!.map((section, sectionIdx) => {
                const sectionChips = section.chips;
                if (sectionChips.length === 0) return null;
                const showLabel = !section.hideLabelIfSingle || sectionChips.length > 1;
                const sectionOffset = detailSections!.slice(0, sectionIdx).reduce((sum, s) => sum + s.chips.length, 0);
                return (
                  <div key={sectionIdx} className={cn('space-y-3', sectionIdx > 0 && 'mt-4')}>
                    {showLabel && (
                      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        {section.label}
                      </h4>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {sectionChips.map((chip, chipIdx) => {
                        const index = sectionOffset + chipIdx;
                        const hasCost = (chip.cost ?? 0) > 0;
                        const isChipExpanded = expandedChipIndex === index;
                        const category = chip.category || (hasCost ? 'cost' : 'default');
                        const isExpandable = !!(chip.description || hasCost) && category !== 'tag';
                        return (
                          <button
                            key={chipIdx}
                            onClick={isExpandable ? (e) => handleChipClick(index, e) : (e) => e.stopPropagation()}
                            className={cn(
                              'inline-flex flex-col items-start rounded-xl text-sm font-medium transition-all duration-200 border',
                              isExpandable ? 'cursor-pointer' : 'cursor-default',
                              CHIP_STYLES[category],
                              isChipExpanded ? 'w-full ring-2 ring-offset-1 ring-current px-3 py-2' : 'px-3 py-1.5'
                            )}
                          >
                            <span className="inline-flex items-center gap-1.5">
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
                            </span>
                            {isChipExpanded && chip.description && (
                              <span className="block mt-1.5 pt-1.5 border-t border-current/15 text-xs font-normal text-left opacity-90 leading-relaxed">
                                {chip.description}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Chips Section - legacy single section */}
              {hasChips && chips.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    {chipsLabel}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {chips.map((chip, index) => {
                      const hasCost = (chip.cost ?? 0) > 0;
                      const isChipExpanded = expandedChipIndex === index;
                      const category = chip.category || (hasCost ? 'cost' : 'default');
                      const isExpandable = !!(chip.description || hasCost) && category !== 'tag';
                      return (
                        <button
                          key={`${chip.name}-${category}-${index}`}
                          onClick={isExpandable ? (e) => handleChipClick(index, e) : (e) => e.stopPropagation()}
                          className={cn(
                            'inline-flex flex-col items-start rounded-xl text-sm font-medium transition-all duration-200 border',
                            isExpandable ? 'cursor-pointer' : 'cursor-default',
                            CHIP_STYLES[category],
                            isChipExpanded ? 'w-full ring-2 ring-offset-1 ring-current px-3 py-2' : 'px-3 py-1.5'
                          )}
                        >
                          <span className="inline-flex items-center gap-1.5">
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
                          </span>
                          {isChipExpanded && chip.description && (
                            <span className="block mt-1.5 pt-1.5 border-t border-current/15 text-xs font-normal text-left opacity-90 leading-relaxed">
                              {chip.description}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons (Edit, Duplicate, Add to library - Delete is inline X in row) */}
              {showActions && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border-light">
                  {onAddToLibrary && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onAddToLibrary(); }}
                    >
                      <Plus className="w-4 h-4" />
                      Add to my library
                    </Button>
                  )}
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
