/**
 * Creature Creator - Helper Components
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  GridListRow,
  DecrementButton,
  IncrementButton,
  type SelectableItem,
  type ColumnValue,
} from '@/components/shared';
import { Button, DescriptorChip } from '@/components/ui';
import type { DisplayItem } from '@/types/items';
import { resolveListRowThumbnail, type ListRowImageKind } from '@/lib/list-row-image';

// =============================================================================
// ChipList
// =============================================================================

export function ChipList({
  items,
  onRemove,
  color = 'bg-surface-alt text-text-secondary',
  costLabel,
}: {
  items: string[];
  onRemove: (item: string) => void;
  color?: string;
  /** Optional: return feat point cost label per item (e.g. "+1 pt"). Shown as small chip. */
  costLabel?: (item: string) => string | undefined;
}) {
  if (items.length === 0) return <p className="text-sm text-text-muted italic">None</p>;

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => {
        const cost = costLabel?.(item);
        return (
          <span
            key={item}
            className={cn('flex items-center gap-1.5 rounded px-2 py-1 text-sm', color)}
          >
            {item}
            {cost != null && cost !== '' && (
              <DescriptorChip
                variant="primary"
                size="sm"
                className="shrink-0"
                title="Feat point cost"
              >
                {cost}
              </DescriptorChip>
            )}
            <button
              onClick={() => onRemove(item)}
              className="text-text-muted hover:text-danger-fg"
              aria-label={`Remove ${item}`}
            >
              ×
            </button>
          </span>
        );
      })}
    </div>
  );
}

// =============================================================================
// ExpandableChipList
// =============================================================================

export function ExpandableChipList({
  items,
  onRemove,
  color = 'bg-surface-alt text-text-secondary',
  rowHoverClass,
  descriptions,
  costLabel,
}: {
  items: string[];
  onRemove: (item: string) => void;
  color?: string;
  rowHoverClass?: string;
  descriptions: Record<string, string>;
  /** Optional: return feat point cost label per item (e.g. "+1 pt"). Shown in rightSlot as chip. */
  costLabel?: (item: string) => string | undefined;
}) {
  if (items.length === 0) return <p className="text-sm text-text-muted italic">None</p>;

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const description = descriptions[item];
        const cost = costLabel?.(item);

        return (
          <GridListRow
            key={item}
            id={item}
            name={item}
            description={description}
            onDelete={() => onRemove(item)}
            compact
            className={color}
            rowHoverClass={rowHoverClass}
            rightSlot={
              cost != null && cost !== '' ? (
                <DescriptorChip
                  variant="primary"
                  size="sm"
                  className="shrink-0"
                  title="Feat point cost"
                >
                  {cost}
                </DescriptorChip>
              ) : undefined
            }
          />
        );
      })}
    </div>
  );
}

// =============================================================================
// AddItemDropdown
// =============================================================================

