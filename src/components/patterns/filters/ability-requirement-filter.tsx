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
import { Chip, IconButton } from '@/components/ui';
import { FilterInput, FilterNativeSelect } from './filter-native-select';
import { FILTER_LABEL_ROW_CLASS } from './filter-utils';

export interface AbilityRequirement {
  ability: string;
  maxValue: number;
}

interface AbilityRequirementFilterProps {
  label?: string | undefined;
  abilities: string[];
  requirements: AbilityRequirement[];
  onAdd: (req: AbilityRequirement) => void;
  onRemove: (ability: string) => void;
  className?: string | undefined;
  /** When set, controls are disabled and placeholders use this hint. */
  disabled?: boolean | undefined;
  disabledHint?: string | undefined;
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

  const availableAbilities = abilities.filter((a) => !requirements.some((r) => r.ability === a));

  const handleAdd = () => {
    if (selectedAbility && maxValue) {
      onAdd({ ability: selectedAbility, maxValue: parseInt(maxValue) });
      setSelectedAbility('');
      setMaxValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className={cn('filter-group', disabled && 'opacity-60', className)}>
      <div className={FILTER_LABEL_ROW_CLASS}>
        <label
          htmlFor={abilitySelectId}
          className="text-sm leading-5 font-medium text-text-secondary"
        >
          {label}
        </label>
      </div>
      <div className="flex items-center gap-2">
        <FilterNativeSelect
          id={abilitySelectId}
          value={selectedAbility}
          onChange={(e) => setSelectedAbility(e.target.value)}
          disabled={disabled}
          aria-disabled={disabled}
          wrapperClassName="min-w-0 flex-1"
        >
          <option value="">{disabled && disabledHint ? disabledHint : 'Choose ability'}</option>
          {availableAbilities.map((ability) => (
            <option key={ability} value={ability}>
              {ability}
            </option>
          ))}
        </FilterNativeSelect>
        <div className="w-20 shrink-0">
          <FilterInput
            type="number"
            value={maxValue}
            onChange={(e) => setMaxValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled && disabledHint ? disabledHint : 'Max'}
            min={0}
            disabled={disabled}
            aria-label={`${label} max value`}
          />
        </div>
        <IconButton
          variant="primary"
          label="Add requirement"
          onClick={handleAdd}
          disabled={disabled || !selectedAbility || !maxValue}
          className="h-11 w-11"
        >
          <Plus className="h-4 w-4" />
        </IconButton>
      </div>
      {requirements.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {requirements.map((req) => (
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
