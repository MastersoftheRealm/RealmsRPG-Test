/**
 * Guided loadout item list — ListHeader + GridListRow (library/codex pattern).
 */

'use client';

import { GridListRow, ListHeader } from '@/components/shared';
import type { ResolvedLoadoutItem } from '@/lib/guided-creator/resolve-loadout-items';

export const LOADOUT_ITEM_GRID_COLUMNS = '1.5fr minmax(5.5rem, auto) minmax(6.5rem, auto)';

export const LOADOUT_ITEM_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME', align: 'left' as const, sortable: false as const },
  { key: 'type', label: 'TYPE', align: 'center' as const, sortable: false as const },
  { key: 'stats', label: 'STATS', align: 'center' as const, sortable: false as const },
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
                align: 'center',
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
