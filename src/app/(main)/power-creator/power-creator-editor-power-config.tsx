/**
 * Power Creator — range, area, duration sections (TASK-616)
 */

'use client';

import { cn } from '@/lib/utils';
import { ValueStepper, SectionCostBadge } from '@/components/shared';
import { CollapsibleSection } from '@/components/creator';
import { Checkbox } from '@/components/ui';
import {
  formatAreaForDisplay,
  type AreaConfig,
  type DurationConfig,
} from '@/lib/calculators';
import { AREA_TYPES, DURATION_TYPES, DURATION_VALUES } from '@/lib/game/creator-constants';
import type { RangeConfig } from './power-creator-types';
import type { PowerAreaPartInfo } from './power-creator-editor-config';
import type { PowerSectionCosts } from './power-creator-cost-derivation';

type PowerCreatorEditorPowerConfigProps = {
  range: RangeConfig;
  onRangeChange: (updater: (prev: RangeConfig) => RangeConfig) => void;
  rangeSummary: string;
  area: AreaConfig;
  onAreaChange: (updater: (prev: AreaConfig) => AreaConfig) => void;
  areaPartInfo: PowerAreaPartInfo;
  duration: DurationConfig;
  onDurationChange: (next: DurationConfig | ((prev: DurationConfig) => DurationConfig)) => void;
  durationSummary: string;
  sectionCosts: PowerSectionCosts;
};

export function PowerCreatorEditorPowerConfig({
  range,
  onRangeChange,
  rangeSummary,
  area,
  onAreaChange,
  areaPartInfo,
  duration,
  onDurationChange,
  durationSummary,
  sectionCosts,
}: PowerCreatorEditorPowerConfigProps) {
  return (
    <>
      <CollapsibleSection
        title="Range"
        collapsedSummary={rangeSummary}
        defaultExpanded={true}
        rightSlot={<SectionCostBadge en={sectionCosts.range.energyRaw} tp={sectionCosts.range.totalTP} />}
      >
        <div className="flex flex-wrap items-center gap-4">
          <ValueStepper
            value={range.steps}
            onChange={(v) => onRangeChange((r) => ({ ...r, steps: v }))}
            label="Range:"
            min={0}
            max={10}
          />
          <span className="text-sm text-text-secondary">
            {range.steps === 0 ? '(1 Space / Melee)' : `(${range.steps * 3} spaces)`}
          </span>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Area of Effect"
        collapsedSummary={area.type === 'none' ? 'Single target' : formatAreaForDisplay(area.type, area.level)}
        defaultExpanded={true}
        rightSlot={<SectionCostBadge en={sectionCosts.area.energyRaw} tp={sectionCosts.area.totalTP} />}
      >
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <select
            aria-label="Area of effect"
            value={area.type}
            onChange={(e) => onAreaChange((a) => ({ ...a, type: e.target.value as AreaConfig['type'] }))}
            className="px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
          >
            {AREA_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {area.type !== 'none' && (
            <ValueStepper
              value={area.level}
              onChange={(v) => onAreaChange((a) => ({ ...a, level: v }))}
              label="Level:"
              min={1}
              max={10}
            />
          )}
        </div>
        {area.type !== 'none' && (
          <div className="mt-4">
            <Checkbox
              checked={area.applyDuration ?? false}
              onChange={(e) => onAreaChange((a) => ({ ...a, applyDuration: e.target.checked }))}
              label="Apply duration"
            />
          </div>
        )}
        {areaPartInfo && (
          <div className="mt-4 p-4 rounded-lg bg-surface-alt border border-border-light">
            <p className="text-sm text-text-primary leading-relaxed">{areaPartInfo.description}</p>
            {areaPartInfo.op1Desc && areaPartInfo.op1Level > 0 && (
              <div className="mt-3 pt-3 border-t border-border-light">
                <p className="text-sm font-medium text-text-secondary dark:text-text-primary mb-1">
                  Option 1 (Level {areaPartInfo.op1Level + 1}):
                </p>
                <p className="text-sm text-text-primary">{areaPartInfo.op1Desc}</p>
              </div>
            )}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Duration"
        collapsedSummary={durationSummary}
        defaultExpanded={true}
        rightSlot={<SectionCostBadge en={sectionCosts.duration.energyRaw} tp={sectionCosts.duration.totalTP} />}
      >
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <select
            aria-label="Duration type"
            value={duration.type}
            onChange={(e) => {
              const newType = e.target.value as DurationConfig['type'];
              const newValue = DURATION_VALUES[newType]?.[0]?.value || 1;
              const isShortDuration = newType === 'instant' || (newType === 'rounds' && newValue === 1);
              if (isShortDuration) {
                onDurationChange({
                  type: newType,
                  value: newValue,
                  applyDuration: false,
                  focus: false,
                  noHarm: false,
                  endsOnActivation: false,
                  sustain: 0,
                });
              } else {
                onDurationChange((d) => ({ ...d, type: newType, value: newValue }));
              }
            }}
            className="px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
          >
            {DURATION_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {duration.type !== 'instant' && duration.type !== 'permanent' && DURATION_VALUES[duration.type] && (
            <select
              aria-label="Duration value"
              value={duration.value}
              onChange={(e) => {
                const newValue = parseInt(e.target.value);
                if (duration.type === 'rounds' && newValue === 1) {
                  onDurationChange({
                    type: duration.type,
                    value: newValue,
                    applyDuration: duration.applyDuration ?? false,
                    focus: false,
                    noHarm: false,
                    endsOnActivation: false,
                    sustain: 0,
                  });
                } else {
                  onDurationChange((d) => ({ ...d, value: newValue }));
                }
              }}
              className="px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
            >
              {DURATION_VALUES[duration.type].map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>
        {(() => {
          const isShortDuration = duration.type === 'instant' || (duration.type === 'rounds' && duration.value === 1);
          return (
            <div
              className={cn(
                'flex flex-wrap items-center gap-4 pt-3 border-t border-border-light',
                isShortDuration && 'opacity-50',
              )}
            >
              <Checkbox
                checked={duration.focus || false}
                onChange={(e) => onDurationChange((d) => ({ ...d, focus: e.target.checked }))}
                label="Focus"
                disabled={isShortDuration}
              />
              <Checkbox
                checked={duration.noHarm || false}
                onChange={(e) => onDurationChange((d) => ({ ...d, noHarm: e.target.checked }))}
                label="No Harm or Adaptation Parts"
                disabled={isShortDuration}
              />
              <Checkbox
                checked={duration.endsOnActivation || false}
                onChange={(e) => onDurationChange((d) => ({ ...d, endsOnActivation: e.target.checked }))}
                label="Ends on Activation"
                disabled={isShortDuration}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-secondary">Sustain:</span>
                <select
                  aria-label="Sustain cost in action points"
                  value={duration.sustain || 0}
                  onChange={(e) => onDurationChange((d) => ({ ...d, sustain: parseInt(e.target.value) }))}
                  className="px-2 py-1 border border-border-light rounded text-sm text-text-primary bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isShortDuration}
                >
                  <option value={0}>None</option>
                  <option value={1}>1 AP</option>
                  <option value={2}>2 AP</option>
                  <option value={3}>3 AP</option>
                  <option value={4}>4 AP</option>
                </select>
              </div>
              {isShortDuration && (
                <span className="text-xs text-text-muted dark:text-text-secondary italic">(Requires 2+ rounds)</span>
              )}
            </div>
          );
        })()}
      </CollapsibleSection>
    </>
  );
}
