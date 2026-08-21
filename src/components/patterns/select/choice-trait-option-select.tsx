'use client';

import type { ChoiceTraitOptionSource } from '@/lib/choice-trait';
import { cn } from '@/lib/utils';
import { DescriptorChip, Button } from '@/components/ui';
import { ChevronDown } from 'lucide-react';

export interface ChoiceTraitOptionListPickerProps {
  parentTraitName: string;
  optionTraits: ChoiceTraitOptionSource[];
  value: string;
  onChange: (next: string) => void;
  emptyLabel?: string | undefined;
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
      <div className="flex items-center justify-between gap-2 border-b border-border-light px-3 py-2">
        <p className="text-xs font-semibold tracking-wide text-text-secondary uppercase">Options</p>
        {selected ? (
          <DescriptorChip variant="info">Selected: {selected.name}</DescriptorChip>
        ) : (
          <span className="text-xs text-text-muted">{emptyLabel}</span>
        )}
      </div>

      <div className="space-y-2 p-2">
        {optionTraits.map((opt) => {
          const optId = String(opt.id);
          const isSelected = optId === String(value);

          return (
            <details
              key={optId}
              className={cn(
                'group rounded-md border border-border-light bg-surface',
                isSelected && 'border-primary-subtle-border bg-primary-subtle-bg',
              )}
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">{opt.name}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
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
                    className="mt-1 h-4 w-4 text-text-muted transition-transform group-open:rotate-180"
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
