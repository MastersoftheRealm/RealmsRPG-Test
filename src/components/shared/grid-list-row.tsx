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

import { useState, memo, type CSSProperties, type ReactNode } from 'react';
import { Edit, Copy, Plus, AlertCircle, X } from 'lucide-react';
import { cn, formatColumnKeyLabel } from '@/lib/utils';
import { formatCostDisplay } from '@/lib/game/creator-constants';
import { Button, IconButton, DescriptorChip } from '@/components/ui';
import { GridListChip } from './grid-list-chip';
import { descriptorChipVariantForBadgeColor } from '@/lib/chip/grid-list-chip-utils';
import { SelectionToggle } from './selection-toggle';
import { QuantitySelector, QuantityBadge } from './quantity-selector';
import {
  GRID_LIST_ROW_RIGHT_SLOT_FLEX_WIDTH,
  buildMobileCollapsedGridColumns,
  countGridTemplateTracks,
  gridTemplateColumnsWithThumbnail,
} from './grid-list-row-chrome';
import type { ChipData } from './grid-list-row-types';
import { ListRowThumbnail, type ListRowThumbnailProps } from './list-row-thumbnail';

export type { ChipData, ChipOptionData } from './grid-list-row-types';

// =============================================================================
// Types
// =============================================================================

export interface ColumnValue {
  /** Column key (for identity, sort, accessibility) */
  key: string;
  /** Optional display label (use for UI; falls back to key if missing) */
  label?: string;
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

/** Humanize column key for display when label is not set. */
function columnDisplayLabel(col: ColumnValue): string {
  if (col.label) return col.label;
  return formatColumnKeyLabel(col.key);
}

/** Columns hidden from the mobile grid (`hideOnMobile` default true). */
function columnsForMobileSummary(columns: ColumnValue[]): ColumnValue[] {
  return columns.filter((col) => col.hideOnMobile !== false).slice(0, 3);
}

/** Stat columns for expanded mobile — skip description when the body already shows it. */
function columnsForExpandedMobileStats(
  columns: ColumnValue[],
  hasDescriptionBody: boolean
): ColumnValue[] {
  return columns.filter((col) => !(col.key === 'description' && hasDescriptionBody));
}

/**
 * When the expanded panel shows the full description, drop truncated description previews
 * from the collapsed header (desktop columns, mobile summary, flex stats).
 * Progressive disclosure: teaser → full text below — not both at once (Carbon/NN/g).
 */
function columnsWithoutDescriptionPreview(
  columns: ColumnValue[],
  suppressDescriptionPreview: boolean
): ColumnValue[] {
  if (!suppressDescriptionPreview) return columns;
  return columns.filter((col) => col.key !== 'description');
}

function descriptionColumnTrackCount(
  columns: ColumnValue[],
  columnSpans?: (number | undefined)[]
): number {
  return columns.reduce((sum, col, idx) => {
    if (col.key !== 'description') return sum;
    return sum + (columnSpans?.[idx] ?? 1);
  }, 0);
}

export interface GridListRowProps {
  /** Unique item ID */
  id: string;
  /** Display name (first column) */
  name: string;
  /** Optional rich name content (overrides plain name text when set) */
  nameContent?: ReactNode;
  /**
   * Item description (shown in default expanded view).
   * When expanded, any collapsed-row column with `key: 'description'` (or the mobile
   * description summary) is hidden so the full text is not duplicated in the header.
   */
  description?: string;
  /** Column values to display in collapsed row */
  columns?: ColumnValue[];
  /** Optional span per column (e.g. [3] = first column spans 3 grid columns). Use so description can span Uses/Recovery when they are empty. */
  columnSpans?: (number | undefined)[];
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
  /** Extra content appended after the default expanded body (description, chips, etc.) */
  supplementalExpandedContent?: ReactNode;
  
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
  /** Add to my library (for Realms Library items) */
  onAddToLibrary?: () => void;
  
