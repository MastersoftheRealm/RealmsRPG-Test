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
import { Button } from '@/components/ui';
import type { DisplayItem } from '@/types/items';

// =============================================================================
// ChipList
// =============================================================================

export function ChipList({
  items,
  onRemove,
  color = 'bg-surface-alt text-text-secondary',
}: {
  items: string[];
  onRemove: (item: string) => void;
  color?: string;
}) {
  if (items.length === 0) return <p className="text-sm text-text-muted italic">None</p>;

  return (
    <div className="flex flex-wrap gap-1">
      {items.map(item => (
        <span
          key={item}
          className={cn('px-2 py-1 rounded text-sm flex items-center gap-1', color)}
        >
          {item}
          <button
            onClick={() => onRemove(item)}
            className="text-text-muted hover:text-danger-500"
          >
            ×
          </button>
        </span>
      ))}
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
}: {
  items: string[];
  onRemove: (item: string) => void;
  color?: string;
  rowHoverClass?: string;
  descriptions: Record<string, string>;
}) {
  if (items.length === 0) return <p className="text-sm text-text-muted italic">None</p>;

  return (
    <div className="flex flex-col gap-2">
      {items.map(item => {
        const description = descriptions[item];

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
}: {
  options: readonly { value: string; label: string }[] | readonly string[];
  selectedItems: readonly string[];
  onAdd: (item: string) => void;
  placeholder: string;
}) {
  const [selectedValue, setSelectedValue] = useState('');

  const normalizedOptions = [...options].map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const availableOptions = normalizedOptions.filter(opt => !selectedItems.includes(opt.value));

  const handleAdd = () => {
    if (selectedValue) {
      onAdd(selectedValue);
      setSelectedValue('');
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <select
        value={selectedValue}
        onChange={e => setSelectedValue(e.target.value)}
        className="flex-1 min-w-0 px-3 py-2 border border-border-light rounded-lg text-sm bg-surface"
      >
        <option value="">{placeholder}</option>
        {availableOptions.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <Button size="sm" onClick={handleAdd} disabled={!selectedValue} className="flex-shrink-0">
        Add
      </Button>
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
    <div className="p-3 bg-surface-alt rounded-lg text-center">
      <label className="block text-xs font-medium text-text-muted mb-1 uppercase">{name}</label>
      <div className="text-2xl font-bold text-text-primary mb-1">{totalValue}</div>
      <div className="flex items-center justify-center gap-1">
        <DecrementButton
          onClick={() => onChange(Math.max(0, bonusValue - 1))}
          disabled={bonusValue <= 0}
          size="sm"
        />
        <span className="text-xs text-text-muted w-8">+{bonusValue}</span>
        <IncrementButton onClick={() => onChange(bonusValue + 1)} size="sm" />
      </div>
    </div>
  );
}

// =============================================================================
// displayItemToSelectableItem
// =============================================================================

/** Convert DisplayItem to SelectableItem for UnifiedSelectionModal; stores DisplayItem in data for conversion back */
export function displayItemToSelectableItem(item: DisplayItem, columns?: string[]): SelectableItem {
  const cols: ColumnValue[] = [];
  if (columns && columns.length > 0) {
    columns.forEach(key => {
      const stat = item.stats?.find((s: { label: string }) => s.label.toLowerCase() === key.toLowerCase());
      const val = stat?.value ?? (key === 'Cost' && item.cost != null ? `${item.cost}${item.costLabel || ''}` : undefined) ?? item[key as keyof DisplayItem];
      cols.push({ key, value: val != null ? String(val) : '-' });
    });
  } else if (item.stats && item.stats.length > 0) {
    item.stats.slice(0, 4).forEach((s: { label: string; value: string | number }) => {
      cols.push({ key: s.label, value: s.value ?? '-' });
    });
  } else if (item.cost != null) {
    cols.push({ key: 'Points', value: `${item.cost}${item.costLabel || ''}` });
  }
  const badges = item.badges?.map(b => ({ label: b.label, color: 'gray' as const })) ?? [];
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    columns: cols.length > 0 ? cols : undefined,
    badges: badges.length > 0 ? badges : undefined,
    data: item,
  };
}
