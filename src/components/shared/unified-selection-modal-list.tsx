'use client';

import { Alert } from '@/components/ui';
import { GridListRow } from './grid-list-row';
import { gridColumnsWithInlineSelection } from './grid-list-row-chrome';
import { ListHeader } from './list-header';
import { EmptyState, LoadingState } from './list-components';
import { TabContentPanel } from '@/components/ui/tab-navigation';
import type { SortState } from '@/components/shared/list-header';
import type { ColumnHeader, SelectableItem } from './unified-selection-modal-types';

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
        <EmptyState
          title={emptyMessage}
          description={emptySubMessage}
          size="sm"
        />
      ) : (
        <div className="space-y-1 min-w-0">
          {filteredItems.map(item => {
            const itemIdStr = String(item.id);
            const isSelected = selectedIds.has(itemIdStr);
            const isSelectionDisabled = Boolean(item.disabled);
            const qty = showQuantity
              ? quantities[itemIdStr] ?? (isSelected ? 1 : 0)
              : undefined;

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
                  gridColumns={
                    gridColumns ? gridColumnsWithInlineSelection(gridColumns) : undefined
                  }
                  selectable
                  isSelected={isSelected}
                  onSelect={() => onToggleSelection(item.id)}
                  disabled={isSelectionDisabled}
                  warningMessage={item.warningMessage}
                  compact
                  quantity={qty}
                  quantityMin={showQuantity ? 0 : 1}
                  quantityDecrementLabel={
                    showQuantity
                      ? `Decrease quantity for ${item.name}`
                      : undefined
                  }
                  quantityIncrementLabel={
                    showQuantity
                      ? `Increase quantity for ${item.name}`
                      : undefined
                  }
                  onQuantityChange={
                    showQuantity && !isSelectionDisabled
                      ? (delta) => onQuantityChange(itemIdStr, delta, isSelected)
                      : undefined
                  }
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
        className="flex-1 overflow-y-auto overflow-x-auto min-h-0"
      >
        {listBody}
      </TabContentPanel>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">{listBody}</div>
  );
}

export function UnifiedSelectionModalColumnHeaders({
  columns,
  gridColumns,
  hasThumbnailColumn,
  sortState,
  onSort,
}: {
  columns: ColumnHeader[];
  gridColumns?: string;
  hasThumbnailColumn: boolean;
  sortState: SortState;
  onSort: (key: string) => void;
}) {
  if (columns.length === 0) return null;

  return (
    <div className="shrink-0">
      <ListHeader
        columns={columns.map(col => ({
          key: col.key,
          label: col.label,
          sortable: col.sortable !== false,
          align: col.align,
        }))}
        gridColumns={gridColumns}
        sortState={sortState}
        onSort={onSort}
        hasSelectionColumn
        hasThumbnailColumn={hasThumbnailColumn}
        compact
      />
    </div>
  );
}
