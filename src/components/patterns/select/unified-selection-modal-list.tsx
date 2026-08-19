'use client';

import { Alert } from '@/components/ui';
import { GridListRow } from '../list/grid-list-row';
import { ListHeader } from '../list/list-header';
import { EmptyState, LoadingState } from '../list/list-components';
import { QuantitySelector } from './quantity-selector';
import { TabContentPanel } from '@/components/ui/tab-navigation';
import type { SortState } from '@/components/patterns/list/list-header';
import type { ColumnHeader, SelectableItem } from './unified-selection-modal-types';

/** Far-right quantity stepper width (replaces selection + when showQuantity).
 * Fits ValueStepper md (2×32px + value) on desktop and 44px touch targets on mobile (TASK-688).
 * Must match GridListRow `rightSlotWidth` and ListHeader `rightSlotWidth` (TASK-702). */
export const USM_QUANTITY_RIGHT_SLOT_WIDTH = '7.5rem';

export interface UnifiedSelectionModalListProps {
  isLoading: boolean;
  error: Error | null;
  filteredItems: SelectableItem[];
  emptyMessage: string;
  emptySubMessage?: string;
  gridColumns?: string;
  selectedIds: Set<string>;
  quantities: Record<string, number>;
  showQuantity: boolean;
  onToggleSelection: (id: string | number) => void;
  onQuantityChange: (itemIdStr: string, delta: number, isSelected: boolean) => void;
  tabPanelA11y?: {
    tabGroupId: string;
    id: string;
    activeTab: string;
  };
}

export function UnifiedSelectionModalList({
  isLoading,
  error,
  filteredItems,
  emptyMessage,
  emptySubMessage,
  gridColumns,
  selectedIds,
  quantities,
  showQuantity,
  onToggleSelection,
  onQuantityChange,
  tabPanelA11y,
}: UnifiedSelectionModalListProps) {
  const listBody = (
    <>
      {isLoading ? (
        <LoadingState message="Loading..." size="md" padding="md" />
      ) : error ? (
        <Alert variant="danger" className="mx-4">
          {error.message}
        </Alert>
      ) : filteredItems.length === 0 ? (
        <EmptyState title={emptyMessage} description={emptySubMessage} size="sm" />
      ) : (
        <div className="flex min-w-0 flex-col gap-1">
          {filteredItems.map((item) => {
            const itemIdStr = String(item.id);
            const isSelected = selectedIds.has(itemIdStr);
            const isSelectionDisabled = Boolean(item.disabled);
            const qty = showQuantity ? (quantities[itemIdStr] ?? (isSelected ? 1 : 0)) : undefined;

            return (
              <div key={itemIdStr} className="min-w-0">
                <GridListRow
                  id={itemIdStr}
                  name={item.name}
                  description={item.description}
                  thumbnail={item.thumbnail}
                  columns={item.columns}
                  chips={item.chips}
                  detailSections={item.detailSections}
                  totalCost={item.totalCost}
                  costLabel={item.costLabel}
                  badges={item.badges}
                  showBadgesInName={item.showBadgesInName}
                  gridColumns={gridColumns}
                  // Quantity-first: stepper on the far right replaces the + selection toggle
                  // (TASK-685). Selection + is external chrome (not an inline grid track) so
                  // expand never paints under the toggle (TASK-702).
                  selectable={!showQuantity}
                  isSelected={isSelected}
                  onSelect={() => onToggleSelection(item.id)}
                  disabled={isSelectionDisabled}
                  warningMessage={item.warningMessage}
                  compact
                  rightSlot={
                    showQuantity ? (
                      <QuantitySelector
                        quantity={qty ?? 0}
                        onChange={(next) =>
                          onQuantityChange(itemIdStr, next - (qty ?? 0), isSelected)
                        }
                        size="sm"
                        min={0}
                        disabled={isSelectionDisabled}
                        decrementLabel={`Decrease quantity for ${item.name}`}
                        incrementLabel={`Increase quantity for ${item.name}`}
                      />
                    ) : undefined
                  }
                  rightSlotWidth={showQuantity ? USM_QUANTITY_RIGHT_SLOT_WIDTH : undefined}
                  rowChrome={showQuantity ? { rightSlot: true } : { externalSelection: true }}
                />
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  if (tabPanelA11y) {
    return (
      <TabContentPanel
        tabGroupId={tabPanelA11y.tabGroupId}
        id={tabPanelA11y.id}
        activeTab={tabPanelA11y.activeTab}
        className="min-h-0 flex-1 overflow-x-auto overflow-y-auto"
      >
        {listBody}
      </TabContentPanel>
    );
  }

  return <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">{listBody}</div>;
}

export function UnifiedSelectionModalColumnHeaders({
  columns,
  gridColumns,
  hasThumbnailColumn,
  sortState,
  onSort,
  showQuantity = false,
}: {
  columns: ColumnHeader[];
  gridColumns?: string;
  hasThumbnailColumn: boolean;
  sortState: SortState;
  onSort: (key: string) => void;
  /** When true, reserve far-right qty chrome instead of the selection + column. */
  showQuantity?: boolean;
}) {
  if (columns.length === 0) return null;

  return (
    <div className="shrink-0">
      <ListHeader
        columns={columns.map((col) => ({
          key: col.key,
          label: col.label,
          sortable: col.sortable !== false,
          align: col.align,
        }))}
        gridColumns={gridColumns}
        sortState={sortState}
        onSort={onSort}
        hasSelectionColumn={false}
        rowChrome={showQuantity ? undefined : { externalSelection: true }}
        rightSlotWidth={showQuantity ? USM_QUANTITY_RIGHT_SLOT_WIDTH : undefined}
        hasThumbnailColumn={hasThumbnailColumn}
        compact
      />
    </div>
  );
}
