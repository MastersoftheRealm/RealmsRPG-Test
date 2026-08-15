'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { DecrementButton, IncrementButton, TempModifierToggle } from '@/components/shared';
import { tempModifierTintFromDelta, tempModifierValueClass } from '@/lib/character/temp-modifiers';

/** Local open/close for a header Temp control. Resets when sheet Temp mode ends. */
export function useTempModifierActive(
  isTempModifierMode?: boolean,
  onTempDeltaChange?: (delta: number) => void,
) {
  const [tempActive, setTempActive] = useState(false);
  const canTemp = Boolean(isTempModifierMode && onTempDeltaChange);
  if (!canTemp && tempActive) {
    setTempActive(false);
  }
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
  isTempModifierMode,
  onTempDeltaChange,
  valueClassName,
}: {
  displayText: string;
  ariaLabel: string;
  /** Used in stepper button titles (e.g. "Terminal"). */
  titleLabel: string;
  tempDelta?: number;
  isTempModifierMode?: boolean;
  onTempDeltaChange?: (delta: number) => void;
  valueClassName?: string;
}) {
  const { tempActive, setTempActive, canTemp, showTempControls } = useTempModifierActive(
    isTempModifierMode,
    onTempDeltaChange,
  );
  const tint = tempModifierTintFromDelta(tempDelta);

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
            tint={tint}
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