export function AddItemDropdown({
  options,
  selectedItems,
  onAdd,
  placeholder,
  costForOption,
  sectionCostLabel,
}: {
  options: readonly { value: string; label: string; description?: string }[] | readonly string[];
  selectedItems: readonly string[];
  onAdd: (item: string) => void;
  placeholder: string;
  /** Optional: return feat point cost to append to each option label (e.g. "+1 pt"). */
  costForOption?: (value: string) => string | number | undefined;
  /** Optional: short label for cost shown next to dropdown (e.g. "+1 pt each"). */
  sectionCostLabel?: string;
}) {
  const [selectedValue, setSelectedValue] = useState('');

  const normalizedOptions = [...options].map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt,
  );

  const availableOptions = normalizedOptions.filter((opt) => !selectedItems.includes(opt.value));

  const handleAdd = () => {
    if (selectedValue) {
      onAdd(selectedValue);
      setSelectedValue('');
    }
  };

  return (
    <div className="mt-2 flex flex-col gap-1">
      {sectionCostLabel && (
        <span className="text-xs font-medium text-primary-link-fg" title="Feat point cost">
          {sectionCostLabel}
        </span>
      )}
      <div className="flex items-center gap-2">
        <select
          value={selectedValue}
          onChange={(e) => setSelectedValue(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-text-primary"
          aria-label={placeholder || 'Selection'}
        >
          <option value="">{placeholder}</option>
          {availableOptions.map((opt) => {
            const costStr = costForOption?.(opt.value);
            const costSuffix =
              costStr != null && costStr !== ''
                ? ` (${typeof costStr === 'number' ? (costStr >= 0 ? '+' : '') + costStr : costStr} pt)`
                : '';
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
                {costSuffix}
              </option>
            );
          })}
        </select>
        <Button size="sm" onClick={handleAdd} disabled={!selectedValue} className="flex-shrink-0">
          Add
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// DefenseBlock
// =============================================================================

export function DefenseBlock({
  name,
  baseValue,
  bonusValue,
  onChange,
}: {
  name: string;
  baseValue: number;
  bonusValue: number;
  onChange: (value: number) => void;
}) {
  const totalValue = 10 + baseValue + bonusValue;

  return (
    <div className="rounded-lg bg-surface-alt p-3 text-center">
      <label className="mb-1 block text-xs font-medium text-text-muted uppercase">{name}</label>
      <div className="mb-1 text-2xl font-bold text-text-primary">{totalValue}</div>
      <div className="flex items-center justify-center gap-1">
        <DecrementButton
          onClick={() => onChange(Math.max(0, bonusValue - 1))}
          disabled={bonusValue <= 0}
          size="sm"
        />
        <span className="w-8 text-xs text-text-muted">+{bonusValue}</span>
        <IncrementButton onClick={() => onChange(bonusValue + 1)} size="sm" />
      </div>
    </div>
  );
}

// =============================================================================
// displayItemToSelectableItem
// =============================================================================

function selectableImageKind(category: DisplayItem['category']): ListRowImageKind | null {
  if (category === 'power') return 'power';
  if (category === 'technique') return 'technique';
  if (category === 'item') return 'equipment';
  return null;
}

/** Convert DisplayItem to SelectableItem for UnifiedSelectionModal; stores DisplayItem in data for conversion back */
export function displayItemToSelectableItem(item: DisplayItem, columns?: string[]): SelectableItem {
  const cols: ColumnValue[] = [];
  if (columns && columns.length > 0) {
    columns.forEach((key) => {
      const stat = item.stats?.find(
        (s: { label: string }) => s.label.toLowerCase() === key.toLowerCase(),
      );
      const val =
        stat?.value ??
        (key === 'Cost' && item.cost != null ? `${item.cost}${item.costLabel || ''}` : undefined) ??
        item[key as keyof DisplayItem];
      cols.push({ key, value: val != null ? String(val) : '-' });
    });
  } else if (item.stats && item.stats.length > 0) {
    item.stats.slice(0, 4).forEach((s: { label: string; value: string | number }) => {
      cols.push({ key: s.label, value: s.value ?? '-' });
    });
  } else if (item.cost != null) {
    cols.push({ key: 'Points', value: String(item.cost) });
  }
  const badges = item.badges?.map((b) => ({ label: b.label, color: 'gray' as const })) ?? [];
  const imageKind = selectableImageKind(item.category);
  const base: SelectableItem = {
    id: item.id,
    name: item.name,
    description: item.description,
    columns: cols.length > 0 ? cols : undefined,
    badges: badges.length > 0 ? badges : undefined,
    thumbnail: imageKind
      ? resolveListRowThumbnail(imageKind, item.sourceData ?? item, item.name)
      : undefined,
    data: item,
  };
  if (item.cost != null && (columns == null || columns.length === 0)) {
    (base as SelectableItem & { Points?: number }).Points =
      typeof item.cost === 'number' ? item.cost : parseInt(String(item.cost), 10) || 0;
  }
  return base;
}
