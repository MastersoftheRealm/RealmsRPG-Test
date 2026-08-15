'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';
import { TempModifierToggle } from '@/components/shared';
import { tempModifierValueClass } from '@/lib/character/temp-modifiers';
import { TempModifierStepperRow, useTempModifierActive } from './sheet-temp-modifier-controls';

/**
 * Large stat block for Speed / Evasion / DR / Critical Range.
 * Edit mode: Temp Modifier only (ADR-0006). No pencil / permanent base edit.
 * `value` is the final display number/string (temps already applied by caller).
 * Terminal threshold lives on the Health resource header — not a quick-reference card.
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
  const { tempActive, setTempActive, canTemp, showTempControls } = useTempModifierActive(
    isEditMode,
    onTempDeltaChange,
  );

  return (
    <Card className="flex min-w-[100px] flex-col items-center bg-surface-alt p-4 shadow-none">
      <div className="flex w-full items-center justify-center gap-1.5">
        <span className="text-center text-sm font-semibold tracking-wide text-text-secondary uppercase">
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
          'mt-1 text-4xl font-bold tabular-nums',
          tempModifierValueClass(tempDelta) || 'text-text-primary',
        )}
        aria-label={valueAriaLabel}
      >
        {value}
        {valueSuffix ? (
          <span className="ml-0.5 text-xl font-semibold text-text-secondary">{valueSuffix}</span>
        ) : null}
      </span>

      {showTempControls && onTempDeltaChange && (
        <TempModifierStepperRow
          label={label}
          tempDelta={tempDelta}
          onTempDeltaChange={onTempDeltaChange}
          className="mt-2"
        />
      )}
    </Card>
  );
}
