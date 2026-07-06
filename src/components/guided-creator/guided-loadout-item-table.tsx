/**
 * Guided loadout item list — ListHeader + GridListRow (library/codex pattern).
 */

'use client';

import { GridListRow, ListHeader } from '@/components/shared';
import type { ResolvedLoadoutItem } from '@/lib/guided-creator/resolve-loadout-items';

/**
 * Fractional tracks (equipment-step pattern) — shared on ListHeader + GridListRow.
 * @see UnifiedSelectionModal — append `gridColumnsWithInlineSelection` + `hasSelectionColumn` when selectable.
 */
export const LOADOUT_ITEM_GRID_COLUMNS = '1.6fr 0.7fr 1fr';

/** Base four-column grid for mix-and-match; selection column added via unified modal pattern. */
export const LOADOUT_CUSTOMIZE_GRID_COLUMNS = '1.6fr 0.55fr 3.5rem 1fr';

export const LOADOUT_CUSTOMIZE_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME', align: 'left' as const, sortable: false as const },
  { key: 'type', label: 'TYPE', align: 'center' as const, sortable: false as const },
  { key: 'tp', label: 'TP', align: 'center' as const, sortable: false as const },
  { key: 'stats', label: 'STATS', align: 'right' as const, sortable: false as const },
] as const;

export const LOADOUT_ITEM_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME', align: 'left' as const, sortable: false as const },
  { key: 'type', label: 'TYPE', align: 'center' as const, sortable: false as const },
  { key: 'stats', label: 'STATS', align: 'right' as const, sortable: false as const },
];

function displayName(item: ResolvedLoadoutItem): string {
  return item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name;
}

function statsCell(item: ResolvedLoadoutItem): string {
  if (item.statsLine) return item.statsLine;
  if (item.quantity > 1) return `Qty ${item.quantity}`;
  return '—';
}

export interface GuidedLoadoutItemTableProps {
  items: ResolvedLoadoutItem[];
  className?: string;
}

export function GuidedLoadoutItemTable({ items, className }: GuidedLoadoutItemTableProps) {
  if (items.length === 0) return null;

  return (
    <div className={className}>
      <ListHeader
        columns={LOADOUT_ITEM_HEADER_COLUMNS}
        gridColumns={LOADOUT_ITEM_GRID_COLUMNS}
        compact
      />
      <div className="mt-1 flex flex-col gap-1">
        {items.map((item) => (
          <GridListRow
            key={`${item.id}-${item.quantity}`}
            id={`${item.id}-${item.quantity}`}
            name={displayName(item)}
            description={item.description}
            gridColumns={LOADOUT_ITEM_GRID_COLUMNS}
            compact
            columns={[
              {
                key: 'type',
                label: 'Type',
                value: item.categoryLabel,
                align: 'center',
              },
              {
                key: 'stats',
                label: 'Stats',
                value: statsCell(item),
                align: 'right',
                className: item.statsLine ? 'text-text-primary font-medium' : 'text-text-muted',
              },
            ]}
            badges={
              !item.resolved
                ? [{ label: 'Not found', color: 'amber' as const }]
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
