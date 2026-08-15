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
import { PoweredMartialSlider } from '@/components/shared';
import { ARCHETYPE_CATEGORY_INFO } from '@/lib/constants/copy';

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

/** Selector-only icons; titles/descriptions come from ARCHETYPE_CATEGORY_INFO. */
const ARCHETYPE_ICONS: Record<ArchetypeType, string> = {
  martial: '⚔️',
  power: '✨',
  'powered-martial': '⚡',
};

export function ArchetypeSelector({
  value,
  powerProficiency,
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
      <div className={cn('grid gap-3', compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3')}>
        {(['martial', 'power', 'powered-martial'] as ArchetypeType[]).map((type) => {
          const info = ARCHETYPE_CATEGORY_INFO[type];
          const isSelected = value === type;

          return (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              disabled={disabled}
              className={cn(
                'rounded-xl border-2 p-4 text-left transition-all',
                isSelected
                  ? 'border-primary-outline-border bg-primary-subtle-bg shadow-md'
                  : 'border-border-light bg-surface hover:border-border hover:shadow',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">
                  {ARCHETYPE_ICONS[type]}
                </span>
                <h4 className="font-bold text-primary-fg">{info.title}</h4>
              </div>
              {!compact && (
                <p className="text-secondary text-xs dark:text-text-secondary">
                  {info.description}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Powered-Martial Slider */}
      {value === 'powered-martial' && (
        <PoweredMartialSlider
          powerValue={sliderValue}
          martialValue={maxProficiency - sliderValue}
          maxPoints={maxProficiency}
          onChange={(power) => handleSliderChange(power)}
          disabled={disabled}
        />
      )}

      {/* Non-slider display for Martial/Power */}
      {value !== 'powered-martial' && (
        <div className="rounded-xl border border-border-light bg-surface-secondary p-4">
          <div className="flex items-center justify-between">
            <span className="text-secondary text-sm dark:text-text-secondary">
              {value === 'martial' ? 'Martial Proficiency' : 'Power Proficiency'}
            </span>
            <span
              className={cn(
                'text-xl font-bold',
                value === 'martial' ? 'text-martial-fg' : 'text-power-fg',
              )}
            >
              +{maxProficiency}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
