/**
 * OfficialTechniqueList — Realms Library techniques (browse + admin).
 * Thin wrapper over the generic OfficialEntityList. (DUP-09)
 */

'use client';

import { type ReactNode } from 'react';
import { Swords } from 'lucide-react';
import { OfficialEntityList } from '@/components/shared/official-entity-list';
import type { TechniquePart } from '@/hooks/codex-types';
import {
  buildOfficialTechniqueRows,
  filterOfficialTechniqueRows,
  OFFICIAL_TECHNIQUE_GRID,
  OFFICIAL_TECHNIQUE_HEADER_COLUMNS,
  type OfficialTechniqueRow,
} from '@/lib/library/official-technique-list';

export type { OfficialTechniqueRow };

export interface OfficialTechniqueListProps {
  items: Array<Record<string, unknown>>;
  partsDb: TechniquePart[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  mode?: 'standard' | 'empowered';
  errorMessage?: string;
  sectionTitle?: string;
  searchPlaceholder?: string;
  emptyIcon?: ReactNode;
  emptyTitle: string;
  emptyMessage: string;
  searchEmptyMessage?: string;
  variant: 'library' | 'admin';
  readOnly?: boolean;
  onAddRequest?: (row: OfficialTechniqueRow) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
}

export function OfficialTechniqueList({
  items,
  partsDb,
  isLoading,
  error,
  onRetry,
  mode = 'standard',
  errorMessage,
  sectionTitle,
  searchPlaceholder,
  emptyIcon = <Swords className="w-8 h-8" />,
  emptyTitle,
  emptyMessage,
  searchEmptyMessage,
  variant,
  readOnly = false,
  onAddRequest,
  onEdit,
  onDelete,
}: OfficialTechniqueListProps) {
  const empowered = mode === 'empowered';
  return (
    <OfficialEntityList<OfficialTechniqueRow>
      items={items}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      buildRows={(raw) => buildOfficialTechniqueRows(raw, partsDb, mode)}
      filterRows={filterOfficialTechniqueRows}
      gridColumns={OFFICIAL_TECHNIQUE_GRID}
      headerColumns={OFFICIAL_TECHNIQUE_HEADER_COLUMNS}
      getColumns={(t) => [
        { key: 'Energy', value: t.energy, highlight: true, align: 'center' },
        { key: 'TP', value: t.tp, align: 'center' },
        { key: 'Action', value: t.action, align: 'center' },
        { key: 'Weapon', value: t.weapon, align: 'center' },
        { key: 'Damage', value: t.damage, align: 'center' },
      ]}
      getChips={(t) => t.parts}
      chipsLabel="Parts"
      getTotalCost={(t) => t.tp}
      costLabel="TP"
      errorMessage={
        errorMessage ?? `Failed to load ${empowered ? 'empowered techniques' : 'techniques'}`
      }
      sectionTitle={sectionTitle}
      searchPlaceholder={
        searchPlaceholder ?? (empowered ? 'Search empowered techniques...' : 'Search techniques...')
      }
      emptyIcon={emptyIcon}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
      searchEmptyMessage={
        searchEmptyMessage ??
        (empowered ? 'No empowered techniques match your search.' : 'No techniques match your search.')
      }
      variant={variant}
      readOnly={readOnly}
      onAddRequest={onAddRequest}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
