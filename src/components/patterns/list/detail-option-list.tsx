/**
 * DetailOptionList — shared elongated expandable option rows for deep-dive catalogs
 * (Traits, Feats, Weapons, Armor, Powers, Techniques) and remodeled legacy trait lists.
 *
 * Collapsed row shows name + truncated description (mobile: prose below name, no column label).
 * When expanded, GridListRow hides the truncated description teaser so the full description only appears in the panel.
 * Fact/stats that would normally be columns (Damage Reduction, Range, Uses, Energy, etc.) belong as labeled chips in the
 * expanded body so the label states the value (e.g. "Damage Reduction 2"), not bare numbers.
 */

'use client';

import type { ReactNode } from 'react';
import { GridListRow } from '@/components/patterns/list/grid-list-row';
import type { ChipData } from '@/components/patterns/list/grid-list-row-types';
import { ListHeader } from '@/components/patterns/list/list-header';
import { cn } from '@/lib/utils';
import type { DetailOptionItemModel } from '@/lib/detail-option';

export type DetailOptionItem = DetailOptionItemModel & {
  /** Override builders' expandedHint with custom React content. */
  supplementalExpandedContent?: ReactNode | undefined;
};

export interface DetailOptionListProps {
  items: DetailOptionItem[];
  emptyLabel?: string | undefined;
  className?: string | undefined;
  groupLabel?: string | undefined;
  groupHint?: string | undefined;
  /** When false, hide Name/Description column headers for a cleaner catalog list. Default true. */
  showColumnHeaders?: boolean | undefined;
  /** Semantic text styles for empty / group hint. */
  mutedClassName?: string | undefined;
  hintClassName?: string | undefined;
}

const DEFAULT_MUTED = 'font-nunito text-sm text-text-secondary';
const DEFAULT_HINT = 'mt-0.5 font-nunito text-xs text-text-muted';

export function DetailOptionList({
  items,
  emptyLabel = 'No options listed.',
  className,
  groupLabel,
  groupHint,
  showColumnHeaders = true,
  mutedClassName = DEFAULT_MUTED,
  hintClassName = DEFAULT_HINT,
}: DetailOptionListProps) {
  if (items.length === 0) {
    return <p className={cn(mutedClassName, className)}>{emptyLabel}</p>;
  }

  const gridColumns = 'minmax(7rem, 1fr) minmax(0, 2.2fr)';

  return (
    <div className={cn('space-y-2', className)}>
      {groupLabel ? (
        <div className="mb-1">
          <p className="font-nunito text-sm font-semibold text-text-primary">{groupLabel}</p>
          {groupHint ? <p className={hintClassName}>{groupHint}</p> : null}
        </div>
      ) : null}

      {showColumnHeaders ? (
        <ListHeader
          columns={[
            { key: 'name', label: 'Name', sortable: false },
            { key: 'description', label: 'Description', sortable: false },
          ]}
          gridColumns={gridColumns}
          compact
        />
      ) : null}

      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {items.map((item, index) => {
          const desc = item.description?.trim() ?? '';
          const chips = item.chips as ChipData[] | undefined;
          const supplemental =
            item.supplementalExpandedContent ??
            (item.expandedHint ? (
              <p className="mt-2 font-nunito text-sm text-text-secondary">{item.expandedHint}</p>
            ) : null);
          const rowKey = `${item.id}__${index}`;

          return (
            <li key={rowKey}>
              <GridListRow
                id={rowKey}
                name={item.name}
                description={desc || undefined}
                hideUsesInName={item.hideUsesInName}
                disabled={item.disabled}
                compact
                gridColumns={gridColumns}
                chips={chips}
                chipsLabel={item.chipsLabel ?? 'Details'}
                columns={[
                  {
                    key: 'description',
                    label: 'Description',
                    align: 'left',
                    hideOnMobile: true,
                    value: desc ? (
                      <span className="line-clamp-2 text-left text-text-secondary">{desc}</span>
                    ) : (
                      <span className="text-text-muted">None</span>
                    ),
                  },
                ]}
                supplementalExpandedContent={supplemental}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
