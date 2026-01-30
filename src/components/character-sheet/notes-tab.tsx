/**
 * Notes Tab
 * =========
 * Physical attributes, movement calculations, and character notes
 * Matches vanilla site's notes functionality
 */

'use client';

import { useState, useCallback } from 'react';
import { useRollsOptional } from './roll-context';
import type { Abilities } from '@/types';

interface NotesTabProps {
  weight: number;
  height: number;
  appearance: string;
  archetypeDesc: string;
  notes: string;
  abilities: Abilities;
  isEditMode?: boolean;
  onWeightChange?: (value: number) => void;
  onHeightChange?: (value: number) => void;
  onAppearanceChange?: (value: string) => void;
  onArchetypeDescChange?: (value: string) => void;
  onNotesChange?: (value: string) => void;
}

export function NotesTab({
  weight = 70,
  height = 170,
  appearance = '',
  archetypeDesc = '',
  notes = '',
  abilities,
  isEditMode = false,
  onWeightChange,
  onHeightChange,
  onAppearanceChange,
  onArchetypeDescChange,
  onNotesChange,
}: NotesTabProps) {
  const rollContext = useRollsOptional();
  
  // Local state for editing
  const [weightInput, setWeightInput] = useState(weight.toString());
  const [heightInput, setHeightInput] = useState(height.toString());

  // Get abilities for movement calculations
  const strength = abilities.strength || 0;
  const agility = abilities.agility || 0;
  const vitality = abilities.vitality || 0;

  // Helpers
  const pluralize = (n: number, s: string, p: string) => (n === 1 ? `${n} ${s}` : `${n} ${p}`);
  const upMin1 = (v: number) => Math.max(1, Math.ceil(v));

  // Calculate movement values (round up, minimum 1)
  const jumpHorizontal = upMin1(Math.max(strength, agility));
  const jumpVertical = upMin1(Math.max(strength, agility) / 2);
  const climbSpeed = upMin1(strength / 2);
  const swimSpeed = upMin1(Math.max(strength, vitality) / 2);

  // Calculate fall damage
  const weightCategory = Math.max(200, Math.ceil(weight / 200) * 200);
  const fallDiceCount = Math.min(Math.ceil(weight / 200) || 1, 4); // 1..4
  const fallDice = `${fallDiceCount}d4`;

  const handleRollFallDamage = useCallback(() => {
    if (rollContext) {
      rollContext.rollDamage(fallDice);
    }
  }, [rollContext, fallDice]);

  const handleWeightBlur = () => {
    const value = parseInt(weightInput) || 70;
    if (value !== weight && onWeightChange) {
      onWeightChange(value);
    }
  };

  const handleHeightBlur = () => {
    const value = parseInt(heightInput) || 170;
    if (value !== height && onHeightChange) {
      onHeightChange(value);
    }
  };

  return (
    <div className="space-y-4">
      {/* Physical Attributes & Movement */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
          Physical Attributes & Movement
        </h3>
        <div className="bg-surface-alt border border-border-light rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Weight */}
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-text-secondary">Weight</span>
              {isEditMode && onWeightChange ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    onBlur={handleWeightBlur}
                    className="w-20 px-2 py-1 text-sm border border-border-light rounded focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-sm text-text-muted">kg</span>
                </div>
              ) : (
                <span className="text-sm text-text-secondary">{weight} kg</span>
              )}
            </div>

            {/* Height */}
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-text-secondary">Height</span>
              {isEditMode && onHeightChange ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={heightInput}
                    onChange={(e) => setHeightInput(e.target.value)}
                    onBlur={handleHeightBlur}
                    className="w-20 px-2 py-1 text-sm border border-border-light rounded focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-sm text-text-muted">cm</span>
                </div>
              ) : (
                <span className="text-sm text-text-secondary">{height} cm</span>
              )}
            </div>

            {/* Jump - Horizontal */}
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-text-secondary">Jump - Horizontal</span>
              <span className="text-sm text-text-secondary">{pluralize(jumpHorizontal, 'space', 'spaces')}</span>
            </div>

            {/* Jump - Vertical */}
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-text-secondary">Jump - Vertical</span>
              <span className="text-sm text-text-secondary">{pluralize(jumpVertical, 'space', 'spaces')}</span>
            </div>

            {/* Climb Speed */}
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-text-secondary">Climb Speed</span>
              <div className="flex flex-col">
                <span className="text-sm text-text-secondary">{pluralize(climbSpeed, 'space', 'spaces')}</span>
                <span className="text-xs text-text-muted">Requires successful Athletics roll</span>
              </div>
            </div>

            {/* Swim Speed */}
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-text-secondary">Swim Speed</span>
              <div className="flex flex-col">
                <span className="text-sm text-text-secondary">{pluralize(swimSpeed, 'space', 'spaces')}</span>
                <span className="text-xs text-text-muted">DC 10 Acrobatics or Athletics (Vitality)</span>
              </div>
            </div>

            {/* Fall Damage */}
            <div className="flex flex-col gap-1 col-span-2 md:col-span-3">
              <span className="text-sm font-semibold text-text-secondary">Fall Damage</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRollFallDamage}
                  disabled={!rollContext}
                  className="px-2 py-1 text-sm font-bold bg-gradient-to-b from-neutral-50 to-indigo-50 border border-indigo-200 rounded-lg hover:shadow-sm transition-all disabled:opacity-50"
                  title={rollContext ? 'Click to roll' : 'Roll log not available'}
                >
                  {fallDice}
                </button>
                <span className="text-sm text-text-secondary">
                  bludgeoning per 2 spaces fallen ({weightCategory}kg weight category)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
          Appearance
        </h3>
        <textarea
          value={appearance}
          onChange={(e) => onAppearanceChange?.(e.target.value)}
          readOnly={!isEditMode}
          placeholder="Describe your character's appearance..."
          className="w-full min-h-[80px] px-3 py-2 text-sm border border-border-light rounded-lg focus:ring-2 focus:ring-primary-500 resize-y disabled:bg-surface-alt"
          disabled={!isEditMode}
        />
      </div>

      {/* Archetype Description */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
          Archetype Description
        </h3>
        <textarea
          value={archetypeDesc}
          onChange={(e) => onArchetypeDescChange?.(e.target.value)}
          readOnly={!isEditMode}
          placeholder="Describe your character's archetype background..."
          className="w-full min-h-[80px] px-3 py-2 text-sm border border-border-light rounded-lg focus:ring-2 focus:ring-primary-500 resize-y disabled:bg-surface-alt"
          disabled={!isEditMode}
        />
      </div>

      {/* Notes */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
          Notes
        </h3>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange?.(e.target.value)}
          readOnly={!isEditMode}
          placeholder="Additional notes, backstory, goals..."
          className="w-full min-h-[120px] px-3 py-2 text-sm border border-border-light rounded-lg focus:ring-2 focus:ring-primary-500 resize-y disabled:bg-surface-alt"
          disabled={!isEditMode}
        />
      </div>
    </div>
  );
}
