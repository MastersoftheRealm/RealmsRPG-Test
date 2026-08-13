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

import { useEffect, useState, memo } from 'react';
import { cn } from '@/lib/utils';
import {
  helpKeyForPartsOrPropertiesLabel,
  isPartsOrPropertiesProficienciesLabel,
  type MetadataDetailSection,
} from '@/lib/chip/list-row-metadata';
import {
  buildMobileCollapsedGridColumns,
  countGridTemplateTracks,
  gridTemplateColumnsWithThumbnail,
  GRID_LIST_ROW_LEFT_SLOT_WIDTH,
} from './grid-list-row-chrome';
import { GridListRowCollapsed, GridListRowExternalChrome } from './grid-list-row-collapsed';
import {
  columnsAlreadyShowTrainingPoints,
  columnsForExpandedMobileStats,
  columnsForMobileSummary,
  columnsWithoutDescriptionPreview,
  descriptionColumnTrackCount,
} from './grid-list-row-columns';
import { GridListRowExpandedBody, GridListRowMobileSummary } from './grid-list-row-expanded';
import type { GridListRowProps } from './grid-list-row-types';

export type { ChipData, ChipOptionData, ColumnValue, GridListRowProps } from './grid-list-row-types';

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
  costLabel = 'TP',
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
  leftSlot,
  thumbnail,
  rightSlot,
  rowChrome,
  innate = false,
  hideInnateBadge = false,
  uses,
  hideUsesInName = false,
  quantity,
  onQuantityChange,
  quantityMin = 1,
  quantityDecrementLabel,
  quantityIncrementLabel,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onExpandChange,
  compact = false,
  className,
  rowHoverClass,
  rightSlotWidth,
}: GridListRowProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const [expandedChipIndex, setExpandedChipIndex] = useState<number | null>(null);
  const [expandedOptionsChipIndex, setExpandedOptionsChipIndex] = useState<number | null>(null);
  const [openDetailSections, setOpenDetailSections] = useState<Record<string, boolean>>({});

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const setExpanded = (value: boolean) => {
    if (controlledExpanded === undefined) {
      setInternalExpanded(value);
    }
    onExpandChange?.(value);
  };

  useEffect(() => {
    if (!isExpanded) setOpenDetailSections({});
  }, [isExpanded]);

  const hasDetailSections = (detailSections?.length ?? 0) > 0;
  const hasChips = chips.length > 0 && !hasDetailSections;
  const expandedDetailSections: MetadataDetailSection[] = hasDetailSections
    ? detailSections!
    : hasChips
      ? [
          {
            label: chipsLabel,
            chips,
            defaultCollapsed: isPartsOrPropertiesProficienciesLabel(chipsLabel) || undefined,
            labelHelpKey: helpKeyForPartsOrPropertiesLabel(chipsLabel),
          },
        ]
      : [];
  const descTrimmed = typeof description === 'string' ? description.trim() : '';
  const hasBodyContent =
    !!descTrimmed ||
    hasChips ||
    hasDetailSections ||
    badges.length > 0 ||
    !!requirements ||
    !!expandedContent ||
    !!supplementalExpandedContent;
  const showActions = !!(onEdit || onDuplicate || onAddToLibrary);
  const showExpandedTotalCost =
    totalCost !== undefined &&
    totalCost > 0 &&
    !columnsAlreadyShowTrainingPoints(columns, costLabel);
  const hasDetails =
    hasBodyContent ||
    showExpandedTotalCost ||
    showActions;
  const showExpander = hasDetails || !!onDelete;

  const handleChipClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedChipIndex(expandedChipIndex === index ? null : index);
  };

  const handleRowClick = () => {
    if (selectable) {
      if (showExpander) setExpanded(!isExpanded);
      return;
    }
    if (showExpander) {
      setExpanded(!isExpanded);
    }
  };

  const isRowClickable = (showExpander || selectable) && !(disabled && (!selectable || !showExpander));

  const handleRowClickWithGuard = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const rowTrigger = target.closest?.('[data-grid-row-trigger]');
    const interactive = target.closest?.(
      'button, [role="button"], a, input, select, textarea, [data-expand-ignore]'
    );
    if (interactive && interactive !== rowTrigger) return;
    handleRowClick();
  };

  const handleRowBodyClickWithGuard = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const interactive = target.closest?.(
      'button, [role="button"], a, input, select, textarea, [data-expand-ignore], [data-chip-group]'
    );
    if (interactive) return;
    handleRowClick();
  };

  const rowStyles = cn(
    'bg-surface transition-all rounded-lg border overflow-hidden',
    isSelected && 'bg-primary-subtle-bg border-l-4 border-l-primary-outline-border',
    innate && !isSelected && 'border-power-border bg-power-light',
    !isSelected && !innate && 'border-border-light',
    disabled && 'opacity-50',
    className
  );

  const useFlex = !gridColumns;
  const useThumbnailColumn = Boolean(thumbnail && gridColumns);
  const resolvedGridColumns =
    useThumbnailColumn && gridColumns
      ? gridTemplateColumnsWithThumbnail(gridColumns)
      : gridColumns;
  const explicitGridTracks = countGridTemplateTracks(resolvedGridColumns);
  const dataTracksUsed =
    (useThumbnailColumn ? 2 : 1) +
    columns.reduce((sum, _col, idx) => sum + (columnSpans?.[idx] ?? 1), 0);
  let remainingInlineActionTracks = Math.max(0, explicitGridTracks - dataTracksUsed);

  const inlineSelectable = selectable && remainingInlineActionTracks > 0;
  if (inlineSelectable) remainingInlineActionTracks -= 1;
  const reserveRightSlotChrome = !!(rowChrome?.rightSlot && !rightSlot);
  const reserveLeftSlotChrome = !!(rowChrome?.leftSlot && !leftSlot);
  const showRightSlotChrome = !!(rightSlot || reserveRightSlotChrome);
  // Edit + delete must share the same chrome (all inline or all flex-outside).
  // A single leftover `40px` track used to put delete inside hover and edit outside.
  const editDeleteCount = (onEdit ? 1 : 0) + (onDelete ? 1 : 0);
  const inlineEditDelete =
    editDeleteCount > 0 && remainingInlineActionTracks >= editDeleteCount;
  const inlineDelete = inlineEditDelete && !!onDelete;
  if (inlineDelete) remainingInlineActionTracks -= 1;
  const inlineEdit = inlineEditDelete && !!onEdit;
  if (inlineEdit) remainingInlineActionTracks -= 1;
  const inlineRightSlot = showRightSlotChrome && remainingInlineActionTracks > 0;
  if (inlineRightSlot) remainingInlineActionTracks -= 1;
  const inlineWarning = !!warningMessage && remainingInlineActionTracks > 0;
  if (inlineWarning) remainingInlineActionTracks -= 1;

  // External chrome (outside the name/column grid): sibling of collapsed+expanded so
  // SelectionToggle / quantity cannot overlay the description body (TASK-702).
  const externalRightSlot = showRightSlotChrome && !inlineRightSlot;
  const externalEdit = !!onEdit && !inlineEdit;
  const externalDelete = !!onDelete && !inlineDelete;
  const externalSelectable = selectable && !inlineSelectable;
  const hasExternalChrome =
    externalRightSlot || externalEdit || externalDelete || externalSelectable;

  const suppressDescriptionPreview =
    isExpanded && !!descTrimmed && !expandedContent;
  const headerColumns = columnsWithoutDescriptionPreview(columns, suppressDescriptionPreview);
  const allDataColumnsAreDescription =
    columns.length > 0 && columns.every((col) => col.key === 'description');
  const nameGridColumnSpan =
    suppressDescriptionPreview && allDataColumnsAreDescription
      ? 1 + descriptionColumnTrackCount(columns, columnSpans)
      : undefined;

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

  const showRowHover = showExpander || selectable || hasExternalChrome;
  const hoverClass = showRowHover ? (rowHoverClass ?? 'hover:bg-surface-alt') : undefined;

  return (
    <div className={rowStyles}>
      {/* DESIGN_INTENT (TASK-702): hover on this chrome wrapper so quantity / selection /
          edit / delete tracks share the same highlight band as name/columns. External
          actions sit beside the content column (self-start) so + never covers expand.
          leftSlot is a sibling (not inside flex-1) so columns align with ListHeader. */}
      <div className={cn('flex items-start', hoverClass)}>
        {(leftSlot || reserveLeftSlotChrome) && (
          <div
            className="flex-shrink-0 self-start flex items-center justify-center w-8 min-w-[2rem] min-h-[44px]"
            style={
              reserveLeftSlotChrome && !leftSlot
                ? { width: GRID_LIST_ROW_LEFT_SLOT_WIDTH }
                : undefined
            }
            onClick={(e) => e.stopPropagation()}
            aria-hidden={reserveLeftSlotChrome && !leftSlot ? true : undefined}
          >
            {leftSlot}
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center min-h-[44px] min-w-0">
            <GridListRowCollapsed
              isRowClickable={isRowClickable}
              handleRowClickWithGuard={handleRowClickWithGuard}
              handleRowClick={handleRowClick}
              compact={compact}
              disabled={disabled}
              gridColumns={gridColumns}
              resolvedGridColumns={resolvedGridColumns}
              mobileGridColumns={mobileGridColumns}
              useThumbnailColumn={useThumbnailColumn}
              thumbnail={thumbnail}
              useFlex={useFlex}
              nameGridColumnSpan={nameGridColumnSpan}
              nameContent={nameContent}
              name={name}
              innate={innate}
              hideInnateBadge={hideInnateBadge}
              uses={uses}
              hideUsesInName={hideUsesInName}
              quantity={quantity}
              onQuantityChange={onQuantityChange}
              quantityMin={quantityMin}
              quantityDecrementLabel={quantityDecrementLabel}
              quantityIncrementLabel={quantityIncrementLabel}
              badges={badges}
              columns={columns}
              columnSpans={columnSpans}
              suppressDescriptionPreview={suppressDescriptionPreview}
              allDataColumnsAreDescription={allDataColumnsAreDescription}
              headerColumns={headerColumns}
              inlineWarning={inlineWarning}
              warningMessage={warningMessage}
              inlineRightSlot={inlineRightSlot}
              rightSlot={rightSlot}
              inlineEdit={inlineEdit}
              onEdit={onEdit}
              inlineDelete={inlineDelete}
              onDelete={onDelete}
              inlineSelectable={inlineSelectable}
              isSelected={isSelected}
              onSelect={onSelect}
            />
          </div>

          {gridColumns && mobileSummaryColumns.length > 0 && (
            <GridListRowMobileSummary
              mobileSummaryColumns={mobileSummaryColumns}
              isRowClickable={isRowClickable}
              handleRowBodyClickWithGuard={handleRowBodyClickWithGuard}
            />
          )}

          {isExpanded && hasDetails && (
            <GridListRowExpandedBody
              compact={compact}
              selectable={inlineSelectable}
              isRowClickable={isRowClickable}
              handleRowBodyClickWithGuard={handleRowBodyClickWithGuard}
              expandedContent={expandedContent}
              descTrimmed={descTrimmed}
              description={description}
              warningMessage={warningMessage}
              badges={badges}
              gridColumns={gridColumns}
              expandedMobileStatColumns={expandedMobileStatColumns}
              totalCost={showExpandedTotalCost ? totalCost : undefined}
              costLabel={costLabel}
              requirements={requirements}
              hasDetailSections={hasDetailSections}
              expandedDetailSections={expandedDetailSections}
              openDetailSections={openDetailSections}
              setOpenDetailSections={setOpenDetailSections}
              expandedChipIndex={expandedChipIndex}
              handleChipClick={handleChipClick}
              expandedOptionsChipIndex={expandedOptionsChipIndex}
              setExpandedOptionsChipIndex={setExpandedOptionsChipIndex}
              supplementalExpandedContent={supplementalExpandedContent}
              showActions={showActions}
              onAddToLibrary={onAddToLibrary}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
            />
          )}
        </div>

        {hasExternalChrome && (
          <GridListRowExternalChrome
            disabled={disabled}
            warningMessage={warningMessage}
            rightSlot={externalRightSlot ? rightSlot : undefined}
            reserveRightSlotChrome={externalRightSlot && reserveRightSlotChrome}
            rightSlotWidth={rightSlotWidth}
            onEdit={externalEdit ? onEdit : undefined}
            onDelete={externalDelete ? onDelete : undefined}
            selectable={externalSelectable}
            isSelected={isSelected}
            onSelect={onSelect}
          />
        )}
      </div>
    </div>
  );
});

GridListRow.displayName = 'GridListRow';
