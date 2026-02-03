/**
 * Notes Tab
 * =========
 * Physical attributes, movement calculations, and character notes
 * Features:
 * - All text fields are always editable (not just in edit mode)
 * - Support for multiple named notes with add/delete functionality
 * - Weight/height still require edit mode for modification
 */

'use client';

import { useState, useCallback } from 'react';
import { Plus, X, ChevronDown, ChevronRight, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from '@/components/ui';
import { useRollsOptional } from './roll-context';
import type { Abilities } from '@/types';

export interface CharacterNote {
  id: string;
  name: string;
  content: string;
}

interface NotesTabProps {
  weight: number;
  height: number;
  appearance: string;
  archetypeDesc: string;
  notes: string;
  // New: array of named notes
  namedNotes?: CharacterNote[];
  abilities: Abilities;
  isEditMode?: boolean;
  onWeightChange?: (value: number) => void;
  onHeightChange?: (value: number) => void;
  onAppearanceChange?: (value: string) => void;
  onArchetypeDescChange?: (value: string) => void;
  onNotesChange?: (value: string) => void;
  // New: handlers for named notes
  onAddNote?: () => void;
  onUpdateNote?: (id: string, updates: Partial<CharacterNote>) => void;
  onDeleteNote?: (id: string) => void;
}

// Collapsible note component with editable name
function NoteCard({
  note,
  onUpdate,
  onDelete,
  isEditMode,
}: {
  note: CharacterNote;
  onUpdate?: (updates: Partial<CharacterNote>) => void;
  onDelete?: () => void;
  isEditMode?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(note.name);

  const handleNameSubmit = () => {
    if (nameInput.trim() && nameInput !== note.name) {
      onUpdate?.({ name: nameInput.trim() });
    }
    setIsEditingName(false);
  };

  return (
    <div className="border border-border-light rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-alt">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        
        {isEditingName ? (
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSubmit();
              if (e.key === 'Escape') {
                setNameInput(note.name);
                setIsEditingName(false);
              }
            }}
            className="flex-1 px-2 py-0.5 text-sm font-medium border border-primary-300 rounded focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
        ) : (
          <span
            className="flex-1 text-sm font-medium text-text-primary cursor-pointer hover:text-primary-600"
            onClick={() => setIsEditingName(true)}
            title="Click to rename"
          >
            {note.name}
            <Edit2 className="w-3 h-3 inline ml-1 text-text-muted" />
          </span>
        )}
        
        {isEditMode && onDelete && (
          <IconButton
            variant="danger"
            size="sm"
            onClick={onDelete}
            label="Delete note"
          >
            <X className="w-4 h-4" />
          </IconButton>
        )}
      </div>
      
      {/* Content - always editable */}
      {isExpanded && (
        <div className="p-3">
          <textarea
            value={note.content}
            onChange={(e) => onUpdate?.({ content: e.target.value })}
            placeholder="Write your note here..."
            className="w-full min-h-[80px] px-3 py-2 text-sm border border-border-light rounded-lg focus:ring-2 focus:ring-primary-500 resize-y bg-surface"
          />
        </div>
      )}
    </div>
  );
}

export function NotesTab({
  weight = 70,
  height = 170,
  appearance = '',
  archetypeDesc = '',
  notes = '',
  namedNotes = [],
  abilities,
  isEditMode = false,
  onWeightChange,
  onHeightChange,
  onAppearanceChange,
  onArchetypeDescChange,
  onNotesChange,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
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

      {/* Appearance - always editable */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
          Appearance
        </h3>
        <textarea
          value={appearance}
          onChange={(e) => onAppearanceChange?.(e.target.value)}
          placeholder="Describe your character's appearance..."
          className="w-full min-h-[80px] px-3 py-2 text-sm border border-border-light rounded-lg focus:ring-2 focus:ring-primary-500 resize-y bg-surface"
        />
      </div>

      {/* Archetype Description - always editable */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
          Archetype Description
        </h3>
        <textarea
          value={archetypeDesc}
          onChange={(e) => onArchetypeDescChange?.(e.target.value)}
          placeholder="Describe your character's archetype background..."
          className="w-full min-h-[80px] px-3 py-2 text-sm border border-border-light rounded-lg focus:ring-2 focus:ring-primary-500 resize-y bg-surface"
        />
      </div>

      {/* General Notes - always editable */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
          General Notes
        </h3>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange?.(e.target.value)}
          placeholder="Additional notes, backstory, goals..."
          className="w-full min-h-[120px] px-3 py-2 text-sm border border-border-light rounded-lg focus:ring-2 focus:ring-primary-500 resize-y bg-surface"
        />
      </div>

      {/* Named Notes Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide">
            Custom Notes
          </h3>
          {onAddNote && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={onAddNote}
              label="Add new note"
            >
              <Plus className="w-4 h-4" />
            </IconButton>
          )}
        </div>
        
        {namedNotes.length > 0 ? (
          <div className="space-y-3">
            {namedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onUpdate={onUpdateNote ? (updates) => onUpdateNote(note.id, updates) : undefined}
                onDelete={onDeleteNote ? () => onDeleteNote(note.id) : undefined}
                isEditMode={isEditMode}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted italic py-4 text-center">
            No custom notes yet. Click + to add one.
          </p>
        )}
      </div>
    </div>
  );
}
