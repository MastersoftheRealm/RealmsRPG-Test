/**
 * OfficialCreatureList — Realms Library creatures (browse + admin).
 * Thin wrapper over the generic OfficialEntityList. (DUP-09)
 */

'use client';

import { type ReactNode } from 'react';
import { Users } from 'lucide-react';
import { OfficialEntityList } from '@/components/shared/official-entity-list';
import {
  buildOfficialCreatureRows,
  filterOfficialCreatureRows,
  formatOfficialCreatureType,
  OFFICIAL_CREATURE_GRID,
  OFFICIAL_CREATURE_HEADER_COLUMNS,
  type OfficialCreatureRow,
} from '@/lib/library/official-creature-list';

export type { OfficialCreatureRow };

export interface OfficialCreatureListProps {
  items: Array<Record<string, unknown>>;
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
  onAddRequest?: (row: OfficialCreatureRow) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
}

export function OfficialCreatureList({
  items,
  isLoading,
  error,
  onRetry,
  errorMessage = 'Failed to load creatures',
  sectionTitle,
  searchPlaceholder = 'Search creatures...',
  emptyIcon = <Users className="w-8 h-8" />,
  emptyTitle,
  emptyMessage,
  searchEmptyMessage = 'No creatures match your search.',
  variant,
  readOnly = false,
  onAddRequest,
  onEdit,
  onDelete,
}: OfficialCreatureListProps) {
  return (
    <OfficialEntityList<OfficialCreatureRow>
      items={items}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      buildRows={buildOfficialCreatureRows}
      filterRows={filterOfficialCreatureRows}
      gridColumns={OFFICIAL_CREATURE_GRID}
      headerColumns={OFFICIAL_CREATURE_HEADER_COLUMNS}
      getColumns={(c) => [
        { key: 'Level', value: c.level, highlight: true, align: 'center' },
        { key: 'Type', value: formatOfficialCreatureType(c.type), align: 'center' },
      ]}
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
