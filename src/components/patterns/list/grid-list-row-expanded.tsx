'use client';

import { Edit, Copy, BookPlus, AlertCircle } from 'lucide-react';
import type { Dispatch, MouseEvent, ReactNode, SetStateAction } from 'react';
import { cn } from '@/lib/utils';
import { formatCostDisplay } from '@/lib/game/creator-constants';
import { Button, DescriptorChip } from '@/components/ui';
import { GridListChip } from './grid-list-chip';
import { descriptorChipVariantForBadgeColor } from '@/lib/chip/grid-list-chip-utils';
import {
  helpKeyForPartsOrPropertiesLabel,
  isPartsOrPropertiesProficienciesSection,
  type MetadataDetailSection,
} from '@/lib/chip/list-row-metadata';
import { columnDisplayLabel, columnHasInteractiveValue } from './grid-list-row-columns';
import { GRID_LIST_ROW_EXPANDED_BAND_CLASS } from './grid-list-row-chrome';
import { DetailSectionLabel, partsPropertiesHelpContent } from './grid-list-row-detail';
import type { ColumnValue } from './grid-list-row-types';

interface GridListRowExpandedBodyProps {
  compact: boolean;
  selectable: boolean;
  isRowClickable: boolean;
  handleRowBodyClickWithGuard: (e: MouseEvent) => void;
  expandedContent?: ReactNode | undefined;
  descTrimmed: string;
  description?: string | undefined;
  descriptionAfter?: ReactNode | undefined;
  warningMessage?: string | undefined;
  badges: Array<{
    label: string;
    color?: 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red' | undefined;
  }>;
  gridColumns?: string | undefined;
  expandedBodyStatColumns: ColumnValue[];
  totalCost?: number | undefined;
  costLabel: string;
  requirements?: ReactNode | undefined;
  hasDetailSections: boolean;
  expandedDetailSections: MetadataDetailSection[];
  openDetailSections: Record<string, boolean>;
  setOpenDetailSections: Dispatch<SetStateAction<Record<string, boolean>>>;
  expandedChipIndex: number | null;
  handleChipClick: (index: number, e: MouseEvent) => void;
  expandedOptionsChipIndex: number | null;
  setExpandedOptionsChipIndex: Dispatch<SetStateAction<number | null>>;
  supplementalExpandedContent?: ReactNode | undefined;
  showActions?: boolean | undefined;
  onAddToLibrary?: (() => void) | undefined;
  onEdit?: (() => void) | undefined;
  onDuplicate?: (() => void) | undefined;
}

