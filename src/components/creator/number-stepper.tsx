/**
 * NumberStepper Component
 * =======================
 * A reusable number input with increment/decrement buttons.
 * Used across all creator tools for adjusting levels, quantities, etc.
 * 
 * NOTE: This is an alias for ValueStepper from shared/.
 * Use ValueStepper directly for new code.
 */

'use client';

import { cn } from '@/lib/utils';
import { ValueStepper, type ValueStepperProps } from '@/components/shared';

// Re-export for backwards compatibility
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
  return (
    <ValueStepper
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      label={label}
      size={size}
      disabled={disabled}
      className={className}
    />
  );
}
