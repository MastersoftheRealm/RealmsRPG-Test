/**
 * Ancestry trait section chrome — shared by Advanced AncestryStep and sheet Edit Species.
 */

'use client';

import { cn } from '@/lib/utils';
import {
  getChoiceOptionIds,
  resolveChoiceOptionTraits,
  firstSelectedChoiceOptionId,
} from '@/lib/choice-trait';
import { SelectionToggle, ChoiceTraitOptionListPicker } from '@/components/shared';
import type { Trait } from '@/hooks';

export interface TraitSectionProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  traits: Trait[];
  selectable: boolean;
  selectedIds: string[];
  onToggle: (id: string) => void;
  variant?: 'default' | 'ancestry' | 'characteristic' | 'flaw';
  /** When provided, choice traits (option_trait_ids) show a picker; onToggle(optionId) is used. */
  allTraits?: Trait[] | null;
  /** Single-species automatic species traits: parent id → chosen option trait id. */
  speciesTraitChoices?: Record<string, string>;
  onSpeciesTraitChoiceChange?: (parentTraitId: string, optionId: string) => void;
}

export function TraitSection({
  title,
  subtitle,
  icon,
  traits,
  selectable,
  selectedIds,
  onToggle,
  variant = 'default',
  allTraits,
  speciesTraitChoices,
  onSpeciesTraitChoiceChange,
}: TraitSectionProps) {
  const variantStyles = {
    default: {
      border: 'border-border-light',
      header: 'bg-surface-alt',
      selected: 'border-primary-outline-border bg-primary-subtle-bg',
    },
    ancestry: {
      border: 'border-warning-300',
      header: 'bg-warning-light',
      selected: 'border-warning-500 bg-warning-light',
    },
    characteristic: {
      border: 'border-info-border',
      header: 'bg-info-light',
      selected: 'border-info-500 bg-info-light',
    },
    flaw: {
      border: 'border-danger-300',
      header: 'bg-danger-light',
      selected: 'border-danger-500 bg-danger-light',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={cn('mb-6 overflow-hidden rounded-xl border', styles.border)}>
      <div
        className={cn('flex items-center gap-2 border-b px-4 py-3', styles.header, styles.border)}
      >
        {icon}
        <div>
          <h3 className="font-bold text-text-primary">{title}</h3>
          {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
        </div>
      </div>

      <div className="divide-y divide-border-subtle">
        {traits.map((trait) => {
          const optionIds = getChoiceOptionIds(trait);
          const optionOptions = resolveChoiceOptionTraits(optionIds, allTraits ?? undefined);
          const isChoiceTrait = optionOptions.length > 0;
          const selectedOptionId = firstSelectedChoiceOptionId(optionIds, selectedIds);
          const isSelected = isChoiceTrait
            ? Boolean(selectedOptionId)
            : selectedIds.includes(String(trait.id));

          if (isChoiceTrait && selectable) {
            return (
              <div
                key={trait.id}
                className={cn(
                  'px-4 py-3 transition-colors',
                  'hover:bg-surface-alt',
                  isSelected && styles.selected,
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-text-primary">{trait.name}</h4>
                    <p className="mt-1 text-sm text-text-secondary">{trait.description}</p>
                    <ChoiceTraitOptionListPicker
                      parentTraitName={trait.name}
                      optionTraits={optionOptions}
                      value={selectedOptionId ?? ''}
                      onChange={(next) => {
                        if (selectedOptionId) onToggle(selectedOptionId);
                        if (next) onToggle(next);
                      }}
                      emptyLabel="Choose one option (expand to read)"
                    />
                  </div>
                </div>
              </div>
            );
          }

          if (isChoiceTrait && !selectable && onSpeciesTraitChoiceChange && allTraits) {
            const pid = String(trait.id);
            const value = speciesTraitChoices?.[pid] ?? '';
            const speciesChoiceSelected = Boolean(value);
            return (
              <div
                key={trait.id}
                className={cn(
                  'px-4 py-3 transition-colors',
                  'hover:bg-surface-alt',
                  speciesChoiceSelected && styles.selected,
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-text-primary">{trait.name}</h4>
                    <p className="mt-1 text-sm text-text-secondary">{trait.description}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      Choose one variant for this species trait.
                    </p>
                    <ChoiceTraitOptionListPicker
                      parentTraitName={trait.name}
                      optionTraits={optionOptions}
                      value={value}
                      onChange={(next) => onSpeciesTraitChoiceChange(pid, next)}
                      emptyLabel="Choose one option (expand to read)"
                    />
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={trait.id}
              className={cn(
                'px-4 py-3 transition-colors',
                selectable && 'hover:bg-surface-alt',
                isSelected && styles.selected,
              )}
            >
              <div className="flex items-start gap-3">
                {selectable && (
                  <div className="shrink-0 self-center">
                    <SelectionToggle
                      isSelected={isSelected}
                      onToggle={() => onToggle(String(trait.id))}
                      size="lg"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-text-primary">{trait.name}</h4>
                  <p className="mt-1 text-sm text-text-secondary">{trait.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
