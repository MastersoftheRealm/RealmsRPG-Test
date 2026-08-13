/**
 * GuidedInlineCatalogList — L3 "full Customize" catalog rendered directly in a
 * guided-creator step body (no modal), with selected items shown as removable
 * GLR rows above the browsable list (TASK-684).
 *
 * Reuses the same `SelectableItem[]` rendering pieces as `UnifiedSelectionModal`
 * (`UnifiedSelectionModalList` / column headers) so filtering, eligibility, and
 * row chrome (disabled/warningMessage/badges/detailSections/totalCost) stay in
 * lockstep with the L2 modal — no parallel list-rendering logic. Selection is
 * immediate (toggle-on-click), matching L1 choice cards; there is no separate
 * confirm step since the step's own Continue action is the confirmation.
 *
 * Intended for any guided-creator L3 screen (feats, weapons/armor/gear,
 * powers/techniques) — keep this generic; put domain copy/columns in the caller.
 */

'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, Card, IconButton } from '@/components/ui';
import { SearchInput } from '@/components/ui/search-input';
import { useSort } from '@/hooks/use-sort';
import { GridListRow } from '../grid-list-row';
import { ListHeader } from '../list-header';
import { FilterSection } from '../filters/filter-section';
import { QuantitySelector } from '../quantity-selector';
import {
  UnifiedSelectionModalColumnHeaders,
  UnifiedSelectionModalList,
  USM_QUANTITY_RIGHT_SLOT_WIDTH,
} from '../unified-selection-modal-list';
import type { ColumnHeader, SelectableItem } from '../unified-selection-modal-types';

/** Card inset for the selected-items panel — shared horizontal cushion + balanced vertical rhythm (TASK-700). */
const GUIDED_INLINE_CATALOG_SELECTED_PANEL_CHROME =
  'px-4 pt-3 pb-3 flex flex-col gap-2';

export interface GuidedInlineCatalogListProps {
  /** Full eligible catalog (already filtered/flagged by the same builder used for the L2 modal). */
  items: SelectableItem[];
  selectedIds: Set<string>;
  /**
   * Immediate toggle — required for non-quantity catalogs. Omit when `showQuantity` (TASK-685):
   * the far-right qty stepper is the only add/remove path.
   */
  onToggleSelection?: (id: string) => void;
  isLoading?: boolean;
  error?: Error | null;
  columns?: ColumnHeader[];
  gridColumns?: string;
  /** "feat", "weapon", "power", etc. — used in default copy. */
  itemLabel?: string;
  emptyMessage?: string;
  emptySubMessage?: string;
  searchPlaceholder?: string;
  searchFields?: (keyof SelectableItem)[];
  /** Filter panel content (reuse the same fields as the L2 modal's filterContent). */
  filterContent?: ReactNode;
  showFilters?: boolean;
  optionsActiveCount?: number;
  optionsSummary?: ReactNode;
  optionsLabel?: string;
  /** Always-visible chrome above the toolbar (e.g. a type toggle) — mirrors USM `scopeExtra`. */
  scopeExtra?: ReactNode;
  maxSelections?: number;
  selectionLimitMessage?: string;
  /** Heading for the selected-items panel above the list; omit to hide the title row. */
  selectedTitle?: ReactNode;
  /** Optional count/progress chip beside the selected title (e.g. "2 / 3"). */
  selectedCountLabel?: ReactNode;
  /** Override the default remove button per selected row (rarely needed). */
  renderSelectedRightSlot?: (item: SelectableItem) => ReactNode;
  /** Per-item quantity stepper (gear-style rows) — mirrors USM showQuantity/quantities. */
  showQuantity?: boolean;
  quantities?: Record<string, number>;
  onQuantityChange?: (itemIdStr: string, delta: number, isSelected: boolean) => void;
  /** Budget/status chrome below the list (e.g. `LoadoutBudgetBar` currency + TP totals). */
  footer?: ReactNode;
  className?: string;
}

