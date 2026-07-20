/**
 * OfficialEnhancedList — Realms Library enhanced items (admin).
 * Thin wrapper over the generic OfficialEntityList. (DUP-09 / TASK-575)
 */

'use client';

import { type ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { OfficialEntityList } from '@/components/shared/official-entity-list';
import type { OfficialEnhancedItem } from '@/types/crafting';
import {
  buildOfficialEnhancedRows,
  filterOfficialEnhancedRows,
  OFFICIAL_ENHANCED_GRID,
  OFFICIAL_ENHANCED_HEADER_COLUMNS,
  type OfficialEnhancedRow,
} from '@/lib/library/official-enhanced-list';

export type { OfficialEnhancedRow };

export interface OfficialEnhancedListProps {
  items: OfficialEnhancedItem[];
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
  onAddRequest?: (row: OfficialEnhancedRow) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
  searchTrailing?: ReactNode;
}

export function OfficialEnhancedList({
  items,
  isLoading,
  error,
  onRetry,
  errorMessage = 'Failed to load official enhanced items',
  sectionTitle,
  searchPlaceholder = 'Search by name, base item, or power...',
  emptyIcon = <Sparkles className="w-8 h-8" />,
  emptyTitle,
  emptyMessage,
  searchEmptyMessage = 'No enhanced items match your search.',
  variant,
  readOnly = false,
  onAddRequest,
  onEdit,
  onDelete,
  searchTrailing,
}: OfficialEnhancedListProps) {
  return (
    <OfficialEntityList<OfficialEnhancedRow, OfficialEnhancedItem>
      items={items}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      buildRows={buildOfficialEnhancedRows}
      filterRows={filterOfficialEnhancedRows}
      gridColumns={OFFICIAL_ENHANCED_GRID}
      headerColumns={OFFICIAL_ENHANCED_HEADER_COLUMNS}
      getColumns={(e) => [
        { key: 'base', value: e.base },
        { key: 'power', value: e.power },
        { key: 'rarity', value: e.rarity },
        { key: 'cost', value: e.cost, align: 'right' },
        { key: 'uses', value: e.uses, align: 'right' },
      ]}
      getBadges={() => [{ label: 'Enhanced', color: 'purple' }]}
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
      searchTrailing={searchTrailing}
    />
  );
}
