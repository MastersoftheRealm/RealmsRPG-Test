'use client';

import type { ChoiceTraitOptionSource } from '@/lib/choice-trait';
import { cn } from '@/lib/utils';
import { Chip, Button } from '@/components/ui';
import { ChevronDown } from 'lucide-react';

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
