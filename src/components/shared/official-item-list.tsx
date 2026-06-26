/**
 * OfficialItemList — Realms Library armaments (browse + admin).
 * Thin wrapper over the generic OfficialEntityList. (DUP-09)
 */

'use client';

import { type ReactNode } from 'react';
import { Shield } from 'lucide-react';
import { OfficialEntityList } from '@/components/shared/official-entity-list';
import type { ItemProperty } from '@/hooks/codex-types';
import {
  buildOfficialItemRows,
  filterOfficialItemRows,
  OFFICIAL_ITEM_GRID,
  OFFICIAL_ITEM_HEADER_COLUMNS,
  type OfficialItemRow,
} from '@/lib/library/official-item-list';

export type { OfficialItemRow };

export interface OfficialItemListProps {
  items: Array<Record<string, unknown>>;
  propertiesDb: ItemProperty[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  errorMessage?: string;
  sectionTitle?: string;
  searchPlaceholder?: string;
  emptyIcon?: ReactNode;
  emptyTitle: string;
  emptyMessage: string;
  searchEmptyMessage?: string;
  variant: 'library' | 'admin';
  readOnly?: boolean;
  onAddRequest?: (row: OfficialItemRow) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
}

export function OfficialItemList({
  items,
  propertiesDb,
  isLoading,
  error,
  onRetry,
  errorMessage = 'Failed to load armaments',
  sectionTitle,
  searchPlaceholder = 'Search armaments...',
  emptyIcon = <Shield className="w-8 h-8" />,
  emptyTitle,
  emptyMessage,
  searchEmptyMessage = 'No armaments match your search.',
  variant,
  readOnly = false,
  onAddRequest,
  onEdit,
  onDelete,
}: OfficialItemListProps) {
  return (
    <OfficialEntityList<OfficialItemRow>
      items={items}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      buildRows={(raw) => buildOfficialItemRows(raw, propertiesDb)}
      filterRows={filterOfficialItemRows}
      gridColumns={OFFICIAL_ITEM_GRID}
      headerColumns={OFFICIAL_ITEM_HEADER_COLUMNS}
      getColumns={(i) => [
        { key: 'Type', value: i.type, align: 'center' },
        { key: 'Rarity', value: i.rarity, align: 'center' },
        { key: 'Currency', value: i.currency, align: 'center' },
        { key: 'TP', value: i.tp, align: 'center' },
        { key: 'Range', value: i.range, align: 'center' },
        { key: 'Damage', value: i.damage, align: 'center' },
      ]}
      getChips={(i) => i.parts}
      chipsLabel="Properties"
      getTotalCost={(i) => i.tp}
      costLabel="TP"
      errorMessage={errorMessage}
      sectionTitle={sectionTitle}
      searchPlaceholder={searchPlaceholder}
      emptyIcon={emptyIcon}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
      searchEmptyMessage={searchEmptyMessage}
      variant={variant}
      readOnly={readOnly}
      onAddRequest={onAddRequest}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
