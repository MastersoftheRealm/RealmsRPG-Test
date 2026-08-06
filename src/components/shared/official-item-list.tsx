/**
 * OfficialItemList — Realms Library armaments (browse + admin).
 * Thin wrapper over the generic OfficialEntityList. (DUP-09)
 */

'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { Shield, Shirt, Sword } from 'lucide-react';
import { OfficialEntityList } from '@/components/shared/official-entity-list';
import { ArmamentFilters } from '@/components/shared/filters';
import { useAddToCharacterFromLibrary } from '@/hooks/use-add-to-character-from-library';
import type { ItemProperty } from '@/hooks/codex-types';
import type { LibraryItem } from '@/types/library';
import { ARMAMENT_LABELS_BY_KIND } from '@/lib/library/armament-library-labels';
import {
  ARMAMENT_LIBRARY_CONFIG,
  armamentRowColumns,
  buildOfficialItemRows,
  filterOfficialItemRows,
  type ArmamentLibraryKind,
  type OfficialItemRow,
} from '@/lib/library/official-item-list';
import {
  EMPTY_ARMAMENT_FILTERS,
  type ArmamentFilterState,
} from '@/lib/library/armament-filters';
import type { ArmamentCharacterContext } from '@/lib/library/armament-character-context';
import { propertiesProficienciesSection } from '@/lib/chip/list-row-metadata';
import { resolveListRowThumbnail } from '@/lib/list-row-image';

export type { OfficialItemRow, ArmamentLibraryKind };

const ARMAMENT_ICONS: Record<ArmamentLibraryKind, ReactNode> = {
  weapon: <Sword className="w-8 h-8" />,
  armor: <Shirt className="w-8 h-8" />,
  shield: <Shield className="w-8 h-8" />,
};

export interface OfficialItemListProps {
  armamentKind: ArmamentLibraryKind;
  items: LibraryItem[];
  propertiesDb: ItemProperty[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  errorMessage?: string;
  sectionTitle?: string;
  searchPlaceholder?: string;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyMessage?: string;
  searchEmptyMessage?: string;
  variant: 'library' | 'admin';
  readOnly?: boolean;
  onAddRequest?: (row: OfficialItemRow) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
}

export function OfficialItemList({
  armamentKind,
  items,
  propertiesDb,
  isLoading,
  error,
  onRetry,
  errorMessage,
  sectionTitle,
  searchPlaceholder,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  searchEmptyMessage,
  variant,
  readOnly = false,
  onAddRequest,
  onEdit,
  onDelete,
}: OfficialItemListProps) {
  const labels = ARMAMENT_LABELS_BY_KIND[armamentKind];
  const { grid, headers } = ARMAMENT_LIBRARY_CONFIG[armamentKind];
  const [advancedFilters, setAdvancedFilters] =
    useState<ArmamentFilterState>(EMPTY_ARMAMENT_FILTERS);
  const [characterContext, setCharacterContext] =
    useState<ArmamentCharacterContext | null>(null);
  const [characterFilterId, setCharacterFilterId] = useState('');
  const addToCharacter = useAddToCharacterFromLibrary(armamentKind, characterFilterId);

  const filterRows = useCallback(
    (
      rows: OfficialItemRow[],
      search: string,
      sortItems: (items: OfficialItemRow[]) => OfficialItemRow[]
    ) => filterOfficialItemRows(rows, search, sortItems, advancedFilters, characterContext),
    [advancedFilters, characterContext]
  );

  return (
    <>
      <OfficialEntityList<OfficialItemRow, LibraryItem>
        items={items}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        buildRows={(raw) => buildOfficialItemRows(raw, propertiesDb, armamentKind)}
        filterRows={filterRows}
        gridColumns={grid}
        headerColumns={headers}
        filters={
          variant === 'library' ? (
            <ArmamentFilters
              value={advancedFilters}
              onChange={setAdvancedFilters}
              onCharacterContextChange={setCharacterContext}
              onCharacterIdChange={setCharacterFilterId}
            />
          ) : undefined
        }
        getColumns={(row) => armamentRowColumns(row, armamentKind)}
        getDetailSections={(row) => {
          const family =
            armamentKind === 'armor' ? 'armor' : armamentKind === 'shield' ? 'shield' : 'weapon';
          const section = propertiesProficienciesSection(row.parts, family);
          return section ? [section] : undefined;
        }}
        getTotalCost={(row) => row.tp}
        costLabel="TP"
        getThumbnail={(row) => resolveListRowThumbnail('equipment', row.raw, row.name)}
        errorMessage={errorMessage ?? labels.realmsLoadErrorMessage}
        sectionTitle={sectionTitle}
        searchPlaceholder={searchPlaceholder ?? labels.searchPlaceholder}
        emptyIcon={emptyIcon ?? ARMAMENT_ICONS[armamentKind]}
        emptyTitle={emptyTitle ?? labels.emptyTitle}
        emptyMessage={emptyMessage ?? labels.realmsEmptyMessage}
        searchEmptyMessage={searchEmptyMessage ?? labels.searchEmptyTitle}
        variant={variant}
        readOnly={readOnly}
        onAddRequest={onAddRequest}
        addToCharacter={
          variant === 'library' && addToCharacter.active
            ? {
                kind: armamentKind,
                onRequest: (row) => addToCharacter.openAddConfirm(row.name, row.raw),
                isOnCharacter: (row) => addToCharacter.isOnCharacter(row.raw),
              }
            : undefined
        }
        onEdit={onEdit}
        onDelete={onDelete}
      />
      {addToCharacter.confirmModal}
    </>
  );
}
