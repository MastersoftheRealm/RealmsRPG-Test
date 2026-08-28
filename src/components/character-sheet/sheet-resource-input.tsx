'use client';

import { useState, useRef, KeyboardEvent, ChangeEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ValueStepper } from '@/components/patterns';

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
 */
export function ResourceInput({
  label,
  current,
  max,
  onChange,
  colorVariant = 'default',
  subLabel,
  headerRight,
  showBar = false,
  min = 0,
}: {
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
}) {
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
    setIsEditing(false);
    // Reset to current value if not committed
    setInputValue(String(current));
  };

  const applyValue = () => {
    if (!onChange) return;

    const trimmed = inputValue.trim();

    if (trimmed.startsWith('+')) {
      const delta = parseInt(trimmed.slice(1), 10);
      if (!isNaN(delta)) {
        const newValue = Math.max(min, current + delta);
        onChange(newValue);
        setInputValue(String(newValue));
      }
    } else if (/^-?\d+$/.test(trimmed)) {
      const newValue = parseInt(trimmed, 10);
      if (!isNaN(newValue)) {
        const value = Math.max(min, newValue);
        onChange(value);
        setInputValue(String(value));
      }
    }

    setIsEditing(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyValue();
    } else if (e.key === 'Escape') {
      setInputValue(String(current));
      setIsEditing(false);
      inputRef.current?.blur();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Stepper: apply +/- one step to current, or to a typed draft value if the field is focused
  const handleStepperChange = (newValue: number) => {
    if (!onChange) return;

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

  // Color classes: light = tinted panel; dark = same surface as UI, subtle colored border (no bright green/blue background)
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

  // Calculate bar percentage - cap at 100% for display but allow tracking above max
  const isAboveMax = current > max;
  const percentage = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;

  // Bar color: gold when above max, otherwise normal colors; dark mode alternatives
  // Half health = amber/yellow-orange (distinguishable from terminal red)
  // Terminal = deep crimson red
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

  const inputBorderText =
    colorVariant === 'health'
      ? 'border-success-300 dark:border-success-700/60 text-success-fg'
      : colorVariant === 'energy'
        ? 'border-info-300 dark:border-info-700/60 text-info-fg'
        : 'border-border-light dark:border-border text-text-primary';

  return (
    <div className={cn('flex flex-col rounded-lg border p-3', bgColor)}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={cn('text-xs font-semibold tracking-wide uppercase', labelColor)}>
          {label}
        </span>
        {headerRight ??
          (subLabel ? <span className="text-xs text-text-muted">{subLabel}</span> : null)}
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'touch-tier-standard w-12 rounded border bg-surface px-1 py-0.5 text-center text-lg font-bold dark:bg-surface-alt',
            'focus:ring-2 focus:ring-primary-outline-border focus:outline-none dark:focus:ring-primary-outline-border',
            inputBorderText,
          )}
          aria-label={`Current ${label}`}
        />
        <span className={cn('text-base font-medium', labelColor)}>/ {max}</span>
        {onChange && (
          <ValueStepper
            value={current}
            onChange={handleStepperChange}
            min={min}
            // No max - allow incrementing above max (gold bar shows when above)
            colorVariant={
              colorVariant === 'health'
                ? 'health'
                : colorVariant === 'energy'
                  ? 'energy'
                  : 'default'
            }
            enableHoldRepeat
            size="sm"
            variant="compact"
            hideValue
            decrementTitle={`Decrease ${label.toLowerCase()}`}
            incrementTitle={`Increase ${label.toLowerCase()}`}
          />
        )}
      </div>
      {/* Inline bar - dark mode track */}
      {showBar && (
        <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-surface dark:bg-text-primary/30">
          <div
            className={cn(
              'duration-slow absolute inset-y-0 left-0 rounded-full transition-all ease-standard',
              barColorClass,
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
