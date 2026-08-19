/**
 * Trait option catalogs for choice-card deep-dive — thin wrapper over shared DetailOptionList.
 */

'use client';

import { DetailOptionList } from '@/components/patterns/list/detail-option-list';
import type { Trait } from '@/hooks';
import { traitToDetailOption } from '@/lib/detail-option';
import { GUIDED_OVERVIEW_STYLES as o } from './guided-choice-styles';

export interface GuidedTraitOptionListProps {
  traits: Trait[];
  emptyLabel?: string | undefined;
  className?: string | undefined;
  groupLabel?: string | undefined;
  groupHint?: string | undefined;
}

export function GuidedTraitOptionList({
  traits,
  emptyLabel = 'No options for this Species.',
  className,
  groupLabel,
  groupHint,
}: GuidedTraitOptionListProps) {
  return (
    <DetailOptionList
      items={traits.map(traitToDetailOption)}
      emptyLabel={emptyLabel}
      className={className}
      groupLabel={groupLabel}
      groupHint={groupHint}
      showColumnHeaders={false}
      mutedClassName={o.bodySecondary}
      hintClassName={o.sectionHint}
    />
  );
}
