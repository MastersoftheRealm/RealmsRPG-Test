/**
 * DamageConfig Component
 * ======================
 * Configures damage dice for powers, techniques, and weapons.
 * Supports multiple damage types and die sizes.
 */

'use client';

import { cn } from '@/lib/utils';
import { NumberStepper } from './number-stepper';

export interface DamageValue {
  amount: number;
  size: number;
  type: string;
}

interface DamageConfigProps {
  value: DamageValue;
  onChange: (value: DamageValue) => void;
  damageTypes?: string[];
  dieSizes?: number[];
  label?: string;
  showNone?: boolean;
  className?: string;
}

const DEFAULT_DIE_SIZES = [4, 6, 8, 10, 12];

const DEFAULT_DAMAGE_TYPES = [
  'slashing', 'piercing', 'bludgeoning', 'fire', 'cold',
  'lightning', 'acid', 'poison', 'necrotic', 'radiant', 'psychic',
];

export function DamageConfig({
  value,
  onChange,
  damageTypes = DEFAULT_DAMAGE_TYPES,
  dieSizes = DEFAULT_DIE_SIZES,
  label = 'Damage',
  showNone = true,
  className,
}: DamageConfigProps) {
  const allTypes = showNone ? ['none', ...damageTypes] : damageTypes;

  const formatDamageDisplay = () => {
    if (value.type === 'none' || value.amount < 1) return 'No damage';
    return `${value.amount}d${value.size} ${value.type}`;
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-semibold text-gray-900">
            {formatDamageDisplay()}
          </span>
        </div>
      )}
      
      <div className="flex flex-wrap items-center gap-4">
        {/* Number of dice */}
        <NumberStepper
          value={value.amount}
          onChange={(amount) => onChange({ ...value, amount })}
          min={1}
          max={10}
          label="Dice:"
        />
        
        {/* Die size */}
        <div className="flex items-center gap-1">
          <span className="font-bold text-lg">d</span>
          <select
            value={value.size}
            onChange={(e) => onChange({ ...value, size: parseInt(e.target.value) })}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            {dieSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        
        {/* Damage type */}
        <select
          value={value.type}
          onChange={(e) => onChange({ ...value, type: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        >
          {allTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
