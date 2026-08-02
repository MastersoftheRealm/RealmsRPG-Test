'use client';

import { GridListRow, type ColumnValue } from '@/components/shared/grid-list-row';
import { TP_COST_LABEL } from '@/lib/detail-option/compact-facts';
import { useLibrarySectionCollapse } from '@/hooks/use-library-section-collapse';
import type { EntityRowExtras } from './entity-library-sections-types';

export function useEntityListSectionCollapse(
  collapsible: boolean | undefined,
  itemCount: number,
  onAdd?: () => void
) {
  return useLibrarySectionCollapse(collapsible ?? false, itemCount, onAdd);
}

export function formatRecoveryAbbrev(recovery: string | undefined): string {
  if (!recovery) return '-';
  const lower = recovery.toLowerCase();
  if (lower.includes('partial')) return 'PR';
  if (lower.includes('full')) return 'FR';
  if (lower.includes('short')) return 'SR';
  if (lower.includes('long')) return 'LR';
  return '-';
}

type InteractiveRow = EntityRowExtras & {
  id?: string | number;
  name: string;
  description?: string;
};

export function renderInteractiveGridRows(
  items: InteractiveRow[],
  defaultGrid: string,
  buildDefaultColumns: (item: InteractiveRow, idx: number) => ColumnValue[],
  compactRows: boolean
) {
  return items.map((item, idx) => (
    <GridListRow
      key={String(item.id ?? `${item.name}-${idx}`)}
      id={String(item.id ?? idx)}
      name={item.name}
      nameContent={item.nameContent}
      description={item.description}
      thumbnail={item.thumbnail}
      columns={item.columns ?? buildDefaultColumns(item, idx)}
      gridColumns={item.gridColumns ?? defaultGrid}
      expandedContent={
        item.requirements ? (
          <div className="space-y-2">
            {item.description && (
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{item.description}</p>
            )}
            {item.requirements}
          </div>
        ) : undefined
      }
      chips={item.partsChips ?? item.chips}
      chipsLabel={
        item.chipsLabel ??
        (item.partsChips?.length || item.chips?.length ? 'Parts & Proficiencies' : undefined)
      }
      totalCost={item.totalTp && item.totalTp > 0 ? item.totalTp : undefined}
      costLabel={item.totalTp && item.totalTp > 0 ? TP_COST_LABEL : undefined}
      requirements={!item.columns ? item.requirements : undefined}
      innate={item.innate === true}
      hideInnateBadge={item.hideInnateBadge}
      leftSlot={item.leftSlot}
      rightSlot={item.rightSlot}
      onDelete={item.onDelete}
      badges={item.badges}
      equipped={item.equipped}
      columnSpans={item.columnSpans}
      detailSections={item.detailSections}
      supplementalExpandedContent={item.supplementalExpandedContent}
      uses={item.uses}
      hideUsesInName={item.hideUsesInName}
      compact={compactRows}
    />
  ));
}
