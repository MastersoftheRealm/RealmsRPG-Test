'use client';

import { ValueStepper, SectionCostBadge } from '@/components/patterns';
import { CollapsibleSection } from '@/components/creator';
import { Checkbox } from '@/components/ui';
import { formatAreaForDisplay, type AreaConfig, type DurationConfig } from '@/lib/calculators';
import { formatDurationFromTypeAndValue } from '@/lib/utils/duration';
import { AREA_TYPES, DURATION_TYPES, DURATION_VALUES } from '@/lib/game/creator-constants';
import { applyShortDurationClear, isShortPowerDuration } from '@/lib/game/power-duration-config';
import { cn } from '@/lib/utils/cn';
import type { EmpoweredTechniqueCreatorEditorProps } from './empowered-technique-editor-config';

export type EmpoweredTechniqueEditorPowerConfigProps = Pick<
  EmpoweredTechniqueCreatorEditorProps,
  | 'rangeDisplay'
  | 'range'
  | 'onRangeStepsChange'
  | 'area'
  | 'onAreaChange'
  | 'duration'
  | 'onDurationChange'
  | 'sectionCosts'
>;

export function EmpoweredTechniqueEditorPowerConfig({
  rangeDisplay,
  range,
  onRangeStepsChange,
  area,
  onAreaChange,
  duration,
  onDurationChange,
  sectionCosts,
}: EmpoweredTechniqueEditorPowerConfigProps) {
  const powerConfigSummary = `${rangeDisplay} • ${area.type === 'none' ? 'Single target' : formatAreaForDisplay(area.type, area.level)} • ${duration.type === 'instant' ? 'Instant' : formatDurationFromTypeAndValue(duration.type, duration.value)}`;
  const durationValueOptions = DURATION_VALUES[duration.type];

  return (
    <CollapsibleSection title="Power Configuration" collapsedSummary={powerConfigSummary}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <SectionCostBadge en={sectionCosts.range.energyRaw} tp={sectionCosts.range.totalTP} />
          <ValueStepper value={range.steps} onChange={onRangeStepsChange} label="Range:" min={0} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <SectionCostBadge en={sectionCosts.area.energyRaw} tp={sectionCosts.area.totalTP} />
          <select
            value={area.type}
            onChange={(event) =>
              onAreaChange((previous) => ({
                ...previous,
                type: event.target.value as AreaConfig['type'],
              }))
            }
            className="touch-tier-standard rounded-lg border border-border-light bg-surface px-4 py-2 text-text-primary"
            aria-label="Empowered technique area type"
          >
            {AREA_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {area.type !== 'none' && (
            <>
              <ValueStepper
                value={area.level}
                onChange={(value) => onAreaChange((previous) => ({ ...previous, level: value }))}
                label="Area Level:"
                min={1}
              />
              <Checkbox
                checked={area.applyDuration ?? false}
                onChange={(event) =>
                  onAreaChange((previous) => ({
                    ...previous,
                    applyDuration: event.target.checked,
                  }))
                }
                label="Apply duration"
              />
            </>
          )}
        </div>
        <div className="space-y-3 border-t border-border-light pt-2">
          <div className="flex flex-wrap items-center gap-4">
            <SectionCostBadge
              en={sectionCosts.duration.energyRaw}
              tp={sectionCosts.duration.totalTP}
            />
            <select
              value={duration.type}
              onChange={(event) => {
                const newType = event.target.value as DurationConfig['type'];
                const newValue = DURATION_VALUES[newType]?.[0]?.value || 1;
                const next = applyShortDurationClear({
                  ...duration,
                  type: newType,
                  value: newValue,
                });
                onDurationChange(() => next);
              }}
              className="touch-tier-standard rounded-lg border border-border-light bg-surface px-4 py-2 text-text-primary"
              aria-label="Empowered technique duration type"
            >
              {DURATION_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {duration.type !== 'instant' &&
              duration.type !== 'permanent' &&
              durationValueOptions && (
                <select
                  value={duration.value}
                  onChange={(event) => {
                    const newValue = Number(event.target.value);
                    onDurationChange((previous) =>
                      applyShortDurationClear({
                        ...previous,
                        value: newValue,
                      }),
                    );
                  }}
                  className="touch-tier-standard rounded-lg border border-border-light bg-surface px-4 py-2 text-text-primary"
                  aria-label="Empowered technique duration value"
                >
                  {durationValueOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
          </div>
          {(() => {
            const shortDuration = isShortPowerDuration(duration);
            return (
              <div
                className={cn('flex flex-wrap items-center gap-4', shortDuration && 'opacity-50')}
              >
                <Checkbox
                  checked={duration.focus || false}
                  onChange={(event) =>
                    onDurationChange((previous) => ({
                      ...previous,
                      focus: event.target.checked,
                    }))
                  }
                  label="Focus"
                  disabled={shortDuration}
                />
                <Checkbox
                  checked={duration.noHarm || false}
                  onChange={(event) =>
                    onDurationChange((previous) => ({
                      ...previous,
                      noHarm: event.target.checked,
                    }))
                  }
                  label="No Harm or Adaptation Parts"
                  disabled={shortDuration}
                />
                <Checkbox
                  checked={duration.endsOnActivation || false}
                  onChange={(event) =>
                    onDurationChange((previous) => ({
                      ...previous,
                      endsOnActivation: event.target.checked,
                    }))
                  }
                  label="Ends on Activation"
                  disabled={shortDuration}
                />
                <select
                  value={duration.sustain || 0}
                  onChange={(event) =>
                    onDurationChange((previous) => ({
                      ...previous,
                      sustain: Number(event.target.value),
                    }))
                  }
                  className="touch-tier-standard rounded border border-border-light bg-surface px-2 py-1 text-sm text-text-primary"
                  aria-label="Empowered technique sustain action points"
                  disabled={shortDuration}
                >
                  <option value={0}>Sustain: None</option>
                  <option value={1}>Sustain: 1 AP</option>
                  <option value={2}>Sustain: 2 AP</option>
                  <option value={3}>Sustain: 3 AP</option>
                  <option value={4}>Sustain: 4 AP</option>
                </select>
              </div>
            );
          })()}
        </div>
      </div>
    </CollapsibleSection>
  );
}
