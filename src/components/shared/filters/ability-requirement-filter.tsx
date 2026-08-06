/**
 * AbilityRequirementFilter Component
 * ===================================
 * Filter for ability requirements with ability select + max value input.
 * Matches vanilla site's ability requirement filter.
 */

'use client';

import { useState, useId } from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Chip, IconButton, Input } from '@/components/ui';

export interface AbilityRequirement {
  ability: string;
  maxValue: number;
}

interface AbilityRequirementFilterProps {
  label?: string;
  abilities: string[];
  requirements: AbilityRequirement[];
  onAdd: (req: AbilityRequirement) => void;
  onRemove: (ability: string) => void;
  className?: string;
  /** When set, controls are disabled and placeholders use this hint. */
  disabled?: boolean;
  disabledHint?: string;
}

export function AbilityRequirementFilter({
  label = 'Ability Requirement',
  abilities,
  requirements,
  onAdd,
  onRemove,
  className = '',
  disabled = false,
  disabledHint,
}: AbilityRequirementFilterProps) {
  const abilitySelectId = useId();
  const [selectedAbility, setSelectedAbility] = useState('');
  const [maxValue, setMaxValue] = useState('');

  const availableAbilities = abilities.filter(
    a => !requirements.some(r => r.ability === a)
  );

  const handleAdd = () => {
    if (selectedAbility && maxValue) {
      onAdd({ ability: selectedAbility, maxValue: parseInt(maxValue) });
      setSelectedAbility('');
      setMaxValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className={cn('filter-group', disabled && 'opacity-60', className)}>
      <label htmlFor={abilitySelectId} className="block text-sm font-medium text-text-secondary mb-1">
        {label}
      </label>
      <div className="flex gap-2">
        <select
          id={abilitySelectId}
          value={selectedAbility}
          onChange={(e) => setSelectedAbility(e.target.value)}
          disabled={disabled}
          aria-disabled={disabled}
          className="flex-1 px-3 py-2 border border-border-light rounded-md bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-outline-border focus:border-primary-outline-border disabled:cursor-not-allowed disabled:bg-surface-alt"
        >
          <option value="">{disabled && disabledHint ? disabledHint : 'Choose ability'}</option>
          {availableAbilities.map(ability => (
            <option key={ability} value={ability}>
              {ability}
            </option>
          ))}
        </select>
        <div className="w-20 shrink-0">
          <Input
            type="number"
            value={maxValue}
            onChange={(e) => setMaxValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={disabled && disabledHint ? disabledHint : 'Max'}
            min={0}
            disabled={disabled}
            className="w-full"
          />
        </div>
        <IconButton
          variant="primary"
          label="Add requirement"
          onClick={handleAdd}
          disabled={disabled || !selectedAbility || !maxValue}
        >
          <Plus className="w-4 h-4" />
        </IconButton>
      </div>
      {requirements.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {requirements.map(req => (
            <Chip
              key={req.ability}
              variant="warning"
              size="sm"
              onRemove={() => onRemove(req.ability)}
            >
              {req.ability} ≤ {req.maxValue}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