export function GridListRowExpandedBody({
  compact,
  selectable,
  isRowClickable,
  handleRowBodyClickWithGuard,
  expandedContent,
  descTrimmed,
  description,
  descriptionAfter,
  warningMessage,
  badges,
  gridColumns,
  expandedBodyStatColumns,
  totalCost,
  costLabel,
  requirements,
  hasDetailSections,
  expandedDetailSections,
  openDetailSections,
  setOpenDetailSections,
  expandedChipIndex,
  handleChipClick,
  expandedOptionsChipIndex,
  setExpandedOptionsChipIndex,
  supplementalExpandedContent,
  showActions,
  onAddToLibrary,
  onEdit,
  onDuplicate,
}: GridListRowExpandedBodyProps) {
  return (
    <div
      className={cn(
        GRID_LIST_ROW_EXPANDED_BAND_CLASS,
        compact ? 'px-3 py-3' : 'px-4 py-4',
        // Only indent when selection is an *inline* grid track (header + lives in the
        // collapsed grid). External SelectionToggle is a sibling column — no mr needed
        // (TASK-702). Callers pass selectable={inlineSelectable} from GridListRow.
        selectable && 'mr-10',
        isRowClickable && 'cursor-pointer',
      )}
      onClick={isRowClickable ? handleRowBodyClickWithGuard : undefined}
    >
      {/* Custom expanded content takes precedence */}
      {expandedContent ? (
        expandedContent
      ) : (
        <>
          {descTrimmed && !descriptionAfter && (
            <p className="mb-3 rounded-lg bg-surface p-3 text-sm text-text-secondary">
              {description}
            </p>
          )}
          {descriptionAfter ? (
            <div className="mb-3 rounded-lg bg-surface p-3 text-sm text-text-secondary">
              {descTrimmed ? <p>{description}</p> : null}
              <div
                className={cn(
                  'whitespace-pre-wrap',
                  descTrimmed && 'mt-3 border-t border-border-light pt-3',
                )}
              >
                {descriptionAfter}
              </div>
            </div>
          ) : null}

          {/* Warning message */}
          {warningMessage && (
            <p className="mb-3 flex items-center gap-1 text-xs text-warning-fg">
              <AlertCircle className="h-3 w-3" />
              {warningMessage}
            </p>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {badges.map((badge, i) => (
                <DescriptorChip key={i} variant={descriptorChipVariantForBadgeColor(badge.color)}>
                  {badge.label}
                </DescriptorChip>
              ))}
            </div>
          )}

          {/* Column facts (collapsed header when row is closed; body when expanded — TASK-868/898) */}
          {gridColumns && expandedBodyStatColumns.length > 0 && (
            <div className="mb-4 flex flex-col gap-3 text-sm min-[480px]:grid min-[480px]:grid-cols-2 min-[480px]:gap-x-4 min-[480px]:gap-y-2">
              {expandedBodyStatColumns.map((col) => {
                const interactive = columnHasInteractiveValue(col);
                return (
                  <div
                    key={col.key}
                    className={cn(
                      'min-w-0',
                      interactive
                        ? 'flex flex-col gap-1 min-[480px]:col-span-2'
                        : 'flex min-w-0 items-center gap-2',
                    )}
                  >
                    <span className="shrink-0 text-text-muted">{columnDisplayLabel(col)}:</span>
                    {interactive ? (
                      <div className="min-w-0">{col.value}</div>
                    ) : (
                      <span
                        className={cn(
                          'min-w-0 font-medium text-text-primary',
                          col.highlight && 'text-primary-link-fg',
                          col.className,
                        )}
                      >
                        {col.value}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Total Cost */}
          {totalCost !== undefined && totalCost > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <DescriptorChip variant="listCost">
                Total {costLabel}: {formatCostDisplay(totalCost)}
              </DescriptorChip>
            </div>
          )}

          {/* Requirements - legacy raw content; prefer detailSections for structured display */}
          {requirements && !hasDetailSections && <div className="mb-4 text-sm">{requirements}</div>}

          {/* Detail sections (+ legacy chips normalized above) */}
          {expandedDetailSections.map((section, sectionIdx) => {
            const sectionChips = section.chips;
            if (sectionChips.length === 0) return null;
            const showLabel = !section.hideLabelIfSingle || sectionChips.length > 1;
            const sectionOffset = expandedDetailSections
              .slice(0, sectionIdx)
              .reduce((sum, s) => sum + s.chips.length, 0);
            const collapsible = isPartsOrPropertiesProficienciesSection(section);
            const sectionKey = `detail-${sectionIdx}`;
            const sectionOpen = collapsible ? (openDetailSections[sectionKey] ?? false) : true;
            const helpKey = section.labelHelpKey ?? helpKeyForPartsOrPropertiesLabel(section.label);
            const helpContent = helpKey ? partsPropertiesHelpContent(helpKey) : null;
            return (
              <div key={sectionIdx} className={cn('space-y-3', sectionIdx > 0 && 'mt-4')}>
                {showLabel && (
                  <DetailSectionLabel
                    label={section.label}
                    collapsible={collapsible}
                    open={sectionOpen}
                    onToggle={() =>
                      setOpenDetailSections((prev) => ({
                        ...prev,
                        [sectionKey]: !sectionOpen,
                      }))
                    }
                    helpContent={helpContent}
                  />
                )}
                {sectionOpen && (
                  <div data-chip-group className="flex flex-wrap items-start gap-2">
                    {sectionChips.map((chip, chipIdx) => {
                      const index = sectionOffset + chipIdx;
                      return (
                        <GridListChip
                          key={`${chip.name}-${chip.category ?? 'default'}-${chipIdx}`}
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
                )}
              </div>
            );
          })}

          {supplementalExpandedContent}

          {/* Action Buttons (Edit, Duplicate, Add to library - Delete is inline X in row) */}
          {showActions && (
            <div className="mt-4 flex items-center gap-2 border-t border-border-light pt-4">
              {onAddToLibrary && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToLibrary();
                  }}
                >
                  <BookPlus className="h-4 w-4" />
                  Add to my library
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
              {onDuplicate && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface GridListRowMobileSummaryProps {
  mobileSummaryColumns: ColumnValue[];
  isRowClickable: boolean;
  handleRowBodyClickWithGuard: (e: MouseEvent) => void;
}

/** Mobile summary — stats hidden from the collapsed grid; omitted while expanded (body owns them). */
export function GridListRowMobileSummary({
  mobileSummaryColumns,
  isRowClickable,
  handleRowBodyClickWithGuard,
}: GridListRowMobileSummaryProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-2 px-4 pb-2 text-xs text-text-secondary lg:hidden',
        isRowClickable && 'cursor-pointer',
      )}
      onClick={isRowClickable ? handleRowBodyClickWithGuard : undefined}
    >
      {mobileSummaryColumns.map((col) =>
        col.key === 'description' ? (
          <div
            key={col.key}
            className={cn(
              'w-full min-w-0 text-text-secondary',
              col.className,
              col.highlight && 'font-medium text-primary-link-fg',
            )}
          >
            {col.value}
          </div>
        ) : (
          <span key={col.key} className="flex items-center gap-1">
            <span className="text-text-muted">{columnDisplayLabel(col)}:</span>
            <span className={cn(col.highlight && 'font-medium text-primary-link-fg')}>
              {col.value}
            </span>
          </span>
        ),
      )}
    </div>
  );
}
