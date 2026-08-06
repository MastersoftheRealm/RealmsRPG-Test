/**
 * PowerTechniqueFilters — Category / Energy / Action / (power) Innate filters.
 * Composes ChipSelect, SelectFilter, FilterSection primitives (TASK-673).
 */

'use client';

import { useId } from 'react';
import { Input } from '@/components/ui';
import { InfoTippy } from '@/components/shared/info-tippy';
import { ChipSelect } from './chip-select';
import { SelectFilter } from './select-filter';
import { FilterSection } from './filter-section';
import {
  POWER_TECHNIQUE_ACTION_FILTER_OPTIONS,
  REACTION_FILTER_OPTIONS,
  countActivePowerTechniqueFilters,
  withInnateThresholdSelected,
  type PowerTechniqueFilterKind,
  type PowerTechniqueFilterState,
  type ReactionFilterMode,
} from '@/lib/library/power-technique-filters';

const INNATE_THRESHOLD_HELP =
  'Innate Threshold is the maximum Energy a power may cost to be taken as Innate. Values come from core rules progression (e.g. 6 at Power Proficiency 1 / Powered-Martial, 8 at Power Proficiency 2, then higher at later levels). Selecting a threshold also enables Innate Eligible.';

export interface PowerTechniqueFiltersProps {
  kind: PowerTechniqueFilterKind;
  value: PowerTechniqueFilterState;
  onChange: (next: PowerTechniqueFilterState) => void;
  /** Category options derived from the current list. */
  categoryOptions: string[];
  /** Innate Threshold dropdown values from `listInnateThresholdFilterOptions`. */
  innateThresholdOptions?: number[];
  /** FilterSection page vs compact (selection modals later). */
  variant?: 'page' | 'compact';
  defaultExpanded?: boolean;
  className?: string;
}

export function PowerTechniqueFilters({
  kind,
  value,
  onChange,
  categoryOptions,
  innateThresholdOptions = [],
  variant = 'page',
  defaultExpanded = false,
  className,
}: PowerTechniqueFiltersProps) {
  const energyMinId = useId();
  const energyMaxId = useId();
  const innateEligibleId = useId();
  const activeCount = countActivePowerTechniqueFilters(value, kind);

  const set = (patch: Partial<PowerTechniqueFilterState>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <FilterSection
      variant={variant}
      defaultExpanded={defaultExpanded}
      activeCount={activeCount}
      className={className}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ChipSelect
          label="Category"
          placeholder="Choose category"
          options={categoryOptions.map((c) => ({ value: c, label: c }))}
          selectedValues={value.categories}
          onSelect={(v) => set({ categories: [...value.categories, v] })}
          onRemove={(v) =>
            set({ categories: value.categories.filter((c) => c !== v) })
          }
        />

        <div className="filter-group">
          <label htmlFor={energyMinId} className="mb-1 block text-sm font-medium text-text-secondary">
            Min Energy
          </label>
          <Input
            id={energyMinId}
            type="number"
            min={0}
            value={value.energyMin ?? ''}
            onChange={(e) =>
              set({
                energyMin: e.target.value === '' ? null : Number(e.target.value),
              })
            }
            placeholder="No min"
          />
        </div>

        <div className="filter-group">
          <label htmlFor={energyMaxId} className="mb-1 block text-sm font-medium text-text-secondary">
            Max Energy
          </label>
          <Input
            id={energyMaxId}
            type="number"
            min={0}
            value={value.energyMax ?? ''}
            onChange={(e) =>
              set({
                energyMax: e.target.value === '' ? null : Number(e.target.value),
              })
            }
            placeholder="No max"
          />
        </div>

        <ChipSelect
          label="Action Type"
          placeholder="Choose action type"
          options={POWER_TECHNIQUE_ACTION_FILTER_OPTIONS}
          selectedValues={value.actionTypes}
          onSelect={(v) => set({ actionTypes: [...value.actionTypes, v] })}
          onRemove={(v) =>
            set({ actionTypes: value.actionTypes.filter((a) => a !== v) })
          }
        />

        <SelectFilter
          label="Action / Reaction"
          value={value.reactionMode}
          options={REACTION_FILTER_OPTIONS}
          onChange={(v) => set({ reactionMode: v as ReactionFilterMode })}
          placeholder={null}
        />

        {kind === 'power' ? (
          <>
            <SelectFilter
              label="Power Threshold (Innate)"
              value={value.innateThreshold != null ? String(value.innateThreshold) : ''}
              options={innateThresholdOptions.map((n) => ({
                value: String(n),
                label: String(n),
              }))}
              onChange={(v) => onChange(withInnateThresholdSelected(value, v))}
              placeholder="Any"
              labelAccessory={
                <InfoTippy
                  content={INNATE_THRESHOLD_HELP}
                  label="Innate threshold filter help"
                  size="inline"
                />
              }
            />

            <div className="filter-group flex items-end">
              <label
                htmlFor={innateEligibleId}
                className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-text-primary"
              >
                <input
                  id={innateEligibleId}
                  type="checkbox"
                  checked={value.innateEligibleOnly}
                  onChange={(e) => set({ innateEligibleOnly: e.target.checked })}
                  className="h-4 w-4 rounded border-border-light text-primary-fg focus:ring-primary-outline-border"
                />
                Innate Eligible
              </label>
            </div>
          </>
        ) : null}
      </div>
    </FilterSection>
  );
}
