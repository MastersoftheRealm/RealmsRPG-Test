'use client';

import { Edit, Copy, Plus, AlertCircle } from 'lucide-react';
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
import { columnDisplayLabel } from './grid-list-row-columns';
import { DetailSectionLabel, partsPropertiesHelpContent } from './grid-list-row-detail';
import type { ColumnValue } from './grid-list-row-types';

interface GridListRowExpandedBodyProps {
  compact: boolean;
  selectable: boolean;
  isRowClickable: boolean;
  handleRowBodyClickWithGuard: (e: MouseEvent) => void;
  expandedContent?: ReactNode;
  descTrimmed: string;
  description?: string;
  warningMessage?: string;
  badges: Array<{ label: string; color?: 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red' }>;
  gridColumns?: string;
  expandedMobileStatColumns: ColumnValue[];
  totalCost?: number;
  costLabel: string;
  requirements?: ReactNode;
  hasDetailSections: boolean;
  expandedDetailSections: MetadataDetailSection[];
  openDetailSections: Record<string, boolean>;
  setOpenDetailSections: Dispatch<SetStateAction<Record<string, boolean>>>;
  expandedChipIndex: number | null;
  handleChipClick: (index: number, e: MouseEvent) => void;
  expandedOptionsChipIndex: number | null;
  setExpandedOptionsChipIndex: Dispatch<SetStateAction<number | null>>;
  supplementalExpandedContent?: ReactNode;
  showActions?: boolean;
  onAddToLibrary?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
}

export function GridListRowExpandedBody({
  compact,
  selectable,
  isRowClickable,
  handleRowBodyClickWithGuard,
  expandedContent,
  descTrimmed,
  description,
  warningMessage,
  badges,
  gridColumns,
  expandedMobileStatColumns,
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
              <DescriptorChip variant="listCost">
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
            const sectionOpen = collapsible
              ? (openDetailSections[sectionKey] ?? false)
              : true;
            const helpKey =
              section.labelHelpKey ?? helpKeyForPartsOrPropertiesLabel(section.label);
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
                  <div data-chip-group className="flex flex-wrap gap-2 items-start">
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
  );
}

interface GridListRowMobileSummaryProps {
  mobileSummaryColumns: ColumnValue[];
  isRowClickable: boolean;
  handleRowBodyClickWithGuard: (e: MouseEvent) => void;
}

/** Mobile summary — stats hidden from the collapsed grid; description teaser hides while expanded. */
export function GridListRowMobileSummary({
  mobileSummaryColumns,
  isRowClickable,
  handleRowBodyClickWithGuard,
}: GridListRowMobileSummaryProps) {
  return (
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
  );
}
