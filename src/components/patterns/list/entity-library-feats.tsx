'use client';

import type { ReactNode } from 'react';
import { GridListRow } from '@/components/patterns/list/grid-list-row';
import { ListHeader } from '@/components/patterns/list/list-header';
import { SectionHeader } from '@/components/patterns/chrome/section-header';
import { useLibrarySectionCollapse } from '@/hooks/use-library-section-collapse';
import { FEAT_COLUMNS, FEAT_GRID } from './entity-library-sections-columns';
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
  const {
    isContentVisible,
    onAdd: onAddWrapped,
    headerCollapseProps,
  } = useLibrarySectionCollapse(true, itemCount, onAdd);
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
  sortState,
  onSort,
  rowChrome,
  onAdd,
  addLabel,
  headerRightContent,
  addButtonClassName,
  emptyMessage = 'No feats',
  collapsible,
  headingLevel,
}: {
  title?: string;
  items: EntityFeatRow[];
  showListHeader?: boolean;
  compactRows?: boolean;
  showTitle?: boolean;
  headerRightContent?: ReactNode;
  addButtonClassName?: string;
} & EntityListControls) {
  const hasAny = items.length > 0;
  const useInteractiveRows = items.some((item) => item.columns != null);
  const {
    isContentVisible,
    onAdd: onAddWrapped,
    headerCollapseProps,
  } = useEntityListSectionCollapse(collapsible, items.length, onAdd);

  const listBody = (
    <>
      {showListHeader && hasAny && (
        <ListHeader
          columns={FEAT_COLUMNS}
          gridColumns={FEAT_GRID}
          sortState={sortState}
          onSort={onSort}
          rowChrome={rowChrome}
        />
      )}
      {hasAny ? (
        <div className="space-y-1">
          {useInteractiveRows
            ? renderInteractiveGridRows(items, FEAT_GRID, () => [], compactRows)
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
                        ? [
                            {
                              key: 'description',
                              value: truncateText(feat.description, 220),
                              hideOnMobile: true,
                            },
                          ]
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
        <p className="py-4 text-center text-sm text-text-muted italic">{emptyMessage}</p>
      )}
    </>
  );

  return (
    <div>
      {showTitle && (
        <SectionHeader
          title={title}
          size="lg"
          headingLevel={headingLevel}
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
