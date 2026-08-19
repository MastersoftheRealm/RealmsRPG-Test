/**
 * OfficialCreatureList — Realms Library creatures (browse + admin).
 * Library variant: full CreatureStatBlock rows via OfficialEntityList `renderRow`.
 * Admin variant: compact grid via OfficialEntityList. (DUP-09)
 */

'use client';

import { type ReactNode } from 'react';
import { Users } from 'lucide-react';
import { CreatureLibraryStatBlockRow } from '@/components/patterns/list/creature-library-stat-block-rows';
import { OfficialEntityList } from '@/components/patterns/list/official-entity-list';
import { LibraryAddToLibraryButton } from '@/components/patterns/list/library-add-to-library-button';
import { RollLog, RollProvider } from '@/components/rolls';
import type { LibraryCreature } from '@/types/library';
import {
  buildOfficialCreatureRows,
  CREATURE_STAT_BLOCK_GRID,
  CREATURE_STAT_BLOCK_HEADER_COLUMNS,
  filterOfficialCreatureRows,
  formatOfficialCreatureType,
  OFFICIAL_CREATURE_GRID,
  OFFICIAL_CREATURE_HEADER_COLUMNS,
  type OfficialCreatureRow,
} from '@/lib/library/official-creature-list';
import { resolveListRowThumbnail } from '@/lib/list-row-image';
import { formatCreatureLevel } from '@/lib/game';

export type { OfficialCreatureRow };

export interface OfficialCreatureListProps {
  items: LibraryCreature[];
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
  emptyIcon = <Users className="h-8 w-8" />,
  emptyTitle,
  emptyMessage,
  searchEmptyMessage = 'No creatures match your search.',
  variant,
  readOnly = false,
  onAddRequest,
  onEdit,
  onDelete,
}: OfficialCreatureListProps) {
  if (variant === 'library') {
    return (
      <RollProvider canRoll>
        <OfficialEntityList<OfficialCreatureRow, LibraryCreature>
          items={items}
          isLoading={isLoading}
          error={error}
          onRetry={onRetry}
          buildRows={buildOfficialCreatureRows}
          filterRows={filterOfficialCreatureRows}
          gridColumns={CREATURE_STAT_BLOCK_GRID}
          headerColumns={CREATURE_STAT_BLOCK_HEADER_COLUMNS}
          hasThumbnailColumn
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
          afterList={<RollLog />}
          renderRow={(row, { canAdd, onAddRequest: addRow }) => (
            <CreatureLibraryStatBlockRow
              creature={row.raw}
              showActions={false}
              onAddToLibrary={canAdd ? addRow : undefined}
              rightSlot={
                canAdd && addRow ? (
                  <LibraryAddToLibraryButton
                    onClick={(e) => {
                      e.stopPropagation();
                      addRow();
                    }}
                  />
                ) : undefined
              }
            />
          )}
        />
      </RollProvider>
    );
  }

  return (
    <OfficialEntityList<OfficialCreatureRow, LibraryCreature>
      items={items}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      buildRows={buildOfficialCreatureRows}
      filterRows={filterOfficialCreatureRows}
      gridColumns={OFFICIAL_CREATURE_GRID}
      headerColumns={OFFICIAL_CREATURE_HEADER_COLUMNS}
      getColumns={(c) => [
        { key: 'Level', value: formatCreatureLevel(c.level), highlight: true, align: 'center' },
        { key: 'Type', value: formatOfficialCreatureType(c.type), align: 'center' },
      ]}
      getThumbnail={(c) => resolveListRowThumbnail('creature', c.raw, c.name)}
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
