'use client';

import { useState, useRef, KeyboardEvent, ChangeEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ValueStepper } from '@/components/patterns';
import { resourceCurrentValueClass } from '@/lib/character/resource-value-color';
import { sheetFieldDismissReturnsFocus } from './sheet-field-focus';

/**
 * Get health color based on current health percentage
 * - Green: > 50% health
 * - Orange: <= 50% but > 25% (half health, rounded up)
 * - Red: <= 25% (terminal range, rounded up)
 */
export function getHealthColor(current: number, max: number): 'green' | 'orange' | 'red' {
  if (max <= 0) return 'red';
  const halfThreshold = Math.ceil(max / 2);
  const terminalThreshold = Math.ceil(max / 4);

  if (current <= terminalThreshold) return 'red';
  if (current <= halfThreshold) return 'orange';
  return 'green';
}

/**
 * Smart Resource Input
 * - Click value to select all for easy editing
 * - Type a number (including negative for Health) and press Enter to set that value
 * - Type +N and press Enter to add N to the current value
 * - Use stepper buttons with typed value (if not pressed Enter yet)
 * - No onChange (a viewer): the number is text. Typing cannot change it.
 */
export type ResourceInputProps = {
  label: string;
  current: number;
  max: number;
  onChange?: ((value: number) => void) | undefined;
  colorVariant?: 'health' | 'energy' | 'default' | undefined;
  subLabel?: string | undefined;
  /** Top-right slot (e.g. Terminal threshold on Health). Takes precedence over subLabel. */
  headerRight?: ReactNode | undefined;
  showBar?: boolean | undefined;
  /** Lower bound for current value (default 0). Health may use `-Infinity` for Dying negative HP. */
  min?: number | undefined;
};

export function ResourceInput(props: ResourceInputProps) {
  if (!props.onChange) {
    return resourceReadout(props);
  }
  return <ResourceInputEditor {...props} onChange={props.onChange} />;
}

function resourceChrome(
  colorVariant: 'health' | 'energy' | 'default',
  current: number,
  max: number,
) {
  const bgColor =
    colorVariant === 'health'
      ? 'bg-success-50 dark:bg-surface border-success-200 dark:border-success-800/50'
      : colorVariant === 'energy'
        ? 'bg-info-50 dark:bg-surface border-info-200 dark:border-info-800/50'
        : 'bg-surface-alt dark:bg-surface border-border-light dark:border-border';

  const labelColor =
    colorVariant === 'health'
      ? 'text-success-fg'
      : colorVariant === 'energy'
        ? 'text-info-fg'
        : 'text-text-secondary dark:text-text-primary';

  const inputBorderText =
    colorVariant === 'health'
      ? 'border-success-300 dark:border-success-700/60 text-success-fg'
      : colorVariant === 'energy'
        ? 'border-info-300 dark:border-info-700/60 text-info-fg'
        : 'border-border-light dark:border-border text-text-primary';

  const isAboveMax = current > max;
  const valueClass =
    colorVariant === 'health' || colorVariant === 'energy'
      ? resourceCurrentValueClass(colorVariant, current, max)
      : null;
  const percentage = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const barColorClass = isAboveMax
    ? 'bg-warning-400 dark:bg-warning-500'
    : colorVariant === 'health'
      ? percentage > 50
        ? 'bg-success-500 dark:bg-success-400'
        : percentage > 25
          ? 'bg-warning-500 dark:bg-warning-400'
          : 'bg-danger-600 dark:bg-danger-500'
      : colorVariant === 'energy'
        ? 'bg-info-500 dark:bg-info-400'
        : 'bg-primary-button';

  return { bgColor, labelColor, inputBorderText, valueClass, percentage, barColorClass };
}

