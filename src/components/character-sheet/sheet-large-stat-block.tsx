'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';
import { TempModifierToggle } from '@/components/patterns';
import { tempModifierTintFromDelta, tempModifierValueClass } from '@/lib/character/temp-modifiers';
import { TempModifierStepperRow, useTempModifierActive } from './sheet-temp-modifier-controls';

/**
 * Large stat block for Speed / Evasion / DR / Critical Range.
 * Temp Modifier mode: per-stat sliders toggle (ADR-0006 / TASK-782). No pencil / permanent base edit.
 * `value` is the final display number/string (temps already applied by caller).
 * Terminal threshold lives on the Health resource header — not a quick-reference card.
 */
export function LargeStatBlock({
  label,
  value,
  valueSuffix,
  valueAriaLabel,
  isTempModifierMode,
  tempDelta = 0,
  onTempDeltaChange,
}: {
  label: string;
  value: number | string;
  valueSuffix?: string | undefined;
  /** Optional accessible name for the value (e.g. read-only DR / Critical Range). */
  valueAriaLabel?: string | undefined;
  isTempModifierMode?: boolean | undefined;
  tempDelta?: number | undefined;
  onTempDeltaChange?: ((delta: number) => void) | undefined;
}) {
  const { tempActive, setTempActive, canTemp, showTempControls } = useTempModifierActive(
    isTempModifierMode,
    onTempDeltaChange,
  );
  const tint = tempModifierTintFromDelta(tempDelta);

  return (
    <Card
      className={cn(
        'flex w-full max-w-[8.75rem] min-w-[6.75rem] flex-col items-center justify-center bg-surface-alt px-2.5 py-2 shadow-none',
        !showTempControls && 'aspect-square',
      )}
    >
      <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-1.5">
        <span className="min-w-0 text-center text-xs leading-tight font-semibold tracking-wide break-normal text-text-secondary uppercase sm:text-sm">
          {label}
        </span>
        {canTemp && (
          <TempModifierToggle
            isActive={tempActive}
            tint={tint}
            onClick={() => setTempActive((prev) => !prev)}
            title={tempActive ? 'Close Temp Modifier' : 'Temp Modifier'}
          />
        )}
      </div>
      <span
        className={cn(
          'mt-1 text-3xl font-bold tabular-nums sm:text-4xl',
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
