'use client';

import { useId } from 'react';
import type { ChoiceTraitOptionSource } from '@/lib/choice-trait';
import { cn } from '@/lib/utils';
import { Chip, Button } from '@/components/ui';
import { ChevronDown } from 'lucide-react';

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

export interface ChoiceTraitOptionListPickerProps {
  parentTraitName: string;
  optionTraits: ChoiceTraitOptionSource[];
  value: string;
  onChange: (next: string) => void;
  emptyLabel?: string;
}

/**
 * Expand/collapse list picker for choice traits.
 * Shows option descriptions before selection (better than a <select> for long text).
 */
export function ChoiceTraitOptionListPicker({
  parentTraitName,
  optionTraits,
  value,
  onChange,
  emptyLabel = 'Choose one option',
}: ChoiceTraitOptionListPickerProps) {
  if (!optionTraits.length) return null;

  const selected = optionTraits.find((t) => String(t.id) === String(value)) ?? null;

  return (
    <div className="mt-3 rounded-lg border border-border-light bg-background/60">
      <div className="px-3 py-2 border-b border-border-light flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
          Options
        </p>
        {selected ? (
          <Chip variant="info" size="sm">
            Selected: {selected.name}
          </Chip>
        ) : (
          <span className="text-xs text-text-muted dark:text-text-secondary">{emptyLabel}</span>
        )}
      </div>

      <div className="p-2 space-y-2">
        {optionTraits.map((opt) => {
          const optId = String(opt.id);
          const isSelected = optId === String(value);

          return (
            <details
              key={optId}
              className={cn(
                'group rounded-md border border-border-light bg-surface',
                isSelected && 'border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/20',
              )}
            >
              <summary className="list-none cursor-pointer px-3 py-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">{opt.name}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant={isSelected ? 'secondary' : 'outline'}
                    size="sm"
                    className="min-h-[44px] px-3"
                    onClick={(e) => {
                      e.preventDefault(); // don't toggle details
                      onChange(isSelected ? '' : optId);
                    }}
                    aria-label={`${isSelected ? 'Unselect' : 'Select'} option ${opt.name} for ${parentTraitName}`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </Button>
                  <ChevronDown
                    className="w-4 h-4 text-text-muted dark:text-text-secondary transition-transform group-open:rotate-180 mt-1"
                    aria-hidden="true"
                  />
                </div>
              </summary>

              {opt.description ? (
                <div className="px-3 pb-3">
                  <p className="text-xs text-text-secondary">{opt.description}</p>
                </div>
              ) : null}
            </details>
          );
        })}
      </div>
    </div>
  );
}
