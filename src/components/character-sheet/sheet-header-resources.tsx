'use client';

import { cn } from '@/lib/utils';
import { HealthEnergyAllocator } from '@/components/creator';
import { ValueStepper } from '@/components/patterns';
import { TempModifierInlineLabel } from './sheet-temp-modifier-controls';
import { ResourceInput } from './sheet-resource-input';

export function SheetHeaderResources({
  actionPoints,
  onActionPointsChange,
  currentHealth,
  maxHealth,
  onHealthChange,
  currentEnergy,
  maxEnergy,
  onEnergyChange,
  terminal,
  terminalTempDelta = 0,
  onTerminalTempChange,
  innateThreshold = 0,
  innatePools = 0,
  isEditMode,
  isTempModifierMode,
  healthPoints,
  energyPoints,
  totalHEPool,
  onHealthPointsChange,
  onEnergyPointsChange,
}: {
  actionPoints: number;
  onActionPointsChange?: ((value: number) => void) | undefined;
  currentHealth: number;
  maxHealth: number;
  onHealthChange?: ((value: number) => void) | undefined;
  currentEnergy: number;
  maxEnergy: number;
  onEnergyChange?: ((value: number) => void) | undefined;
  terminal: number;
  terminalTempDelta?: number | undefined;
  onTerminalTempChange?: ((delta: number) => void) | undefined;
  innateThreshold?: number | undefined;
  innatePools?: number | undefined;
  isEditMode: boolean;
  isTempModifierMode?: boolean | undefined;
  healthPoints: number;
  energyPoints: number;
  totalHEPool: number;
  onHealthPointsChange?: ((value: number) => void) | undefined;
  onEnergyPointsChange?: ((value: number) => void) | undefined;
}) {
  return (
    /* Right: Action Points (left, spans vertically) + Health & Energy (right) */
    <div className="flex w-full min-w-0 flex-col">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row">
        {/* Action Points - left column, spans full height of Health+Energy */}
        <div
          className={cn(
            'flex min-w-[72px] flex-col justify-center rounded-lg border p-3',
            'border-border-light bg-surface-alt dark:border-border dark:bg-surface',
          )}
        >
          <span className="mb-1.5 text-center text-xs font-semibold tracking-wide text-text-secondary uppercase dark:text-text-primary">
            Action Points
          </span>
          <div className="flex items-center justify-center">
            {onActionPointsChange ? (
              <ValueStepper
                value={actionPoints}
                onChange={onActionPointsChange}
                min={0}
                max={10}
                colorVariant="default"
                enableHoldRepeat
                size="sm"
                variant="compact"
                hideValue={false}
                decrementTitle="Decrease action points"
                incrementTitle="Increase action points"
              />
            ) : (
              <span className="text-lg font-bold text-text-primary">{actionPoints}</span>
            )}
          </div>
        </div>

        {/* Health & Energy stacked — Terminal threshold is health-context metadata, not a header quick-stat */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <ResourceInput
            label="Health"
            current={currentHealth}
            max={maxHealth}
            onChange={onHealthChange}
            colorVariant="health"
            min={Number.NEGATIVE_INFINITY}
            showBar
            headerRight={
              <TempModifierInlineLabel
                displayText={`Terminal: ${terminal}`}
                ariaLabel={`Terminal ${terminal}`}
                titleLabel="Terminal"
                tempDelta={terminalTempDelta}
                isTempModifierMode={isTempModifierMode}
                onTempDeltaChange={onTerminalTempChange}
              />
            }
          />
          <ResourceInput
            label="Energy"
            current={currentEnergy}
            max={maxEnergy}
            onChange={onEnergyChange}
            colorVariant="energy"
            subLabel={
              innateThreshold > 0
                ? `Innate: ${innateThreshold}${innatePools > 1 ? ` (${innatePools}×)` : ''}`
                : undefined
            }
            showBar
          />
        </div>
      </div>

      {/* Health-Energy Pool Allocation (edit mode only) */}
      {isEditMode && onHealthPointsChange && onEnergyPointsChange && (
        <div className="mt-2">
          <HealthEnergyAllocator
            hpBonus={healthPoints}
            energyBonus={energyPoints}
            poolTotal={totalHEPool}
            maxHp={maxHealth}
            maxEnergy={maxEnergy}
            onHpChange={onHealthPointsChange}
            onEnergyChange={onEnergyPointsChange}
            variant="inline"
            allowOverallocation
            enableHoldRepeat
          />
        </div>
      )}
    </div>
  );
}
