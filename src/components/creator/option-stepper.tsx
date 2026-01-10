/**
 * OptionStepper Component
 * =======================
 * A specialized stepper for part/property option levels.
 * Shows the option description alongside the stepper controls.
 */

'use client';

import { cn } from '@/lib/utils';
import { NumberStepper } from './number-stepper';

interface OptionStepperProps {
  label?: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  costPerLevel?: number;
  costLabel?: string;
  className?: string;
}

export function OptionStepper({
  label = 'Option',
  description,
  value,
  onChange,
  min = 0,
  max = 99,
  costPerLevel,
  costLabel = 'TP',
  className,
}: OptionStepperProps) {
  const totalCost = costPerLevel ? costPerLevel * value : null;

  return (
    <div className={cn('bg-gray-50 rounded-lg p-3', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {label}
          {costPerLevel !== undefined && (
            <span className="text-gray-500 font-normal ml-2">
              (+{costPerLevel} {costLabel}/level)
            </span>
          )}
        </span>
        <div className="flex items-center gap-3">
          {totalCost !== null && totalCost > 0 && (
            <span className="text-sm font-medium text-purple-600">
              +{totalCost} {costLabel}
            </span>
          )}
          <NumberStepper
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            size="sm"
          />
        </div>
      </div>
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
    </div>
  );
}
