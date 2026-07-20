'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';
import { DecrementButton, IncrementButton, TempModifierToggle } from '@/components/shared';
import { tempModifierValueClass } from '@/lib/character/temp-modifiers';

/**
 * Large stat block for Speed / Evasion / DR / Critical Range / Terminal.
 * Edit mode: Temp Modifier only (ADR-0006). No pencil / permanent base edit.
 * `value` is the final display number/string (temps already applied by caller).
 */
export function LargeStatBlock({
  label,
  value,
  valueSuffix,
  valueAriaLabel,
  isEditMode,
  tempDelta = 0,
  onTempDeltaChange,
}: {
  label: string;
  value: number | string;
  valueSuffix?: string;
  /** Optional accessible name for the value (e.g. read-only DR / Critical Range). */
  valueAriaLabel?: string;
  isEditMode?: boolean;
  tempDelta?: number;
  onTempDeltaChange?: (delta: number) => void;
}) {
  const [tempActive, setTempActive] = useState(false);
  const canTemp = Boolean(isEditMode && onTempDeltaChange);
  const showTempControls = canTemp && tempActive;

  return (
    <Card className="flex flex-col items-center p-4 bg-surface-alt min-w-[100px] shadow-none">
      <div className="flex items-center gap-1.5 w-full justify-center">
        <span className="text-sm font-semibold text-text-secondary uppercase tracking-wide text-center">
          {label}
        </span>
        {canTemp && (
          <TempModifierToggle
            isActive={tempActive}
            hasModifiers={tempDelta !== 0}
            onClick={() => setTempActive((prev) => !prev)}
            title={tempActive ? 'Close Temp Modifier' : 'Temp Modifier'}
          />
        )}
      </div>
      <span
        className={cn(
          'text-4xl font-bold mt-1 tabular-nums',
          tempModifierValueClass(tempDelta) || 'text-text-primary'
        )}
        aria-label={valueAriaLabel}
      >
        {value}
        {valueSuffix ? (
          <span className="text-xl font-semibold text-text-secondary ml-0.5">{valueSuffix}</span>
        ) : null}
      </span>

      {showTempControls && onTempDeltaChange && (
        <div className="flex items-center gap-1 mt-2">
          <DecrementButton
            size="sm"
            onClick={() => onTempDeltaChange(tempDelta - 1)}
            title={`Decrease ${label} Temp Modifier`}
          />
          <span
            className={cn(
              'text-xs min-w-[3rem] text-center font-medium',
              tempModifierValueClass(tempDelta) || 'text-text-muted dark:text-text-secondary'
            )}
          >
            Temp: {tempDelta >= 0 ? `+${tempDelta}` : tempDelta}
          </span>
          <IncrementButton
            size="sm"
            onClick={() => onTempDeltaChange(tempDelta + 1)}
            title={`Increase ${label} Temp Modifier`}
          />
        </div>
      )}
    </Card>
  );
}