  // ===== Character Sheet Slots (Phase 1 Unification) =====
  /** Left slot content (e.g., innate toggle, equip checkbox) - renders before name */
  leftSlot?: ReactNode;
  /** Small thumbnail left of name (D&D Beyond list style). Click opens preview modal. */
  thumbnail?: ListRowThumbnailProps;
  /** Right slot content (e.g., use button, roll buttons) - renders after columns */
  rightSlot?: ReactNode;
  /** Visual state: item is equipped (green border/bg styling) */
  equipped?: boolean;
  /** Visual state: item is innate (purple styling) */
  innate?: boolean;
  /** When true, do not show the innate star badge (e.g. already in innate section) */
  hideInnateBadge?: boolean;
  /** Uses tracking for feats with limited uses */
  uses?: { current: number; max: number };
  /** When true, do not show (current/max) after name (e.g. when Uses column has a stepper) */
  hideUsesInName?: boolean;
  /** Quantity for stackable items (equipment, consumables) */
  quantity?: number;
  /** Callback when quantity changes (enables +/- controls) */
  onQuantityChange?: (delta: number) => void;
  /** Minimum quantity when steppers are shown (default 1; use 0 for quantity-first selection) */
  quantityMin?: number;
  /** Accessible decrement label for quantity steppers */
  quantityDecrementLabel?: string;
  /** Accessible increment label for quantity steppers */
  quantityIncrementLabel?: string;
  
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
// Component
// =============================================================================

export const GridListRow = memo(function GridListRow({
  name,
  nameContent,
  description,
  columns = [],
  columnSpans,
  gridColumns,
  chips = [],
  chipsLabel = 'Details',
  detailSections,
  totalCost,
  costLabel = 'Training Points',
  badges = [],
  requirements,
  expandedContent,
  supplementalExpandedContent,
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
  thumbnail,
  rightSlot,
  innate = false,
  hideInnateBadge = false,
  uses,
  hideUsesInName = false,
  quantity,
  onQuantityChange,
  quantityMin = 1,
  quantityDecrementLabel,
  quantityIncrementLabel,
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
  const [expandedOptionsChipIndex, setExpandedOptionsChipIndex] = useState<number | null>(null);
  
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
  const descTrimmed = typeof description === 'string' ? description.trim() : '';
  const hasBodyContent =
    !!descTrimmed ||
    hasChips ||
    hasDetailSections ||
    badges.length > 0 ||
    !!requirements ||
    !!expandedContent ||
    !!supplementalExpandedContent;
  const showActions = onEdit || onDuplicate || onAddToLibrary; // Delete is now inline X, not in expanded actions
  /** Must match what we actually render when expanded (incl. total cost row and action buttons). */
  const hasDetails =
    hasBodyContent ||
    (totalCost !== undefined && totalCost > 0) ||
    !!showActions;
  const showExpander = hasDetails || onDelete;
  
  const handleChipClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedChipIndex(expandedChipIndex === index ? null : index);
  };
  
  const handleRowClick = () => {
    // When selectable (add-X modals): row click only expand/collapse so users can read details
    // before adding; selection is done only via the + button.
    if (selectable) {
      if (showExpander) setExpanded(!isExpanded);
      return;
    }
    if (showExpander) {
      setExpanded(!isExpanded);
    }
  };

  const isRowClickable = (showExpander || selectable) && !(disabled && (!selectable || !showExpander));

  // Prevent row expand when clicking buttons/links inside (avoids nested button hydration error and wrong UX).
  // The row's clickable div has role="button", so we must only skip when the click is on a *different*
  // interactive element (e.g. Edit, Delete, RollButton), not the row trigger itself.
  const handleRowClickWithGuard = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const rowTrigger = target.closest?.('[data-grid-row-trigger]');
    const interactive = target.closest?.(
      'button, [role="button"], a, input, select, textarea, [data-expand-ignore]'
    );
    if (interactive && interactive !== rowTrigger) return;
    handleRowClick();
  };

  /**
   * Mobile summary + expanded body also toggle the row (not only the header trigger).
   * Skip nested controls and chip groups (chips own their expand/collapse).
   */
  const handleRowBodyClickWithGuard = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const interactive = target.closest?.(
      'button, [role="button"], a, input, select, textarea, [data-expand-ignore], [data-chip-group]'
    );
    if (interactive) return;
    handleRowClick();
  };