function ResourceBar({ percentage, barColorClass }: { percentage: number; barColorClass: string }) {
  return (
    <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-surface dark:bg-text-primary/30">
      <div
        className={cn(
          'duration-slow absolute inset-y-0 left-0 rounded-full transition-all ease-standard',
          barColorClass,
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function resourceReadout({
  label,
  current,
  max,
  colorVariant = 'default',
  subLabel,
  headerRight,
  showBar = false,
}: ResourceInputProps) {
  const chrome = resourceChrome(colorVariant, current, max);
  return (
    <div className={cn('flex flex-col rounded-lg border p-3', chrome.bgColor)}>
      <div className="mb-1 flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span
          className={cn(
            'shrink-0 text-xs font-semibold tracking-wide uppercase',
            chrome.labelColor,
          )}
        >
          {label}
        </span>
        {headerRight ??
          (subLabel ? (
            <span className="min-w-0 truncate text-xs text-text-muted">{subLabel}</span>
          ) : null)}
      </div>
      <div className="flex min-w-0 flex-nowrap items-center gap-2">
        <span
          className={cn(
            'inline-block min-w-[3ch] shrink-0 text-center text-lg font-bold tabular-nums',
            chrome.inputBorderText,
            chrome.valueClass,
          )}
          aria-label={`Current ${label}`}
        >
          {current}
        </span>
        <span
          className={cn(
            'shrink-0 text-base font-medium whitespace-nowrap tabular-nums',
            chrome.labelColor,
          )}
        >
          / {max}
        </span>
      </div>
      {showBar ? (
        <ResourceBar percentage={chrome.percentage} barColorClass={chrome.barColorClass} />
      ) : null}
    </div>
  );
}

function ResourceInputEditor({
  label,
  current,
  max,
  onChange,
  colorVariant = 'default',
  subLabel,
  headerRight,
  showBar = false,
  min = 0,
}: ResourceInputProps & { onChange: (value: number) => void }) {
  const [inputValue, setInputValue] = useState(String(current));
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const displayValue = isEditing ? inputValue : String(current);

  const handleFocus = () => {
    setIsEditing(true);
    setInputValue(String(current));
    // Select all text when focused
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleBlur = () => {
    if (isEditing) {
      applyValue();
      return;
    }
    setInputValue(String(current));
  };

  const applyValue = () => {
    if (!onChange) return;

    const trimmed = inputValue.trim();
    let committed = current;

    if (trimmed.startsWith('+')) {
      const delta = parseInt(trimmed.slice(1), 10);
      if (!isNaN(delta)) {
        committed = Math.max(min, current + delta);
      }
    } else if (/^-?\d+$/.test(trimmed)) {
      const newValue = parseInt(trimmed, 10);
      if (!isNaN(newValue)) {
        committed = Math.max(min, newValue);
      }
    }

    if (committed !== current) {
      onChange(committed);
    }
    setInputValue(String(committed));
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!sheetFieldDismissReturnsFocus(e.key)) return;
    e.preventDefault();
    if (e.key === 'Enter') {
      applyValue();
      return;
    }
    setInputValue(String(current));
    setIsEditing(false);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Stepper: apply +/- one step to current, or to a typed draft value if the field is focused
  const handleStepperChange = (newValue: number) => {
    const stepperDelta = newValue - current;
    let result = newValue;

    if (isEditing) {
      const trimmed = inputValue.trim();
      if (trimmed.startsWith('+') || trimmed.startsWith('-')) {
        result = newValue;
      } else {
        const parsed = parseInt(trimmed, 10);
        if (!isNaN(parsed)) {
          result = Math.max(min, parsed + stepperDelta);
        }
      }
    }

    onChange(result);
    setInputValue(String(result));
    setIsEditing(false);
  };

  const chrome = resourceChrome(colorVariant, current, max);
  const valueCh = Math.max(3, displayValue.replace(/^-/, '').length);

  return (
    <div className={cn('flex flex-col rounded-lg border p-3', chrome.bgColor)}>
      <div className="mb-1 flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span
          className={cn(
            'shrink-0 text-xs font-semibold tracking-wide uppercase',
            chrome.labelColor,
          )}
        >
          {label}
        </span>
        {headerRight ??
          (subLabel ? (
            <span className="min-w-0 truncate text-xs text-text-muted">{subLabel}</span>
          ) : null)}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          size={valueCh}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'touch-tier-standard max-w-[8ch] min-w-[3ch] rounded border bg-surface px-1 py-0.5 text-center text-lg font-bold tabular-nums dark:bg-surface-alt',
            'focus:ring-2 focus:ring-primary-outline-border focus:outline-none dark:focus:ring-primary-outline-border',
            chrome.inputBorderText,
            chrome.valueClass,
          )}
          aria-label={`Current ${label}`}
        />
        <span
          className={cn(
            'shrink-0 text-base font-medium whitespace-nowrap tabular-nums',
            chrome.labelColor,
          )}
        >
          / {max}
        </span>
        <ValueStepper
          value={current}
          onChange={handleStepperChange}
          min={min}
          // No max - allow incrementing above max (gold bar shows when above)
          colorVariant={
            colorVariant === 'health' ? 'health' : colorVariant === 'energy' ? 'energy' : 'default'
          }
          enableHoldRepeat
          size="sm"
          variant="compact"
          hideValue
          decrementTitle={`Decrease ${label.toLowerCase()}`}
          incrementTitle={`Increase ${label.toLowerCase()}`}
        />
      </div>
      {showBar ? (
        <ResourceBar percentage={chrome.percentage} barColorClass={chrome.barColorClass} />
      ) : null}
    </div>
  );
}
