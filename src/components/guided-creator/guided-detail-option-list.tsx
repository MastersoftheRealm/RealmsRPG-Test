/**
 * Path / generic deep-dive option list — Guided styling over shared DetailOptionList.
 */

'use client';

import {
  DetailOptionList,
  type DetailOptionItem,
  type DetailOptionListProps,
} from '@/components/patterns/list/detail-option-list';
import { GUIDED_OVERVIEW_STYLES as o } from './guided-choice-styles';

export type GuidedDetailOptionItem = DetailOptionItem;
export type GuidedDetailOptionListProps = DetailOptionListProps;

export function GuidedDetailOptionList({
  mutedClassName = o.bodySecondary,
  hintClassName = o.sectionHint,
  emptyLabel = 'No options listed for this path.',
  showColumnHeaders = false,
  ...props
}: GuidedDetailOptionListProps) {
  return (
    <DetailOptionList
      {...props}
      emptyLabel={emptyLabel}
      mutedClassName={mutedClassName}
      hintClassName={hintClassName}
      showColumnHeaders={showColumnHeaders}
    />
  );
}
