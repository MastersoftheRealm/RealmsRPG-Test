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
import { PointStatus, ValueStepper } from '@/components/shared';

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
  variant?: 'card' | 'inline';
  /** Whether editing is disabled */
  disabled?: boolean;
  /** Enable hold-to-repeat with exponential acceleration */
  enableHoldRepeat?: boolean;
  /** Allow allocating more points than the pool provides (for manual overrides) */
  allowOverallocation?: boolean;
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
      <div className={cn(
        'rounded-xl border',
        isOverspent ? 'border-danger-300 bg-danger-light' :
        isComplete ? 'border-success-300 bg-success-light' :
        'border-border-light bg-surface-secondary'
      )}>
        <div className={cn(
          'flex items-center justify-between px-4 py-1.5 border-b',
          isOverspent ? 'border-danger-300' :
          isComplete ? 'border-success-300' :
          'border-border-light'
        )}>
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            Health/Energy Allocation
          </span>
          {poolStatus}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 px-4 py-3">
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-lg font-bold text-success-fg min-w-[60px] shrink-0">
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
            <span className="text-xs text-text-muted dark:text-text-secondary whitespace-nowrap shrink-0">pts</span>
          </div>

          <div className="hidden sm:block w-px h-10 bg-border-light shrink-0" />

          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-lg font-bold text-info-fg min-w-[60px] shrink-0">
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
            <span className="text-xs text-text-muted dark:text-text-secondary whitespace-nowrap shrink-0">pts</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-xl border',
      isOverspent ? 'border-danger-300 bg-danger-light' :
      isComplete ? 'border-success-300 bg-success-light' :
      'border-border-light bg-surface-secondary'
    )}>
      <div className={cn(
        'flex items-center justify-between gap-3 px-4 py-2 border-b',
        isOverspent ? 'border-danger-300' :
        isComplete ? 'border-success-300' :
        'border-border-light'
      )}>
        <span className="text-sm font-medium text-text-secondary">Health/Energy Allocation</span>
        {poolStatus}
      </div>

      <div className="grid gap-4 p-4 grid-cols-1 sm:grid-cols-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl font-bold text-success-fg shrink-0 min-w-[4.5rem] md:min-w-[7.5rem]">
            {maxHp}{' '}
            <ResourceName full="Health" abbrev="HP" />
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
          <span className="text-sm text-text-muted dark:text-text-secondary whitespace-nowrap">pts</span>
        </div>

        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl font-bold text-info-fg shrink-0 min-w-[4.5rem] md:min-w-[7.5rem]">
            {maxEnergy}{' '}
            <ResourceName full="Energy" abbrev="EN" />
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
          <span className="text-sm text-text-muted dark:text-text-secondary whitespace-nowrap">pts</span>
        </div>
      </div>
    </div>
  );
}
