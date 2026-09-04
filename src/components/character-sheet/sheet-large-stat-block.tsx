'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';
import { TempModifierToggle } from '@/components/patterns';
import { tempModifierTintFromDelta, tempModifierValueClass } from '@/lib/character/temp-modifiers';
import { TempModifierStepperRow, useTempModifierActive } from './sheet-temp-modifier-controls';

/**
 * Compact header tiles for Speed / Evasion / DR / Critical Range (TASK-908).
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
        'flex h-full flex-col items-center justify-center bg-surface-alt px-1.5 py-1.5 shadow-none',
        showTempControls ? 'w-[7.5rem]' : 'w-[6.25rem]',
      )}
    >
      <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-1">
        <span className="min-w-0 text-center text-xs leading-tight font-semibold tracking-normal break-normal text-text-secondary uppercase">
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
          'mt-0.5 text-2xl font-bold tabular-nums sm:text-3xl',
          tempModifierValueClass(tempDelta) || 'text-text-primary',
        )}
        aria-label={valueAriaLabel}
      >
        {value}
        {valueSuffix ? (
          <span className="ml-0.5 text-base font-semibold text-text-secondary">{valueSuffix}</span>
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
