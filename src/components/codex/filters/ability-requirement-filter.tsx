/**
 * AbilityRequirementFilter Component
 * ===================================
 * Filter for ability requirements with ability select + max value input.
 * Matches vanilla site's ability requirement filter.
 */

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Chip, IconButton } from '@/components/ui';

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
}

export function AbilityRequirementFilter({
  label = 'Ability Requirement',
  abilities,
  requirements,
  onAdd,
  onRemove,
  className = '',
}: AbilityRequirementFilterProps) {
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
    <div className={`filter-group ${className}`}>
      <label className="block text-sm font-medium text-text-secondary mb-1">
        {label}
      </label>
      <div className="flex gap-2">
        <select
          value={selectedAbility}
          onChange={(e) => setSelectedAbility(e.target.value)}
          className="flex-1 px-3 py-2 border border-neutral-300 rounded-md bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Choose ability</option>
          {availableAbilities.map(ability => (
            <option key={ability} value={ability}>
              {ability}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={maxValue}
          onChange={(e) => setMaxValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Max"
          min="0"
          className="w-20 px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <IconButton
          variant="primary"
          label="Add requirement"
          onClick={handleAdd}
          disabled={!selectedAbility || !maxValue}
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
