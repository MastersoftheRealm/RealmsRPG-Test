'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { DecrementButton, IncrementButton, TempModifierToggle } from '@/components/shared';
import { tempModifierValueClass } from '@/lib/character/temp-modifiers';

/** Co-located Temp Modifier chrome for sheet header (ADR-0006). Not a shared barrel export. */
export function useTempModifierActive(
  isEditMode?: boolean,
  onTempDeltaChange?: (delta: number) => void,
) {
  const [tempActive, setTempActive] = useState(false);
  const canTemp = Boolean(isEditMode && onTempDeltaChange);
  const showTempControls = canTemp && tempActive;
  return { tempActive, setTempActive, canTemp, showTempControls };
}

export function TempModifierStepperRow({
  label,
  tempDelta,
  onTempDeltaChange,
  deltaFormat = 'temp-label',
  className,
}: {
  label: string;
  tempDelta: number;
  onTempDeltaChange: (delta: number) => void;
  /** LargeStatBlock uses "Temp: +N"; inline health header uses signed only. */
  deltaFormat?: 'temp-label' | 'signed';
  className?: string;
}) {
  const deltaText =
    deltaFormat === 'signed'
      ? tempDelta >= 0
        ? `+${tempDelta}`
        : String(tempDelta)
      : `Temp: ${tempDelta >= 0 ? `+${tempDelta}` : tempDelta}`;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <DecrementButton
        size="sm"
        onClick={() => onTempDeltaChange(tempDelta - 1)}
        title={`Decrease ${label} Temp Modifier`}
      />
      <span
        className={cn(
          'min-w-[2.5rem] text-center text-xs font-medium tabular-nums',
          tempModifierValueClass(tempDelta) || 'text-text-muted',
        )}
      >
        {deltaText}
      </span>
      <IncrementButton
        size="sm"
        onClick={() => onTempDeltaChange(tempDelta + 1)}
        title={`Increase ${label} Temp Modifier`}
      />
    </div>
  );
}

/** Compact inline label + temp controls (e.g. Health header `Terminal: X`). */
export function TempModifierInlineLabel({
  displayText,
  ariaLabel,
  titleLabel,
  tempDelta = 0,
  isEditMode,
  onTempDeltaChange,
  valueClassName,
}: {
  displayText: string;
  ariaLabel: string;
  /** Used in stepper button titles (e.g. "Terminal"). */
  titleLabel: string;
  tempDelta?: number;
  isEditMode?: boolean;
  onTempDeltaChange?: (delta: number) => void;
  valueClassName?: string;
}) {
  const { tempActive, setTempActive, canTemp, showTempControls } = useTempModifierActive(
    isEditMode,
    onTempDeltaChange,
  );

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <span
          className={cn(
            'text-xs text-text-muted tabular-nums',
            valueClassName,
            tempModifierValueClass(tempDelta),
          )}
          aria-label={ariaLabel}
        >
          {displayText}
        </span>
        {canTemp && (
          <TempModifierToggle
            isActive={tempActive}
            hasModifiers={tempDelta !== 0}
            onClick={() => setTempActive((prev) => !prev)}
            title={tempActive ? `Close ${titleLabel} Temp Modifier` : `${titleLabel} Temp Modifier`}
          />
        )}
      </div>
      {showTempControls && onTempDeltaChange && (
        <TempModifierStepperRow
          label={titleLabel}
          tempDelta={tempDelta}
          onTempDeltaChange={onTempDeltaChange}
          deltaFormat="signed"
        />
      )}
    </div>
  );
}
