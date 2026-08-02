'use client';

import type { ReactNode } from 'react';
import { GridListRow } from '@/components/shared/grid-list-row';
import { ListHeader } from '@/components/shared/list-header';
import { SectionHeader } from '@/components/shared/section-header';
import { useLibrarySectionCollapse } from '@/hooks/use-library-section-collapse';
import {
  FEAT_COLUMNS,
  FEAT_GRID,
  FEAT_COLUMNS_WITH_LEVEL,
  FEAT_GRID_WITH_LEVEL,
} from './entity-library-sections-columns';
import {
  formatRecoveryAbbrev,
  renderInteractiveGridRows,
  useEntityListSectionCollapse,
} from './entity-library-sections-rows';
import { truncateText } from '@/lib/utils';
import type { EntityFeatRow, EntityListControls } from './entity-library-sections-types';

/** Collapsible block for library tabs that are not entity list sections (notes, proficiencies). */
export function LibraryCollapsibleSection({
  title,
  itemCount,
  onAdd,
  addLabel,
  rightContent,
  addButtonClassName,
  children,
  className,
}: {
  title: string;
  itemCount: number;
  onAdd?: () => void;
  addLabel?: string;
  rightContent?: ReactNode;
  addButtonClassName?: string;
  children: ReactNode;
  className?: string;
}) {
  const { isContentVisible, onAdd: onAddWrapped, headerCollapseProps } = useLibrarySectionCollapse(
    true,
    itemCount,
    onAdd
  );
  return (
    <div className={className}>
      <SectionHeader
        title={title}
        size="lg"
        onAdd={onAddWrapped}
        addLabel={addLabel}
        rightContent={rightContent}
        addButtonClassName={addButtonClassName}
        {...headerCollapseProps}
      />
      {isContentVisible ? children : null}
    </div>
  );
}

export function FeatsTraitsListSection({
  title = 'Feats',
  items,
  showListHeader = true,
  compactRows = true,
  showTitle = true,
  includeLevelColumn = false,
  sortState,
  onSort,
  rowChrome,
  onAdd,
  addLabel,
  headerRightContent,
  addButtonClassName,
  emptyMessage = 'No feats',
  collapsible,
}: {
  title?: string;
  items: EntityFeatRow[];
  showListHeader?: boolean;
  compactRows?: boolean;
  showTitle?: boolean;
  /** Show Lvl column header when editing leveled feats */
  includeLevelColumn?: boolean;
  headerRightContent?: ReactNode;
  addButtonClassName?: string;
} & EntityListControls) {
  const hasAny = items.length > 0;
  const useInteractiveRows = items.some((item) => item.columns != null);
  const featColumns = includeLevelColumn ? FEAT_COLUMNS_WITH_LEVEL : FEAT_COLUMNS;
  const featGrid = includeLevelColumn ? FEAT_GRID_WITH_LEVEL : FEAT_GRID;
  const { isContentVisible, onAdd: onAddWrapped, headerCollapseProps } = useEntityListSectionCollapse(
    collapsible,
    items.length,
    onAdd
  );

  const listBody = (
    <>
      {showListHeader && hasAny && (
        <ListHeader
          columns={useInteractiveRows ? featColumns : FEAT_COLUMNS}
          gridColumns={useInteractiveRows ? featGrid : FEAT_GRID}
          sortState={sortState}
          onSort={onSort}
          rowChrome={rowChrome}
        />
      )}
      {hasAny ? (
        <div className="space-y-1">
          {useInteractiveRows
            ? renderInteractiveGridRows(items, featGrid, () => [], compactRows)
            : items.map((feat, index) => {
                const uses =
                  (feat.maxUses ?? 0) > 0
                    ? { current: feat.currentUses ?? feat.maxUses ?? 0, max: feat.maxUses ?? 0 }
                    : undefined;
                const usesDisplay = uses ? `${uses.current}/${uses.max}` : '-';
                const recoveryDisplay = formatRecoveryAbbrev(feat.recovery);
                const noUsesOrRecovery = !uses && recoveryDisplay === '-';
                return (
                  <GridListRow
                    key={String(feat.id ?? `${feat.name}-${index}`)}
                    id={String(feat.id ?? index)}
                    name={feat.name}
                    description={feat.description}
                    gridColumns={FEAT_GRID}
                    columns={
                      noUsesOrRecovery
                        ? [{ key: 'description', value: truncateText(feat.description, 220), hideOnMobile: true }]
                        : [
                            {
                              key: 'description',
                              value: truncateText(feat.description, uses ? 60 : 100),
                              hideOnMobile: true,
                            },
                            { key: 'uses', value: usesDisplay, align: 'center' },
                            { key: 'recovery', value: recoveryDisplay, align: 'center' },
                          ]
                    }
                    columnSpans={noUsesOrRecovery ? [3] : undefined}
                    uses={uses}
                    compact={compactRows}
                  />
                );
              })}
        </div>
      ) : (
        <p className="text-sm text-text-muted dark:text-text-secondary italic text-center py-4">{emptyMessage}</p>
      )}
    </>
  );

  return (
    <div>
      {showTitle && (
        <SectionHeader
          title={title}
          size="lg"
          onAdd={onAddWrapped}
          addLabel={addLabel}
          rightContent={headerRightContent}
          addButtonClassName={addButtonClassName}
          {...headerCollapseProps}
        />
      )}
      {isContentVisible ? listBody : null}
    </div>
  );
}
