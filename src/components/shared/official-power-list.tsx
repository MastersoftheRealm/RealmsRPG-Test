/**
 * OfficialPowerList — Realms Library powers (browse + admin).
 * Thin wrapper over the generic OfficialEntityList. (DUP-09)
 */

'use client';

import { type ReactNode } from 'react';
import { Wand2 } from 'lucide-react';
import { OfficialEntityList } from '@/components/shared/official-entity-list';
import type { PowerPart } from '@/hooks/codex-types';
import {
  buildOfficialPowerRows,
  filterOfficialPowerRows,
  OFFICIAL_POWER_GRID,
  OFFICIAL_POWER_HEADER_COLUMNS,
  type OfficialPowerRow,
} from '@/lib/library/official-power-list';

export type { OfficialPowerRow };

export interface OfficialPowerListProps {
  items: Array<Record<string, unknown>>;
  partsDb: PowerPart[];
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
  onAddRequest?: (row: OfficialPowerRow) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
}

export function OfficialPowerList({
  items,
  partsDb,
  isLoading,
  error,
  onRetry,
  errorMessage = 'Failed to load powers',
  sectionTitle,
  searchPlaceholder = 'Search powers...',
  emptyIcon = <Wand2 className="w-8 h-8" />,
  emptyTitle,
  emptyMessage,
  searchEmptyMessage = 'No powers match your search.',
  variant,
  readOnly = false,
  onAddRequest,
  onEdit,
  onDelete,
}: OfficialPowerListProps) {
  return (
    <OfficialEntityList<OfficialPowerRow>
      items={items}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      buildRows={(raw) => buildOfficialPowerRows(raw, partsDb)}
      filterRows={filterOfficialPowerRows}
      gridColumns={OFFICIAL_POWER_GRID}
      headerColumns={OFFICIAL_POWER_HEADER_COLUMNS}
      getColumns={(p) => [
        { key: 'Energy', value: p.energy, highlight: true, align: 'center' },
        { key: 'Action', value: p.action, align: 'center' },
        { key: 'Duration', value: p.duration, align: 'center' },
        { key: 'Range', value: p.range, align: 'center' },
        { key: 'Area', value: p.area, align: 'center' },
        { key: 'Damage', value: p.damage, align: 'center' },
      ]}
      getChips={(p) => p.parts}
      chipsLabel="Parts"
      getTotalCost={(p) => p.tp}
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
