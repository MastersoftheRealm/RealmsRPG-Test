'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { CONDITION_OPTIONS } from './encounter-constants';
import type { Combatant } from '@/types/encounter';

export interface CombatantCardConditionChipsProps {
  combatant: Combatant;
  onRemoveCondition: (condition: string) => void;
  onUpdateConditionLevel: (condition: string, delta: number) => void;
}

export function CombatantCardConditionChips({
  combatant,
  onRemoveCondition,
  onUpdateConditionLevel,
}: CombatantCardConditionChipsProps) {
  if (combatant.conditions.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap gap-1">
      {combatant.conditions.map((cond) => {
        const condDef = CONDITION_OPTIONS.find((c) => c.name === cond.name);
        const isLeveled = condDef?.leveled ?? cond.level > 0;
        const isCustom = !condDef;
        return (
          <div
            key={cond.name}
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs select-none',
              isCustom
                ? 'bg-info-light text-info-fg'
                : isLeveled
                  ? 'bg-companion-light text-companion-text'
                  : 'bg-warning-light text-warning-fg',
            )}
            title={
              condDef?.description ??
              'Custom condition (leveled). Left-click to increase, right-click to decrease level.'
            }
            onContextMenu={(e) => {
              e.preventDefault();
              if (isLeveled) {
                onUpdateConditionLevel(cond.name, -1);
              } else {
                onRemoveCondition(cond.name);
              }
            }}
          >
            <span
              onClick={() => isLeveled && onUpdateConditionLevel(cond.name, 1)}
              className={cn(isLeveled && 'cursor-pointer hover:underline')}
            >
              {cond.name}
              {isLeveled && ` (${cond.level})`}
            </span>
            <button
              onClick={() =>
                isLeveled ? onUpdateConditionLevel(cond.name, -1) : onRemoveCondition(cond.name)
              }
              className="hit-area-dense-square inline-flex items-center justify-center font-bold hover:text-danger-fg"
              title={isLeveled ? 'Decrease level (removes at 0)' : 'Remove condition'}
              aria-label={
                isLeveled ? `Decrease ${cond.name} level` : `Remove ${cond.name} condition`
              }
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

export interface CombatantCardConditionsPanelProps {
  combatant: Combatant;
  onAddCondition: (condition: string) => void;
}

export function CombatantCardConditionsPanel({
  combatant,
  onAddCondition,
}: CombatantCardConditionsPanelProps) {
  const [selectedCondition, setSelectedCondition] = useState('');
  const [customCondition, setCustomCondition] = useState('');

  const handleAddCondition = () => {
    if (selectedCondition) {
      onAddCondition(selectedCondition);
      setSelectedCondition('');
    }
  };

  const handleAddCustomCondition = () => {
    const name = customCondition.trim();
    if (name && !combatant.conditions.some((c) => c.name === name)) {
      onAddCondition(name);
      setCustomCondition('');
    }
  };

  return (
    <div className="mt-3 border-t border-border-subtle pt-3">
      <div className="mb-2 flex items-center gap-2">
        <select
          value={selectedCondition}
          onChange={(e) => setSelectedCondition(e.target.value)}
          className="touch-tier-standard flex-1 rounded border border-border-light px-3 py-1 text-sm"
          aria-label="Select condition to add"
        >
          <option value="">Select Condition...</option>
          {CONDITION_OPTIONS.map((cond) => (
            <option
              key={cond.name}
              value={cond.name}
              disabled={combatant.conditions.some((c) => c.name === cond.name)}
            >
              {cond.name}
              {cond.leveled ? ' ⬇' : ''}
            </option>
          ))}
        </select>
        <Button
          variant="primary"
          size="sm"
          className="bg-warning-600 hover:bg-warning-700"
          onClick={handleAddCondition}
          disabled={!selectedCondition}
        >
          Add
        </Button>
      </div>
      <div className="mb-2 flex items-center gap-2">
        <input
          type="text"
          value={customCondition}
          onChange={(e) => setCustomCondition(e.target.value)}
          placeholder="Custom condition..."
          aria-label="Custom condition name"
          className="touch-tier-standard flex-1 rounded border border-border-light px-3 py-1 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCondition()}
          maxLength={30}
        />
        <Button
          variant="primary"
          size="sm"
          className="hover:bg-companion-dark bg-companion"
          onClick={handleAddCustomCondition}
          disabled={!customCondition.trim()}
        >
          Add Custom
        </Button>
      </div>
      <p className="text-xs text-text-muted">
        Left-click to increase level, right-click or × to decrease/remove. Custom conditions are
        leveled.
      </p>
    </div>
  );
}
