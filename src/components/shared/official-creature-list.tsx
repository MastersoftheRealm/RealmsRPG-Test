/**
 * OfficialCreatureList — shared grid list for Realms Library creatures (browse + admin).
 */

'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Plus, Users } from 'lucide-react';
import {
  GridListRow,
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay,
  ListEmptyState,
  SectionHeader,
} from '@/components/shared';
import { IconButton } from '@/components/ui';
import { useSort } from '@/hooks/use-sort';
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
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => buildOfficialCreatureRows(items), [items]);

  const filtered = useMemo(
    () => filterOfficialCreatureRows(cardData, search, sortItems),
    [cardData, search, sortItems]
  );

  if (error) {
    return <ErrorDisplay message={errorMessage} onRetry={onRetry} />;
  }

  if (!isLoading && cardData.length === 0) {
    return <ListEmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div>
      {sectionTitle ? <SectionHeader title={sectionTitle} size="md" /> : null}
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder={searchPlaceholder} />
      </div>
      <ListHeader
        columns={OFFICIAL_CREATURE_HEADER_COLUMNS}
        gridColumns={OFFICIAL_CREATURE_GRID}
        sortState={sortState}
        onSort={handleSort}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">{searchEmptyMessage}</div>
        ) : (
          filtered.map((c) => (
            <GridListRow
              key={c.id}
              id={c.id}
              name={c.name}
              description={c.description}
              gridColumns={OFFICIAL_CREATURE_GRID}
              columns={[
                { key: 'Level', value: c.level, highlight: true, align: 'center' },
                { key: 'Type', value: formatOfficialCreatureType(c.type), align: 'center' },
              ]}
              badges={variant === 'library' ? [{ label: 'Realms', color: 'blue' }] : undefined}
              rightSlot={
                variant === 'library' && !readOnly && onAddRequest ? (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddRequest(c);
                    }}
                    label="Add to my library"
                    className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                  >
                    <Plus className="w-4 h-4" />
                  </IconButton>
                ) : undefined
              }
              onAddToLibrary={
                variant === 'library' && !readOnly && onAddRequest
                  ? () => onAddRequest(c)
                  : undefined
              }
              onEdit={variant === 'admin' && onEdit ? () => onEdit(c.id) : undefined}
              onDelete={variant === 'admin' && onDelete ? () => onDelete(c.id, c.name) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
