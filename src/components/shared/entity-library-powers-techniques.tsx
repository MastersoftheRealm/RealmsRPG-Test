'use client';

import type { ReactNode } from 'react';
import { ListHeader } from '@/components/shared/list-header';
import { SectionHeader } from '@/components/shared/section-header';
import {
  POWER_COLUMNS,
  POWER_GRID,
  POWER_COLUMNS_WITH_ENERGY,
  POWER_GRID_WITH_ENERGY,
  TECHNIQUE_COLUMNS,
  TECHNIQUE_GRID,
  CHARACTER_SHEET_TECHNIQUE_COLUMNS,
  CHARACTER_SHEET_TECHNIQUE_GRID,
} from './entity-library-sections-columns';
import { renderInteractiveGridRows, useEntityListSectionCollapse } from './entity-library-sections-rows';
import type {
  EntityListControls,
  EntityPowerRow,
  EntityTechniqueRow,
} from './entity-library-sections-types';

export function PowersListSection({
  title = 'Powers',
  titleAddon,
  items,
  showListHeader = true,
  compactRows = true,
  /**
   * When true, show a static Energy column (browse/stat-block).
   * Character sheet play lists must leave this false — energy cost is the row `rightSlot` spend button only.
   */
  includeEnergyColumn = false,
  showTitle = true,
  sortState,
  onSort,
  rowChrome,
  onAdd,
  addLabel,
  emptyMessage = 'No powers',
  collapsible,
}: {
  title?: string;
  /** Optional content beside the section title (e.g. InfoTippy). */
  titleAddon?: ReactNode;
  items: EntityPowerRow[];
  showListHeader?: boolean;
  compactRows?: boolean;
  includeEnergyColumn?: boolean;
  /** When false, omit the internal SectionHeader title (for callers that provide their own header) */
  showTitle?: boolean;
} & EntityListControls) {
  const hasAny = items.length > 0;
  const { isContentVisible, onAdd: onAddWrapped, headerCollapseProps } = useEntityListSectionCollapse(
    collapsible,
    items.length,
    onAdd
  );
  const cols = includeEnergyColumn ? POWER_COLUMNS_WITH_ENERGY : POWER_COLUMNS;
  const grid = includeEnergyColumn ? POWER_GRID_WITH_ENERGY : POWER_GRID;
  return (
    <div>
      {showTitle && (
        <SectionHeader
          title={title}
          titleAddon={titleAddon}
          size="lg"
          onAdd={onAddWrapped}
          addLabel={addLabel}
          {...headerCollapseProps}
        />
      )}
      {isContentVisible && (
        <>
      {showListHeader && hasAny && (
        <ListHeader
          columns={cols}
          gridColumns={grid}
          sortState={sortState}
          onSort={onSort}
          rowChrome={rowChrome}
          hasThumbnailColumn
        />
      )}
      {hasAny ? (
        <div className="space-y-1">
          {renderInteractiveGridRows(
            items,
            grid,
            (power) => {
              const row = power as EntityPowerRow;
              const damageVal =
                typeof row.damage === 'string' || row.damage == null ? (row.damage ?? '-') : row.damage;
              return includeEnergyColumn
                ? [
                    { key: 'energy', value: row.energyCost ?? '-', align: 'center' as const },
                    { key: 'action', value: row.actionType ?? '-', align: 'center' as const },
                    { key: 'damage', value: damageVal, align: 'center' as const },
                    { key: 'area', value: row.area ?? '-', align: 'center' as const },
                    { key: 'duration', value: row.duration ?? '-', align: 'center' as const },
                  ]
                : [
                    { key: 'action', value: row.actionType ?? '-', align: 'center' as const },
                    { key: 'damage', value: damageVal, align: 'center' as const },
                    { key: 'area', value: row.area ?? '-', align: 'center' as const },
                    { key: 'duration', value: row.duration ?? '-', align: 'center' as const },
                  ];
            },
            compactRows
          )}
        </div>
      ) : (
        <p className="text-sm text-text-muted dark:text-text-secondary italic text-center py-4">{emptyMessage}</p>
      )}
        </>
      )}
    </div>
  );
}

export function TechniquesListSection({
  title = 'Techniques',
  items,
  showListHeader = true,
  compactRows = true,
  showTitle = true,
  /**
   * Character-sheet play mode: Action + Attack columns (no Energy or TP columns).
   * Energy cost must live only on the row `rightSlot` spend button.
   * Omit (false) for browse/stat-block lists that show a static Energy column and have no spend button.
   * Do not combine browse Energy columns with spend `rightSlot` — that recreates the duplicate UX.
   */
  includeActionColumn = false,
  sortState,
  onSort,
  rowChrome,
  onAdd,
  addLabel,
  emptyMessage = 'No techniques',
  collapsible,
}: {
  title?: string;
  items: EntityTechniqueRow[];
  showListHeader?: boolean;
  compactRows?: boolean;
  showTitle?: boolean;
  includeActionColumn?: boolean;
} & EntityListControls) {
  const hasAny = items.length > 0;
  const { isContentVisible, onAdd: onAddWrapped, headerCollapseProps } = useEntityListSectionCollapse(
    collapsible,
    items.length,
    onAdd
  );
  const cols = includeActionColumn ? CHARACTER_SHEET_TECHNIQUE_COLUMNS : TECHNIQUE_COLUMNS;
  const grid = includeActionColumn ? CHARACTER_SHEET_TECHNIQUE_GRID : TECHNIQUE_GRID;
  return (
    <div>
      {showTitle && (
        <SectionHeader
          title={title}
          size="lg"
          onAdd={onAddWrapped}
          addLabel={addLabel}
          {...headerCollapseProps}
        />
      )}
      {isContentVisible && (
        <>
      {showListHeader && hasAny && (
        <ListHeader
          columns={cols}
          gridColumns={grid}
          sortState={sortState}
          onSort={onSort}
          rowChrome={rowChrome}
          hasThumbnailColumn
        />
      )}
      {hasAny ? (
        <div className="space-y-1">
          {renderInteractiveGridRows(
            items,
            grid,
            (tech) => {
              const row = tech as EntityTechniqueRow;
              // Character sheet (includeActionColumn): energy is rightSlot only — no Energy column.
              if (includeActionColumn) {
                return [
                  { key: 'action', value: row.actionType ?? '-', align: 'center' as const },
                  { key: 'weapon', value: row.weaponName ?? '-', align: 'center' as const },
                ];
              }
              return [
                { key: 'energy', value: row.energyCost ?? '-', align: 'center' as const },
                { key: 'weapon', value: row.weaponName ?? '-', align: 'center' as const },
                { key: 'tp', value: row.tp ?? '-', align: 'center' as const },
              ];
            },
            compactRows
          )}
        </div>
      ) : (
        <p className="text-sm text-text-muted dark:text-text-secondary italic text-center py-4">{emptyMessage}</p>
      )}
        </>
      )}
    </div>
  );
}
