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
  variant?: 'primary' | 'power' | 'technique' | 'item';
  disabled?: boolean;
  className?: string;
}

const variantClasses = {
  primary: 'bg-primary-600 hover:bg-primary-700 disabled:hover:bg-primary-600',
  power: 'bg-primary-600 hover:bg-primary-700 disabled:hover:bg-primary-600',
  technique: 'bg-red-600 hover:bg-red-700 disabled:hover:bg-red-600',
  item: 'bg-amber-600 hover:bg-amber-700 disabled:hover:bg-amber-600',
};

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label,
  size = 'md',
  variant = 'primary',
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
          'rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-200',
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
          'rounded text-white flex items-center justify-center font-bold transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizes.button
        )}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
