'use client';

import { Edit, AlertCircle, X } from 'lucide-react';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { IconButton, DescriptorChip } from '@/components/ui';
import { descriptorChipVariantForBadgeColor } from '@/lib/chip/grid-list-chip-utils';
import { SelectionToggle } from './selection-toggle';
import { QuantitySelector, QuantityBadge } from './quantity-selector';
import {
  GRID_LIST_ROW_ICON_COLUMN_WIDTH,
  GRID_LIST_ROW_RIGHT_SLOT_FLEX_WIDTH,
  GRID_LIST_ROW_SELECTION_COLUMN_WIDTH,
} from './grid-list-row-chrome';
import { columnDisplayLabel } from './grid-list-row-columns';
import type { ColumnValue } from './grid-list-row-types';
import { ListRowThumbnail, type ListRowThumbnailProps } from './list-row-thumbnail';

interface GridListRowCollapsedProps {
  isRowClickable: boolean;
  handleRowClickWithGuard: (e: MouseEvent) => void;
  handleRowClick: () => void;
  compact: boolean;
  disabled: boolean;
  gridColumns?: string;
  resolvedGridColumns?: string;
  mobileGridColumns?: string;
  useThumbnailColumn: boolean;
  thumbnail?: ListRowThumbnailProps;
  useFlex: boolean;
  nameGridColumnSpan?: number;
  nameContent?: ReactNode;
  name: string;
  innate: boolean;
  hideInnateBadge: boolean;
  uses?: { current: number; max: number };
  hideUsesInName: boolean;
  quantity?: number;
  onQuantityChange?: (delta: number) => void;
  quantityMin: number;
  quantityDecrementLabel?: string;
  quantityIncrementLabel?: string;
  badges: Array<{ label: string; color?: 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red' }>;
  columns: ColumnValue[];
  columnSpans?: (number | undefined)[];
  suppressDescriptionPreview: boolean;
  allDataColumnsAreDescription: boolean;
  headerColumns: ColumnValue[];
  inlineWarning: boolean;
  warningMessage?: string;
  inlineRightSlot: boolean;
  rightSlot?: ReactNode;
  inlineEdit: boolean;
  onEdit?: () => void;
  inlineDelete: boolean;
  onDelete?: () => void;
  inlineSelectable: boolean;
  isSelected: boolean;
  onSelect?: () => void;
}

export function GridListRowCollapsed({
  isRowClickable,
  handleRowClickWithGuard,
  handleRowClick,
  compact,
  disabled,
  gridColumns,
  resolvedGridColumns,
  mobileGridColumns,
  useThumbnailColumn,
  thumbnail,
  useFlex,
  nameGridColumnSpan,
  nameContent,
  name,
  innate,
  hideInnateBadge,
  uses,
  hideUsesInName,
  quantity,
  onQuantityChange,
  quantityMin,
  quantityDecrementLabel,
  quantityIncrementLabel,
  badges,
  columns,
  columnSpans,
  suppressDescriptionPreview,
  allDataColumnsAreDescription,
  headerColumns,
  inlineWarning,
  warningMessage,
  inlineRightSlot,
  rightSlot,
  inlineEdit,
  onEdit,
  inlineDelete,
  onDelete,
  inlineSelectable,
  isSelected,
  onSelect,
}: GridListRowCollapsedProps) {
  return (
    <>
      {/* Clickable Row Content - div not button to allow RollButton/other buttons inside without nesting.
          Hover highlight lives on the outer row chrome wrapper (TASK-702) so quantity/selection
          tracks share the same band — do not re-add hover here. */}
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
    </>
  );
}

/**
 * Far-right GridListRow actions rendered outside the name/column grid.
 * Sibling of collapsed+expanded so SelectionToggle / quantity cannot overlay
 * the expanded body (TASK-702). Width must match ListHeader spacers.
 */
export interface GridListRowExternalChromeProps {
  disabled?: boolean;
  warningMessage?: string;
  rightSlot?: ReactNode;
  reserveRightSlotChrome?: boolean;
  /** Overrides default energy/use rightSlot width (e.g. USM quantity 7.5rem). */
  rightSlotWidth?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  selectable?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function GridListRowExternalChrome({
  disabled = false,
  warningMessage,
  rightSlot,
  reserveRightSlotChrome = false,
  rightSlotWidth,
  onEdit,
  onDelete,
  selectable = false,
  isSelected = false,
  onSelect,
}: GridListRowExternalChromeProps) {
  const showRightSlot = !!(rightSlot || reserveRightSlotChrome);
  if (!showRightSlot && !onEdit && !onDelete && !selectable) return null;

  const resolvedRightSlotWidth = rightSlotWidth ?? GRID_LIST_ROW_RIGHT_SLOT_FLEX_WIDTH;

  return (
    <div
      className={cn(
        // DESIGN_INTENT: self-start so + / qty / X stay header-tall and never
        // stretch beside the expanded description panel (TASK-702 overlay).
        'flex items-center flex-shrink-0 self-start min-h-[44px]'
      )}
    >
      {showRightSlot && (
        <div
          className="flex items-center flex-shrink-0 justify-center pr-1"
          style={{ width: resolvedRightSlotWidth }}
          onClick={(e) => e.stopPropagation()}
          aria-hidden={reserveRightSlotChrome && !rightSlot ? true : undefined}
        >
          {rightSlot}
        </div>
      )}

      {onEdit && (
        <div
          className="flex items-center flex-shrink-0 justify-center"
          style={{ width: GRID_LIST_ROW_ICON_COLUMN_WIDTH }}
          onClick={(e) => e.stopPropagation()}
        >
          <IconButton
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            label="Edit"
            className="text-text-muted dark:text-text-secondary hover:text-primary-fg-hover hover:bg-transparent"
          >
            <Edit className="w-4 h-4" />
          </IconButton>
        </div>
      )}

      {onDelete && (
        <div
          className="flex items-center flex-shrink-0 justify-center pr-1"
          style={{ width: GRID_LIST_ROW_ICON_COLUMN_WIDTH }}
          onClick={(e) => e.stopPropagation()}
        >
          <IconButton
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            label="Remove"
            className="text-danger-fg hover:opacity-80 hover:bg-transparent"
          >
            <X className="w-4 h-4" />
          </IconButton>
        </div>
      )}

      {selectable && (
        <div
          className={cn(
            'flex-shrink-0 flex items-center justify-center',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          style={{
            width: GRID_LIST_ROW_SELECTION_COLUMN_WIDTH,
            minWidth: GRID_LIST_ROW_SELECTION_COLUMN_WIDTH,
            minHeight: GRID_LIST_ROW_SELECTION_COLUMN_WIDTH,
          }}
          onClick={(e) => e.stopPropagation()}
          role="presentation"
          title={disabled && warningMessage ? warningMessage : undefined}
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
  );
}
