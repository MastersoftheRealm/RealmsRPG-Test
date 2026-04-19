'use client';

import { useId } from 'react';
import type { ChoiceTraitOptionSource } from '@/lib/choice-trait';

export type ChoiceTraitOptionSelectLayout = 'creator' | 'compact';

export interface ChoiceTraitOptionSelectProps {
  parentTraitName: string;
  optionTraits: ChoiceTraitOptionSource[];
  value: string;
  onChange: (next: string) => void;
  layout: ChoiceTraitOptionSelectLayout;
  emptyOptionLabel?: string;
  /** Extra classes on the `<select>` */
  selectClassName?: string;
}

const SELECT_CLASS =
  'rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary';

/**
 * Shared UI for picking one option trait for a choice-trait parent (option_trait_ids).
 * Used by character creator ancestry and sheet edit-species flows.
 */
export function ChoiceTraitOptionSelect({
  parentTraitName,
  optionTraits,
  value,
  onChange,
  layout,
  emptyOptionLabel = 'Select...',
  selectClassName,
}: ChoiceTraitOptionSelectProps) {
  const selectId = useId();
  const select = (
    <select
      id={layout === 'creator' ? selectId : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={selectClassName ? `${SELECT_CLASS} ${selectClassName}` : SELECT_CLASS}
      aria-label={`Choose option for ${parentTraitName}`}
    >
      <option value="">{emptyOptionLabel}</option>
      {optionTraits.map((opt) => (
        <option key={String(opt.id)} value={String(opt.id)}>
          {opt.name}
        </option>
      ))}
    </select>
  );

  if (layout === 'creator') {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label htmlFor={selectId} className="text-xs font-medium text-text-secondary">
          Option:
        </label>
        {select}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-text-secondary">{parentTraitName}</span>
      {select}
    </div>
  );
}