export function GuidedInlineCatalogList({
  items,
  selectedIds,
  onToggleSelection,
  isLoading = false,
  error = null,
  columns = [],
  gridColumns,
  itemLabel = 'item',
  emptyMessage,
  emptySubMessage,
  searchPlaceholder,
  searchFields = ['name', 'description'],
  filterContent,
  showFilters = false,
  optionsActiveCount = 0,
  optionsSummary,
  optionsLabel = 'Filters',
  scopeExtra,
  maxSelections,
  selectionLimitMessage,
  selectedTitle,
  selectedCountLabel,
  renderSelectedRightSlot,
  showQuantity = false,
  quantities = {},
  onQuantityChange,
  footer,
  className,
}: GuidedInlineCatalogListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  const { sortState, handleSort, sortItems } = useSort('name');

  const filteredItems = useMemo(() => {
    let result = items;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          return typeof value === 'string' && value.toLowerCase().includes(query);
        })
      );
    }
    return sortItems(result);
  }, [items, searchQuery, searchFields, sortItems]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(String(item.id))),
    [items, selectedIds]
  );

  const hasThumbnailColumn = useMemo(
    () => items.some((item) => Boolean(item.thumbnail)),
    [items]
  );

  const overSelectionLimit = maxSelections !== undefined && selectedIds.size > maxSelections;
  const showLimitWarning = maxSelections !== undefined && (maxSelections === 0 || overSelectionLimit);
  const resolvedSearchPlaceholder = searchPlaceholder || `Search ${itemLabel}s...`;
  const resolvedEmptyMessage = emptyMessage || `No ${itemLabel}s found`;
  const hasOptions = Boolean(showFilters && filterContent);

  const searchField = (
    <SearchInput
      value={searchQuery}
      onChange={setSearchQuery}
      placeholder={resolvedSearchPlaceholder}
      aria-label={resolvedSearchPlaceholder}
    />
  );

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {selectedItems.length > 0 ? (
        <Card className="bg-surface-alt dark:bg-surface overflow-hidden p-0">
          <div className={GUIDED_INLINE_CATALOG_SELECTED_PANEL_CHROME}>
            {selectedTitle ? (
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-text-primary">{selectedTitle}</h3>
                {selectedCountLabel}
              </div>
            ) : null}
            <ListHeader
              columns={columns.map((c) => ({ key: c.key, label: c.label, sortable: false, align: c.align }))}
              gridColumns={gridColumns}
              compact
              hasThumbnailColumn={hasThumbnailColumn}
              rowChrome={showQuantity ? undefined : { rightSlot: true }}
              rightSlotWidth={showQuantity ? USM_QUANTITY_RIGHT_SLOT_WIDTH : undefined}
              hasSelectionColumn={false}
              className="mb-0"
            />
            <div className="flex flex-col gap-1">
              {selectedItems.map((item) => {
                const idStr = String(item.id);
                const qty = showQuantity
                  ? quantities[idStr] ?? 1
                  : undefined;
                return (
                  <GridListRow
                    key={idStr}
                    id={idStr}
                    name={item.name}
                    description={item.description}
                    thumbnail={item.thumbnail}
                    columns={item.columns}
                    gridColumns={gridColumns}
                    detailSections={item.detailSections}
                    totalCost={item.totalCost}
                    costLabel={item.costLabel}
                    badges={item.badges}
                    rightSlot={
                      renderSelectedRightSlot ? (
                        renderSelectedRightSlot(item)
                      ) : showQuantity ? (
                        <QuantitySelector
                          quantity={qty ?? 1}
                          onChange={(next) =>
                            onQuantityChange?.(idStr, next - (qty ?? 1), true)
                          }
                          size="sm"
                          min={0}
                          decrementLabel={`Decrease quantity for ${item.name}`}
                          incrementLabel={`Increase quantity for ${item.name}`}
                        />
                      ) : (
                        <IconButton
                          variant="danger"
                          size="sm"
                          onClick={() => onToggleSelection?.(idStr)}
                          label={`Remove ${item.name}`}
                        >
                          <X className="w-4 h-4" />
                        </IconButton>
                      )
                    }
                    rightSlotWidth={showQuantity ? USM_QUANTITY_RIGHT_SLOT_WIDTH : undefined}
                    rowChrome={{ rightSlot: true }}
                    compact
                  />
                );
              })}
            </div>
          </div>
        </Card>
      ) : null}

      <div className="flex flex-col gap-2">
        {hasOptions ? (
          <FilterSection
            variant="compact"
            label={optionsLabel}
            expanded={optionsExpanded}
            onExpandedChange={setOptionsExpanded}
            activeCount={optionsActiveCount}
            summary={optionsSummary}
            toolbarStart={searchField}
            belowToolbar={scopeExtra}
          >
            {filterContent}
          </FilterSection>
        ) : (
          <div className="space-y-2">
            {searchField}
            {scopeExtra ? <div className="shrink-0">{scopeExtra}</div> : null}
          </div>
        )}

        {showLimitWarning ? (
          <Alert variant="warning">
            {selectionLimitMessage ??
              (maxSelections === 0
                ? 'You cannot add more right now. Free up capacity first, then try again.'
                : `You've selected more than the limit (max ${maxSelections}). Deselect some to continue.`)}
          </Alert>
        ) : null}

        <UnifiedSelectionModalColumnHeaders
          columns={columns}
          gridColumns={gridColumns}
          hasThumbnailColumn={hasThumbnailColumn}
          sortState={sortState}
          onSort={handleSort}
          showQuantity={showQuantity}
        />

        <UnifiedSelectionModalList
          isLoading={isLoading}
          error={error}
          filteredItems={filteredItems}
          emptyMessage={resolvedEmptyMessage}
          emptySubMessage={emptySubMessage}
          gridColumns={gridColumns}
          selectedIds={selectedIds}
          quantities={quantities}
          showQuantity={showQuantity}
          onToggleSelection={(id) => onToggleSelection?.(String(id))}
          onQuantityChange={onQuantityChange ?? (() => {})}
        />

        {footer}
      </div>
    </div>
  );
}
