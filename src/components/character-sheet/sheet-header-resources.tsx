'use client';

import { cn } from '@/lib/utils';
import { HealthEnergyAllocator } from '@/components/creator';
import { ValueStepper } from '@/components/shared';
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
  innateThreshold = 0,
  innatePools = 0,
  isEditMode,
  healthPoints,
  energyPoints,
  totalHEPool,
  onHealthPointsChange,
  onEnergyPointsChange,
}: {
  actionPoints: number;
  onActionPointsChange?: (value: number) => void;
  currentHealth: number;
  maxHealth: number;
  onHealthChange?: (value: number) => void;
  currentEnergy: number;
  maxEnergy: number;
  onEnergyChange?: (value: number) => void;
  innateThreshold?: number;
  innatePools?: number;
  isEditMode: boolean;
  healthPoints: number;
  energyPoints: number;
  totalHEPool: number;
  onHealthPointsChange?: (value: number) => void;
  onEnergyPointsChange?: (value: number) => void;
}) {
  return (
    /* Right: Action Points (left, spans vertically) + Health & Energy (right) */
    <div className="w-full min-w-0 md:min-w-[260px] lg:w-1/3 flex flex-col">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        {/* Action Points - left column, spans full height of Health+Energy */}
        <div className={cn(
          'flex flex-col justify-center p-3 rounded-lg border min-w-[72px]',
          'bg-surface-alt dark:bg-surface border-border-light dark:border-border'
        )}>
          <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary dark:text-text-primary text-center mb-1.5">
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

        {/* Health & Energy stacked */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <ResourceInput
            label="Health"
            current={currentHealth}
            max={maxHealth}
            onChange={onHealthChange}
            colorVariant="health"
            showBar
          />
          <ResourceInput
            label="Energy"
            current={currentEnergy}
            max={maxEnergy}
            onChange={onEnergyChange}
            colorVariant="energy"
            subLabel={innateThreshold > 0 ? `Innate: ${innateThreshold}${innatePools > 1 ? ` (${innatePools}×)` : ''}` : undefined}
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
