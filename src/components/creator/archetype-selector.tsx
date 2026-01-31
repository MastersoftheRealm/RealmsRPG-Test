/**
 * Archetype Selector
 * ==================
 * Shared component for selecting archetype type (Martial/Power/Powered-Martial)
 * with a slider for Powered-Martial allocation.
 * Used in creature creator and character creator.
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export type ArchetypeType = 'martial' | 'power' | 'powered-martial';

export interface ArchetypeSelectorProps {
  /** Currently selected archetype type */
  value: ArchetypeType;
  /** Power proficiency value (for powered-martial) */
  powerProficiency: number;
  /** Martial proficiency value (for powered-martial) */
  martialProficiency: number;
  /** Maximum proficiency points available */
  maxProficiency: number;
  /** Callback when archetype type changes */
  onTypeChange: (type: ArchetypeType) => void;
  /** Callback when proficiency allocation changes */
  onProficiencyChange: (power: number, martial: number) => void;
  /** Whether the component is in compact mode */
  compact?: boolean;
  /** Whether selection is disabled/locked */
  disabled?: boolean;
}

const ARCHETYPE_INFO: Record<ArchetypeType, { title: string; description: string; icon: string }> = {
  martial: {
    title: 'Martial',
    description: 'Focus on physical combat, techniques, and weaponry. All proficiency goes to martial prowess.',
    icon: '⚔️',
  },
  power: {
    title: 'Power',
    description: 'Focus on supernatural abilities and powers. All proficiency goes to power mastery.',
    icon: '✨',
  },
  'powered-martial': {
    title: 'Powered-Martial',
    description: 'Balanced blend of martial prowess and supernatural abilities. Allocate proficiency between both.',
    icon: '⚡',
  },
};

export function ArchetypeSelector({
  value,
  powerProficiency,
  martialProficiency,
  maxProficiency,
  onTypeChange,
  onProficiencyChange,
  compact = false,
  disabled = false,
}: ArchetypeSelectorProps) {
  const [sliderValue, setSliderValue] = useState(powerProficiency);

  const handleTypeChange = (type: ArchetypeType) => {
    if (disabled) return;
    onTypeChange(type);
    
    // Auto-set proficiency based on type
    if (type === 'martial') {
      onProficiencyChange(0, maxProficiency);
    } else if (type === 'power') {
      onProficiencyChange(maxProficiency, 0);
    } else {
      // Powered-martial: split evenly or keep current slider
      const power = Math.floor(maxProficiency / 2);
      onProficiencyChange(power, maxProficiency - power);
      setSliderValue(power);
    }
  };

  const handleSliderChange = (powerValue: number) => {
    setSliderValue(powerValue);
    onProficiencyChange(powerValue, maxProficiency - powerValue);
  };

  return (
    <div className="space-y-4">
      {/* Archetype Type Selection */}
      <div className={cn(
        'grid gap-3',
        compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'
      )}>
        {(['martial', 'power', 'powered-martial'] as ArchetypeType[]).map((type) => {
          const info = ARCHETYPE_INFO[type];
          const isSelected = value === type;

          return (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              disabled={disabled}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all',
                isSelected
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-border-light bg-surface hover:border-border hover:shadow',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{info.icon}</span>
                <h4 className="font-bold text-primary">{info.title}</h4>
              </div>
              {!compact && (
                <p className="text-xs text-secondary">{info.description}</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Powered-Martial Slider */}
      {value === 'powered-martial' && (
        <div className="p-4 rounded-xl bg-surface-secondary border border-border-light">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-secondary">Proficiency Allocation</span>
            <span className="text-sm text-tertiary">
              Total: {maxProficiency} points
            </span>
          </div>

          {/* Slider Labels */}
          <div className="flex justify-between mb-2">
            <div className="text-center">
              <span className="text-xs text-tertiary block">Power</span>
              <span className="text-lg font-bold text-violet-500">{sliderValue}</span>
            </div>
            <div className="text-center">
              <span className="text-xs text-tertiary block">Martial</span>
              <span className="text-lg font-bold text-red-600">{maxProficiency - sliderValue}</span>
            </div>
          </div>

          {/* Custom Slider */}
          <div className="relative py-2">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-red-500" />
            <input
              type="range"
              min={0}
              max={maxProficiency}
              value={sliderValue}
              onChange={(e) => handleSliderChange(parseInt(e.target.value))}
              disabled={disabled}
              className={cn(
                'relative w-full h-6 appearance-none bg-transparent cursor-pointer',
                'range-slider',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={{
                // Custom thumb styling via CSS variables
                WebkitAppearance: 'none',
              }}
            />
          </div>

          {/* Tick marks */}
          <div className="flex justify-between px-1 mt-1">
            {Array.from({ length: maxProficiency + 1 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-1 h-1 rounded-full',
                  i === sliderValue ? 'bg-primary-600' : 'bg-border-light'
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Non-slider display for Martial/Power */}
      {value !== 'powered-martial' && (
        <div className="p-4 rounded-xl bg-surface-secondary border border-border-light">
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary">
              {value === 'martial' ? 'Martial Proficiency' : 'Power Proficiency'}
            </span>
            <span className={cn(
              'text-xl font-bold',
              value === 'martial' ? 'text-red-600' : 'text-violet-500'
            )}>
              +{maxProficiency}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
