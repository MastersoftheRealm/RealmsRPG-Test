'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';
import {
  DecrementButton,
  IncrementButton,
  SectionDualModeToggles,
  TempModifierToggle,
  type SectionEditMode,
} from '@/components/shared';
import { tempModifierValueClass } from '@/lib/character/temp-modifiers';

/**
 * Large stat block for Speed / Evasion / DR / Critical Range.
 * Pencil = rules base (Speed/Evasion only); Temp Modifier = layered delta (ADR-0006).
 * `value` is the final display number/string (temps already applied by caller).
 */
export function LargeStatBlock({
  label,
  value,
  valueSuffix,
  valueAriaLabel,
  baseValue,
  isEditMode,
  onBaseChange,
  tempDelta = 0,
  onTempDeltaChange,
  minBase = 0,
  maxBase = 20,
}: {
  label: string;
  value: number | string;
  valueSuffix?: string;
  /** Optional accessible name for the value (e.g. read-only DR / Critical Range). */
  valueAriaLabel?: string;
  baseValue?: number;
  isEditMode?: boolean;
  onBaseChange?: (newBase: number) => void;
  tempDelta?: number;
  onTempDeltaChange?: (delta: number) => void;
  minBase?: number;
  maxBase?: number;
}) {
  const [mode, setMode] = useState<SectionEditMode>('none');
  const [tempOnlyActive, setTempOnlyActive] = useState(false);
  const canSpend = Boolean(isEditMode && onBaseChange && baseValue !== undefined);
  const canTemp = Boolean(isEditMode && onTempDeltaChange);
  const showSpendControls = canSpend && mode === 'spend';
  const showTempControls =
    canTemp && (canSpend ? mode === 'tempModifier' : tempOnlyActive);

  return (
    <Card className="flex flex-col items-center p-4 bg-surface-alt min-w-[100px] shadow-none">
      <div className="flex items-center gap-1.5 w-full justify-center">
        <span className="text-sm font-semibold text-text-secondary uppercase tracking-wide text-center">
          {label}
        </span>
        {canSpend && canTemp && (
          <SectionDualModeToggles
            mode={mode}
            onModeChange={setMode}
            spendState="normal"
            hasTempModifiers={tempDelta !== 0}
            spendTitle={`Edit ${label} base`}
          />
        )}
        {!canSpend && canTemp && (
          <TempModifierToggle
            isActive={tempOnlyActive}
            hasModifiers={tempDelta !== 0}
            onClick={() => setTempOnlyActive((prev) => !prev)}
            title={tempOnlyActive ? 'Close Temp Modifier' : 'Temp Modifier'}
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

      {showSpendControls && baseValue !== undefined && onBaseChange && (
        <div className="flex items-center gap-1 mt-2">
          <DecrementButton
            size="sm"
            onClick={() => onBaseChange(Math.max(minBase, baseValue - 1))}
            disabled={baseValue <= minBase}
            title={`Decrease ${label} base`}
          />
          <span className="text-xs min-w-[3rem] text-center text-text-muted dark:text-text-secondary">
            Base: {baseValue}
          </span>
          <IncrementButton
            size="sm"
            onClick={() => onBaseChange(Math.min(maxBase, baseValue + 1))}
            disabled={baseValue >= maxBase}
            title={`Increase ${label} base`}
          />
        </div>
      )}

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