  // Determine row styling based on state (equipped: no row green/checkmark — toggle is enough)
  const rowStyles = cn(
    'bg-surface transition-all rounded-lg border overflow-hidden',
    // Selection state
    isSelected && 'bg-primary-subtle-bg border-l-4 border-l-primary-outline-border',
    // Innate state (purple styling)
    innate && !isSelected && 'border-power-border bg-power-light',
    // Default border
    !isSelected && !innate && 'border-border-light',
    // Disabled state
    disabled && 'opacity-50',
    className
  );

  // When gridColumns is provided, use a CSS grid so columns align with ListHeader.
  // Templates are applied via --glr-desktop-grid / --glr-mobile-grid CSS variables (not inline
  // gridTemplateColumns) so max-lg collapse can override the desktop track list.
  const useFlex = !gridColumns;
  const useThumbnailColumn = Boolean(thumbnail && gridColumns);
  const resolvedGridColumns =
    useThumbnailColumn && gridColumns
      ? gridTemplateColumnsWithThumbnail(gridColumns)
      : gridColumns;
  const explicitGridTracks = countGridTemplateTracks(resolvedGridColumns);
  /**
   * How many tracks are consumed by the rendered grid items (thumbnail + Name + data columns),
   * respecting `columnSpans`. This prevents us from mistakenly treating *unused*
   * data columns (e.g. Uses/Recovery when empty) as "action columns".
   *
   * Example (FeatsTab):
   * - Grid: Name | Description | Uses | Recovery  (4 tracks)
   * - Row: Name + Description spanning 3 tracks → consumes all 4 tracks.
   * - Without this, we'd think there are 2 "extra" tracks and inline the delete button,
   *   which forces it onto a second grid row.
   */
  const dataTracksUsed =
    (useThumbnailColumn ? 2 : 1) +
    columns.reduce((sum, _col, idx) => sum + (columnSpans?.[idx] ?? 1), 0);
  let remainingInlineActionTracks = Math.max(0, explicitGridTracks - dataTracksUsed);

  // Consume extra right-side grid tracks first for controls that normally render outside the grid.
  const inlineSelectable = selectable && remainingInlineActionTracks > 0;
  if (inlineSelectable) remainingInlineActionTracks -= 1;
  const inlineDelete = !!onDelete && remainingInlineActionTracks > 0;
  if (inlineDelete) remainingInlineActionTracks -= 1;
  const inlineEdit = !!onEdit && remainingInlineActionTracks > 0;
  if (inlineEdit) remainingInlineActionTracks -= 1;
  const inlineRightSlot = !!rightSlot && remainingInlineActionTracks > 0;
  const inlineWarning = !!warningMessage && remainingInlineActionTracks > 0;
  if (inlineWarning) remainingInlineActionTracks -= 1;

  // Default expanded body owns the full description — suppress the teaser while open.
  const suppressDescriptionPreview =
    isExpanded && !!descTrimmed && !expandedContent;
  const headerColumns = columnsWithoutDescriptionPreview(columns, suppressDescriptionPreview);
  const allDataColumnsAreDescription =
    columns.length > 0 && columns.every((col) => col.key === 'description');
  /** Name-only header when expand replaces a description-only column set (avoids empty dead space). */
  const nameGridColumnSpan =
    suppressDescriptionPreview && allDataColumnsAreDescription
      ? 1 + descriptionColumnTrackCount(columns, columnSpans)
      : undefined;

