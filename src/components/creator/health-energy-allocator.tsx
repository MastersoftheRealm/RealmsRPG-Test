/**
 * Health/Energy Allocator
 * =======================
 * Shared component for allocating Health and Energy points from a shared pool.
 * Used in character creator, character sheet, and creature creator.
 *
 * Uses unified ValueStepper (ADR-0002) with hold-to-repeat for pool allocation.
 * Pool chrome is PointStatus (remaining / total) so Auto-allocate ticks down
 * the same way as Ability / Skill / Training Points trackers (TASK-729).
 *
 * Design notes:
 * - Domain color on totals / value text (Health green, Energy blue) — stepper **buttons** stay neutral
 * - Shows TOTAL value prominently, "points" allocated shown secondary
 *
 * Variants:
 * - "card": Full card layout with visual pool status (default, for creators)
 * - "inline": Compact horizontal layout with progress bars (for sheet edit mode)
 */

'use client';

import { cn } from '@/lib/utils';
import { PointStatus, ValueStepper } from '@/components/patterns';

export interface HealthEnergyAllocatorProps {
  /** Additional Health points allocated beyond base */
  hpBonus: number;
  /** Additional Energy points allocated beyond base */
  energyBonus: number;
  /** Total pool of points available */
  poolTotal: number;
  /** Calculated max Health after bonuses */
  maxHp: number;
  /** Calculated max Energy after bonuses */
  maxEnergy: number;
  /** Callback when Health allocation changes */
  onHpChange: (value: number) => void;
  /** Callback when Energy allocation changes */
  onEnergyChange: (value: number) => void;
  /** Layout variant: 'card' for creators, 'inline' for sheet */
  variant?: 'card' | 'inline' | undefined;
  /** Whether editing is disabled */
  disabled?: boolean | undefined;
  /** Enable hold-to-repeat with exponential acceleration */
  enableHoldRepeat?: boolean | undefined;
  /** Allow allocating more points than the pool provides (for manual overrides) */
  allowOverallocation?: boolean | undefined;
}

function ResourceName({ full, abbrev }: { full: string; abbrev: string }) {
  return (
    <>
      <span className="md:hidden">{abbrev}</span>
      <span className="hidden md:inline">{full}</span>
    </>
  );
}

export function HealthEnergyAllocator({
  hpBonus,
  energyBonus,
  poolTotal,
  maxHp,
  maxEnergy,
  onHpChange,
  onEnergyChange,
  variant = 'card',
  disabled = false,
  enableHoldRepeat = false,
  allowOverallocation = false,
}: HealthEnergyAllocatorProps) {
  const spent = hpBonus + energyBonus;
  const remaining = poolTotal - spent;
  const isOverspent = remaining < 0;
  const isComplete = remaining === 0;
  const compactLabels = variant === 'inline';

  const maxHpBonus = allowOverallocation ? Infinity : hpBonus + remaining;
  const maxEnergyBonus = allowOverallocation ? Infinity : energyBonus + remaining;

  const poolStatus = (
    <PointStatus
      total={poolTotal}
      spent={spent}
      variant={compactLabels ? 'compact' : 'inline'}
      className={compactLabels ? 'text-xs' : undefined}
    />
  );

  const healthLabel = compactLabels ? 'HP' : 'Health';
  const energyLabel = compactLabels ? 'EN' : 'Energy';

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'rounded-xl border',
          isOverspent
            ? 'border-danger-300 bg-danger-light'
            : isComplete
              ? 'border-success-300 bg-success-light'
              : 'border-border-light bg-surface-secondary',
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between border-b px-4 py-1.5',
            isOverspent
              ? 'border-danger-300'
              : isComplete
                ? 'border-success-300'
                : 'border-border-light',
          )}
        >
          <span className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
            Health/Energy Allocation
          </span>
          {poolStatus}
        </div>

        <div className="flex flex-col items-stretch gap-4 px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="min-w-[60px] shrink-0 text-lg font-bold text-success-fg">
              {maxHp} HP
            </span>
            <ValueStepper
              value={hpBonus}
              onChange={onHpChange}
              min={0}
              max={maxHpBonus}
              size="sm"
              variant="compact"
              colorVariant="health"
              enableHoldRepeat={enableHoldRepeat}
              disabled={disabled}
              decrementTitle={`Remove ${healthLabel} points`}
              incrementTitle={`Add ${healthLabel} points`}
            />
            <span className="shrink-0 text-xs whitespace-nowrap text-text-muted">pts</span>
          </div>

          <div className="hidden h-10 w-px shrink-0 bg-border-light sm:block" />

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="min-w-[60px] shrink-0 text-lg font-bold text-info-fg">
              {maxEnergy} EN
            </span>
            <ValueStepper
              value={energyBonus}
              onChange={onEnergyChange}
              min={0}
              max={maxEnergyBonus}
              size="sm"
              variant="compact"
              colorVariant="energy"
              enableHoldRepeat={enableHoldRepeat}
              disabled={disabled}
              decrementTitle={`Remove ${energyLabel} points`}
              incrementTitle={`Add ${energyLabel} points`}
            />
            <span className="shrink-0 text-xs whitespace-nowrap text-text-muted">pts</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border',
        isOverspent
          ? 'border-danger-300 bg-danger-light'
          : isComplete
            ? 'border-success-300 bg-success-light'
            : 'border-border-light bg-surface-secondary',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-3 border-b px-4 py-2',
          isOverspent
            ? 'border-danger-300'
            : isComplete
              ? 'border-success-300'
              : 'border-border-light',
        )}
      >
        <span className="text-sm font-medium text-text-secondary">Health/Energy Allocation</span>
        {poolStatus}
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="min-w-[4.5rem] shrink-0 text-xl font-bold text-success-fg md:min-w-[7.5rem]">
            {maxHp} <ResourceName full="Health" abbrev="HP" />
          </span>
          <ValueStepper
            value={hpBonus}
            onChange={onHpChange}
            min={0}
            max={maxHpBonus}
            size="lg"
            colorVariant="health"
            enableHoldRepeat={enableHoldRepeat}
            disabled={disabled}
            decrementTitle="Remove Health points"
            incrementTitle="Add Health points"
          />
          <span className="text-sm whitespace-nowrap text-text-muted">pts</span>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <span className="min-w-[4.5rem] shrink-0 text-xl font-bold text-info-fg md:min-w-[7.5rem]">
            {maxEnergy} <ResourceName full="Energy" abbrev="EN" />
          </span>
          <ValueStepper
            value={energyBonus}
            onChange={onEnergyChange}
            min={0}
            max={maxEnergyBonus}
            size="lg"
            colorVariant="energy"
            enableHoldRepeat={enableHoldRepeat}
            disabled={disabled}
            decrementTitle="Remove Energy points"
            incrementTitle="Add Energy points"
          />
          <span className="text-sm whitespace-nowrap text-text-muted">pts</span>
        </div>
      </div>
    </div>
  );
}
