'use client';

import { GridListRow, ListHeader } from '@/components/shared';
import { Card, IconButton } from '@/components/ui';
import { resolveListRowThumbnail } from '@/lib/list-row-image';
import { X } from 'lucide-react';
import type {
  AdvancedEquipmentItem,
  AdvancedSelectedItem,
} from '@/lib/creator/advanced-equipment-catalog';
import {
  RIGHT_SLOT_WIDTH,
  SELECTED_EQUIPMENT_COLUMNS,
  SELECTED_EQUIPMENT_GRID,
} from './list-columns';

export interface SelectedEquipmentListProps {
  selectedItems: AdvancedSelectedItem[];
  allEquipment: AdvancedEquipmentItem[];
  onAddItemWithQuantity: (item: AdvancedEquipmentItem, qty: number) => void;
  onRemoveItem: (itemId: string) => void;
}

export function SelectedEquipmentList({
  selectedItems,
  allEquipment,
  onAddItemWithQuantity,
  onRemoveItem,
}: SelectedEquipmentListProps) {
  if (selectedItems.length === 0) return null;

  const totalQuantity = selectedItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Card className="mb-6 overflow-hidden bg-surface-alt p-0 dark:bg-surface">
      <h3 className="px-4 pt-4 pb-2 font-medium text-text-primary">
        Selected Equipment ({totalQuantity} items)
      </h3>
      <ListHeader
        columns={SELECTED_EQUIPMENT_COLUMNS.map((c) => ({
          ...c,
          align: (c.align as 'left' | 'center' | 'right') ?? 'left',
        }))}
        gridColumns={SELECTED_EQUIPMENT_GRID}
        rightSlotWidth={RIGHT_SLOT_WIDTH}
        compact
        hasThumbnailColumn
      />
      <div className="flex flex-col gap-1 pb-2">
        {selectedItems.map((item) => {
          const fullItem = allEquipment.find((e) => e.id === item.id);
          const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);
          const costTotal = item.cost * item.quantity;
          const thumbnail = resolveListRowThumbnail('equipment', fullItem ?? item, item.name);
          return (
            <GridListRow
              key={item.id}
              id={item.id}
              name={item.name}
              description={fullItem?.description || undefined}
              thumbnail={thumbnail}
              columns={[
                { key: 'type', value: typeLabel, align: 'center' as const },
                { key: 'cost', value: `${costTotal}c`, align: 'right' as const },
              ]}
              gridColumns={SELECTED_EQUIPMENT_GRID}
              quantity={item.quantity}
              onQuantityChange={(delta) => {
                if (delta > 0 && fullItem) {
                  onAddItemWithQuantity(fullItem, delta);
                } else if (delta < 0) {
                  for (let i = 0; i < -delta; i++) onRemoveItem(item.id);
                }
              }}
              rightSlot={
                <IconButton
                  variant="danger"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                  label={`Remove ${item.name}`}
                >
                  <X className="h-4 w-4" />
                </IconButton>
              }
              compact
            />
          );
        })}
      </div>
    </Card>
  );
}
