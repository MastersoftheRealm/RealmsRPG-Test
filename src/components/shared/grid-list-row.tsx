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

import { useEffect, useId, useState, memo } from 'react';
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
  GRID_LIST_ROW_EXPANDED_BAND_CLASS,
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
  const expandedPanelId = useId();

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

  // External chrome sits in header row 1 beside name/columns (TASK-702 / TASK-710).
  // Expanded body is a separate grid row so SelectionToggle / quantity cannot overlay it.
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
  const showLeftChrome = !!(leftSlot || reserveLeftSlotChrome);
  const contentCol = showLeftChrome ? 2 : 1;
  const chromeCol = hasExternalChrome ? (showLeftChrome ? 3 : 2) : 0;
  const hasMobileSummary = !!(gridColumns && mobileSummaryColumns.length > 0);
  const summaryRow = hasMobileSummary ? 2 : 0;
  const showExpanded = isExpanded && hasDetails;
  const expandedRow = showExpanded ? (hasMobileSummary ? 3 : 2) : 0;
  const chromeGridTemplateColumns = [
    showLeftChrome ? GRID_LIST_ROW_LEFT_SLOT_WIDTH : null,
    'minmax(0, 1fr)',
    hasExternalChrome ? 'auto' : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' ');

  return (
    <div className={rowStyles}>
      {/* DESIGN_INTENT (TASK-702 / TASK-710): stretch grid so collapsed header + action
          chrome share row 1 (icons centered with name). Expanded surface-alt continues
          into the action column (same band class as the body) while + / qty / X stay in
          the header — never overlay description. Hover on this grid covers qty/edit/+.
          data-glr-row makes .btn-stepper inherit that surface (no island/hole). */}
      <div
        data-glr-row
        className={cn('grid items-stretch', hoverClass)}
        // Chrome columns only — not the data-column template (that stays on
        // --glr-desktop-grid / --glr-mobile-grid so max-lg collapse still works).
        style={{ gridTemplateColumns: chromeGridTemplateColumns }}
      >
        {showLeftChrome && (
          <div
            className="flex items-center justify-center min-h-[44px]"
            style={{ gridColumn: 1, gridRow: 1 }}
            onClick={(e) => e.stopPropagation()}
            aria-hidden={reserveLeftSlotChrome && !leftSlot ? true : undefined}
          >
            {leftSlot}
          </div>
        )}

        <div
          className="min-w-0 flex items-center min-h-[44px]"
          style={{ gridColumn: contentCol, gridRow: 1 }}
        >
          <GridListRowCollapsed
            isExpanded={showExpander ? isExpanded : undefined}
            expandedPanelId={showExpanded ? expandedPanelId : undefined}
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

        {hasExternalChrome && (
          <div
            className="flex items-center justify-center min-h-[44px]"
            style={{ gridColumn: chromeCol, gridRow: 1 }}
          >
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
          </div>
        )}

        {hasMobileSummary && (
          <div className="min-w-0" style={{ gridColumn: contentCol, gridRow: summaryRow }}>
            <GridListRowMobileSummary
              mobileSummaryColumns={mobileSummaryColumns}
              isRowClickable={isRowClickable}
              handleRowBodyClickWithGuard={handleRowBodyClickWithGuard}
            />
          </div>
        )}

        {showExpanded && (
          <>
            {showLeftChrome && (
              <div
                className={GRID_LIST_ROW_EXPANDED_BAND_CLASS}
                style={{ gridColumn: 1, gridRow: expandedRow }}
                aria-hidden
              />
            )}
            <div id={expandedPanelId} className="min-w-0" style={{ gridColumn: contentCol, gridRow: expandedRow }}>
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
            </div>
            {hasExternalChrome && (
              <div
                className={GRID_LIST_ROW_EXPANDED_BAND_CLASS}
                style={{ gridColumn: chromeCol, gridRow: expandedRow }}
                aria-hidden
              />
            )}
          </>
        )}
      </div>
    </div>
  );
});

GridListRow.displayName = 'GridListRow';