  /**
   * Mobile collapses hidden data-column `fr` tracks so the name is not squeezed left
   * beside X/+ (those tracks still reserved space when columns are `display: none`).
   */
  const mobileVisibleDataTracks = columns.reduce((sum, col, idx) => {
    if (col.hideOnMobile !== false) return sum;
    return sum + (columnSpans?.[idx] ?? 1);
  }, 0);
  const mobileGridColumns =
    resolvedGridColumns
      ? buildMobileCollapsedGridColumns({
          resolvedGridColumns,
          hasThumbnailColumn: useThumbnailColumn,
          dataTracksUsed,
          mobileVisibleDataTracks,
        })
      : undefined;

  const mobileSummaryColumns = columnsWithoutDescriptionPreview(
    columnsForMobileSummary(columns),
    suppressDescriptionPreview
  );
  const expandedMobileStatColumns = columnsForExpandedMobileStats(columns, !!descTrimmed);

  return (
    <div className={rowStyles}>
      {/* Main Row */}
      <div className="flex items-center min-h-[44px]">
        {/* Left Slot - fixed width so column content aligns with headers */}
        {leftSlot && (
          <div className="flex-shrink-0 flex items-center justify-center w-8 min-w-[2rem]" onClick={(e) => e.stopPropagation()}>
            {leftSlot}
          </div>
        )}
        
        {/* Clickable Row Content - div not button to allow RollButton/other buttons inside without nesting */}
        <div
          data-grid-row-trigger
          role={isRowClickable ? 'button' : undefined}
          tabIndex={isRowClickable ? 0 : undefined}
          onClick={isRowClickable ? handleRowClickWithGuard : undefined}
          onKeyDown={isRowClickable ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleRowClick();
            }
          } : undefined}
          className={cn(
            'flex-1 text-left transition-colors min-h-[44px] min-w-0',
            (showExpander || selectable) && (rowHoverClass ?? 'hover:bg-surface-alt'),
            // Compact rows are used heavily in add/load modals; keep 44px minimum touch target,
            // but avoid exceeding it via extra vertical padding.
            compact ? 'px-3 py-1.5' : 'px-4 py-2',
            disabled && 'cursor-default',
            isRowClickable && 'cursor-pointer',
            // DESIGN_INTENT: set template via CSS variables + classes, never inline
            // `gridTemplateColumns` — inline styles beat max-lg media queries and blocked
            // the mobile collapse (names squeezed; X landed mid-row before empty fr tracks).
            gridColumns &&
              'grid gap-2 items-center [grid-template-columns:var(--glr-desktop-grid)] max-lg:[grid-template-columns:var(--glr-mobile-grid)]'
          )}
          style={
            resolvedGridColumns
              ? ({
                  ['--glr-desktop-grid' as string]: resolvedGridColumns,
                  ['--glr-mobile-grid' as string]: mobileGridColumns ?? resolvedGridColumns,
                } as CSSProperties)
              : undefined
          }
        >
          {useThumbnailColumn && thumbnail && (
            <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <ListRowThumbnail {...thumbnail} />
            </div>
          )}
          {/* Name column: full name visible on mobile (wrap), truncate on desktop.
              @container so inline type tags hide based on *column* width (narrow sheet
              panels), not viewport — name wins space before truncating.
              Desktop-only span: mobile uses a collapsed template (name already 1fr). */}
          <div
            style={
              nameGridColumnSpan
                ? ({ ['--glr-name-span' as string]: `span ${nameGridColumnSpan}` } as CSSProperties)
                : undefined
            }
            className={cn(
              '@container font-medium text-text-primary flex items-center gap-2 min-w-0',
              useFlex && 'flex-1',
              nameGridColumnSpan && 'lg:[grid-column:var(--glr-name-span)]'
            )}
          >
            {!useThumbnailColumn && thumbnail && <ListRowThumbnail {...thumbnail} />}
            <span className="min-w-0 break-words lg:truncate">{nameContent ?? name}</span>
            {/* Innate indicator (hidden when already in innate section) */}
            {innate && !hideInnateBadge && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-power-light text-power-fg border border-power-border flex-shrink-0">★</span>
            )}
            {/* Uses display (hidden when Uses column shows stepper). Show - when no/zero uses. */}
            {uses && !hideUsesInName && (
              <span className="text-xs text-text-secondary flex-shrink-0">
                {uses.max > 0 ? `(${uses.current}/${uses.max})` : '-'}
              </span>
            )}
            {/* Quantity display - editable if onQuantityChange provided (allows 0 for quantity-first) */}
            {quantity !== undefined && (onQuantityChange || quantity > 0) && (
              onQuantityChange ? (
                <QuantitySelector
                  quantity={quantity}
                  onChange={(val) => onQuantityChange(val - quantity)}
                  size="sm"
                  min={quantityMin}
                  decrementLabel={quantityDecrementLabel}
                  incrementLabel={quantityIncrementLabel}
                />
              ) : (
                <QuantityBadge quantity={quantity} className="flex-shrink-0" />
              )
            )}
            {/* Inline badges for compact view. Hidden when the name column is narrow so the
                name keeps room; reappear at ≥13rem column width. Full tag stays in expanded view. */}
            {compact && badges.length > 0 && (
              <span className="ml-2 hidden @[13rem]:inline-flex gap-1">
                {badges.slice(0, 2).map((badge, i) => (
                  <DescriptorChip
                    key={i}
                    variant={descriptorChipVariantForBadgeColor(badge.color)}
                    className="shrink-0"
                  >
                    {badge.label}
                  </DescriptorChip>
                ))}
              </span>
            )}
          </div>
          
          {/* Data columns (non-name). Description teaser clears while expanded when body has the full text. */}
          {columns.map((col, colIndex) => {
            if (suppressDescriptionPreview && col.key === 'description') {
              // Description-only layouts: name spans those tracks (no empty hole).
              if (allDataColumnsAreDescription) return null;
              // Mixed layouts: keep an empty cell so Uses/Energy/etc. stay aligned.
              return (
                <div
                  key={col.key}
                  style={columnSpans?.[colIndex] ? { gridColumn: `span ${columnSpans[colIndex]}` } : undefined}
                  className={cn(
                    'text-sm min-w-0',
                    col.hideOnMobile !== false && 'hidden lg:block'
                  )}
                  aria-hidden
                />
              );
            }
            return (
              <div
                key={col.key}
                style={columnSpans?.[colIndex] ? { gridColumn: `span ${columnSpans[colIndex]}` } : undefined}
                className={cn(
                  'text-sm truncate min-w-0',
                  col.hideOnMobile !== false && 'hidden lg:block',
                  col.className,
                  col.highlight ? 'text-primary-link-fg font-medium' : 'text-text-primary',
                  col.align === 'left' && 'text-left',
                  col.align === 'right' && 'text-right',
                  (!col.align || col.align === 'center') && 'text-center'
                )}
              >
                {col.value ?? '-'}
              </div>
            );
          })}
          
          {/* Flex mode: show key stats inline */}
          {useFlex && headerColumns.length > 0 && (
            <div className="hidden md:flex items-center gap-4 text-sm text-text-secondary">
              {headerColumns.slice(0, 3).map((col) => (
                <span key={col.key} className="whitespace-nowrap">
                  <span className="text-text-muted dark:text-text-secondary">{(columnDisplayLabel(col))}:</span>{' '}
                  <span className={cn(col.highlight && 'text-primary-link-fg font-medium', col.className)}>
                    {col.value ?? '-'}
                  </span>
                </span>
              ))}
            </div>
          )}
          
          {/* Warning indicator — only when a grid track is free (full grids use expanded/title fallback) */}
          {inlineWarning && (
            <div className="flex items-center text-warning-fg" title={warningMessage}>
              <AlertCircle className="w-4 h-4" />
            </div>
          )}

          {/* Inline controls: used when gridColumns already includes trailing action tracks */}
          {inlineRightSlot && (
            <div className="flex items-center justify-center min-w-0" onClick={(e) => e.stopPropagation()}>
              {rightSlot}
            </div>
          )}
          {inlineEdit && (
            <div className="flex items-center justify-center min-w-0" onClick={(e) => e.stopPropagation()}>
              <IconButton
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                label="Edit"
                className="text-text-muted dark:text-text-secondary hover:text-primary-fg-hover hover:bg-transparent"
              >
                <Edit className="w-4 h-4" />
              </IconButton>
            </div>
          )}
          {inlineDelete && (
            <div className="flex items-center justify-center min-w-0" onClick={(e) => e.stopPropagation()}>
              <IconButton
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                label="Remove"
                className="text-danger-fg hover:opacity-80 hover:bg-transparent"
              >
                <X className="w-4 h-4" />
              </IconButton>
            </div>
          )}
          {inlineSelectable && (
            <div
              className={cn(
                'min-w-[44px] w-11 flex items-center justify-center min-h-[44px]',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              onClick={(e) => e.stopPropagation()}
              role="presentation"
              title={disabled && warningMessage && !inlineWarning ? warningMessage : undefined}
            >
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
        
        {/* Right Slot - use button, roll buttons, quantity, etc. (before delete so X is at far right) */}
        {rightSlot && !inlineRightSlot && (
          <div
            className="flex items-center flex-shrink-0 justify-center pr-1"
            style={{ width: GRID_LIST_ROW_RIGHT_SLOT_FLEX_WIDTH }}
            onClick={(e) => e.stopPropagation()}
          >
            {rightSlot}
          </div>
        )}

        {/* Inline Edit pencil - visible in collapsed state for quick editing */}
        {onEdit && !inlineEdit && (
          <div className="flex items-center flex-shrink-0 w-9 justify-center" onClick={(e) => e.stopPropagation()}>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              label="Edit"
              className="text-text-muted dark:text-text-secondary hover:text-primary-fg-hover hover:bg-transparent"
            >
              <Edit className="w-4 h-4" />
            </IconButton>
          </div>
        )}

        {/* Delete X - at far right after use button */}
        {onDelete && !inlineDelete && (
          <div className="flex items-center flex-shrink-0 justify-center w-9 pr-1" onClick={(e) => e.stopPropagation()}>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              label="Remove"
              className="text-danger-fg hover:opacity-80 hover:bg-transparent"
            >
              <X className="w-4 h-4" />
            </IconButton>
          </div>
        )}
        
        {/* Selection Button (for modals) - uses unified SelectionToggle - positioned on right */}
        {selectable && !inlineSelectable && (
          <div
            className={cn(
              'min-w-[44px] w-11 flex-shrink-0 flex items-center justify-center min-h-[44px]',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
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

      {/* Mobile summary — stats hidden from the collapsed grid; description teaser hides while expanded.
          Tapping the summary expands/collapses the row (same as the header trigger). */}
      {gridColumns && mobileSummaryColumns.length > 0 && (
        <div
          className={cn(
            'lg:hidden px-4 pb-2 flex flex-wrap gap-2 text-xs text-text-secondary',
            isRowClickable && 'cursor-pointer'
          )}
          onClick={isRowClickable ? handleRowBodyClickWithGuard : undefined}
        >
          {mobileSummaryColumns.map((col) =>
            col.value ? (
              col.key === 'description' ? (
                <div
                  key={col.key}
                  className={cn(
                    'w-full min-w-0 text-text-secondary',
                    col.className,
                    col.highlight && 'text-primary-link-fg font-medium'
                  )}
                >
                  {col.value}
                </div>
              ) : (
                <span key={col.key} className="flex items-center gap-1">
                  <span className="text-text-muted dark:text-text-secondary">
                    {columnDisplayLabel(col)}:
                  </span>
                  <span className={cn(col.highlight && 'text-primary-link-fg font-medium')}>
                    {col.value}
                  </span>
                </span>
              )
            ) : null
          )}
        </div>
      )}
      
      {/* Expanded Content — body tap toggles collapse (nested buttons/chips excluded) */}
      {isExpanded && hasDetails && (
        <div
          className={cn(
            'border-t border-border-light bg-surface-alt',
            compact ? 'px-3 py-3' : 'px-4 py-4',
            selectable && 'mr-10', // Indent on right when selection button present
            isRowClickable && 'cursor-pointer'
          )}
          onClick={isRowClickable ? handleRowBodyClickWithGuard : undefined}
        >
          {/* Custom expanded content takes precedence */}
          {expandedContent ? (
            expandedContent
          ) : (
            <>
              {/* Description - equal margin above/below for consistent item card spacing */}
              {descTrimmed && (
                <p className="text-text-secondary text-sm mb-3 p-3 bg-surface rounded-lg">
                  {description}
                </p>
              )}
              
              {/* Warning message */}
              {warningMessage && (
                <p className="text-xs text-warning-fg mb-3 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {warningMessage}
                </p>
              )}
              
              {/* Badges */}
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {badges.map((badge, i) => (
                    <DescriptorChip key={i} variant={descriptorChipVariantForBadgeColor(badge.color)}>
                      {badge.label}
                    </DescriptorChip>
                  ))}
                </div>
              )}

              {/* Numeric / stat columns on mobile (description body renders above) */}
              {gridColumns && expandedMobileStatColumns.length > 0 && (
                <div className="lg:hidden grid grid-cols-2 gap-2 mb-4 text-sm">
                  {expandedMobileStatColumns.map((col) => (
                    <div key={col.key} className="flex items-center gap-2">
                      <span className="text-text-muted dark:text-text-secondary">
                        {columnDisplayLabel(col)}:
                      </span>
                      <span
                        className={cn(
                          'font-medium text-text-primary',
                          col.highlight && 'text-primary-link-fg'
                        )}
                      >
                        {col.value ?? '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total Cost */}
              {totalCost !== undefined && totalCost > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <DescriptorChip variant="listCost" size="md">
                    Total {costLabel}: {formatCostDisplay(totalCost)}
                  </DescriptorChip>
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
                      <h3 className="text-xs font-semibold text-text-muted dark:text-text-secondary uppercase tracking-wider">
                        {section.label}
                      </h3>
                    )}
                    <div data-chip-group className="flex flex-wrap gap-2 items-start">
                      {sectionChips.map((chip, chipIdx) => {
                        const index = sectionOffset + chipIdx;
                        return (
                          <GridListChip
                            key={chipIdx}
                            chip={chip}
                            costLabel={costLabel}
                            expanded={expandedChipIndex === index}
                            onToggle={(e) => handleChipClick(index, e)}
                            optionsOpen={expandedOptionsChipIndex === index}
                            onOptionsOpenChange={(open) =>
                              setExpandedOptionsChipIndex(open ? index : null)
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Chips Section - legacy single section */}
              {hasChips && chips.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-text-muted dark:text-text-secondary uppercase tracking-wider">
                    {chipsLabel}
                  </h3>
                  <div data-chip-group className="flex flex-wrap gap-2 items-start">
                    {chips.map((chip, index) => (
                      <GridListChip
                        key={`${chip.name}-${chip.category ?? 'default'}-${index}`}
                        chip={chip}
                        costLabel={costLabel}
                        expanded={expandedChipIndex === index}
                        onToggle={(e) => handleChipClick(index, e)}
                        optionsOpen={expandedOptionsChipIndex === index}
                        onOptionsOpenChange={(open) =>
                          setExpandedOptionsChipIndex(open ? index : null)
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {supplementalExpandedContent}

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
});

GridListRow.displayName = 'GridListRow';

export default GridListRow;
