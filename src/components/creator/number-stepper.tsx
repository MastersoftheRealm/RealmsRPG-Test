/**
 * NumberStepper Component
 * =======================
 * A reusable number input with increment/decrement buttons.
 * Used across all creator tools for adjusting levels, quantities, etc.
 */

'use client';

import { cn } from '@/lib/utils';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label,
  size = 'md',
  disabled = false,
  className,
}: NumberStepperProps) {
  const handleDecrement = () => {
    if (!disabled && value > min) {
      onChange(Math.max(min, value - step));
    }
  };

  const handleIncrement = () => {
    if (!disabled && value < max) {
      onChange(Math.min(max, value + step));
    }
  };

  const sizeClasses = {
    sm: {
      button: 'w-6 h-6 text-sm',
      display: 'w-6 text-sm',
      label: 'text-xs',
    },
    md: {
      button: 'w-7 h-7 text-base',
      display: 'w-8 text-base',
      label: 'text-sm',
    },
    lg: {
      button: 'w-9 h-9 text-lg',
      display: 'w-10 text-lg',
      label: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && (
        <span className={cn('text-gray-600 font-medium', sizes.label)}>
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className={cn(
          'btn-stepper btn-stepper-danger',
          sizes.button
        )}
        aria-label="Decrease"
      >
        −
      </button>
      <span className={cn('text-center font-semibold', sizes.display)}>
        {value}
      </span>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className={cn(
          'btn-stepper btn-stepper-success',
          sizes.button
        )}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
