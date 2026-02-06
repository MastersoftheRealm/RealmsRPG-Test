/**
 * Notes Tab
 * =========
 * Physical attributes, movement calculations, and character notes
 * Features:
 * - All text fields are always editable (not just in edit mode)
 * - Support for multiple named notes with add/delete functionality
 * - Weight/height still require edit mode for modification
 * 
 * Uses unified components: SectionHeader, TabSummarySection
 */

'use client';

import { useState, useCallback } from 'react';
import { Plus, X, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, IconButton, Textarea } from '@/components/ui';
import { useRollsOptional } from './roll-context';
import { SectionHeader, TabSummarySection, SummaryItem, SummaryRow } from '@/components/shared';
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
      <div 
        className="flex items-center gap-2 px-3 py-2 bg-surface-alt cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isEditingName ? (
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleNameSubmit}
            onClick={(e) => e.stopPropagation()}
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
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingName(true);
            }}
            title="Click to rename"
          >
            {note.name}
            <Pencil className="w-3 h-3 inline ml-1 text-text-muted" />
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
          <Textarea
            value={note.content}
            onChange={(e) => onUpdate?.({ content: e.target.value })}
            placeholder="Write your note here..."
            className="min-h-[80px]"
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
    const value = Math.max(1, parseInt(weightInput) || 1);
    setWeightInput(String(value));
    if (value !== weight && onWeightChange) {
      onWeightChange(value);
    }
  };

  const handleHeightBlur = () => {
    const value = Math.max(1, parseInt(heightInput) || 1);
    setHeightInput(String(value));
    if (value !== height && onHeightChange) {
      onHeightChange(value);
    }
  };

  return (
    <div className="space-y-4">
      {/* Physical Attributes Summary */}
      <TabSummarySection variant="physical">
        <div className="space-y-3">
          <SummaryRow>
            {/* Weight */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-secondary">Weight:</span>
              {isEditMode && onWeightChange ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    onBlur={handleWeightBlur}
                    className="w-16 px-2 py-0.5 text-sm border border-border-light rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-surface"
                  />
                  <span className="text-sm text-text-muted">kg</span>
                </div>
              ) : (
                <span className="text-sm font-bold text-text-primary">{weight} kg</span>
              )}
            </div>
            
            {/* Height */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-secondary">Height:</span>
              {isEditMode && onHeightChange ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    value={heightInput}
                    onChange={(e) => setHeightInput(e.target.value)}
                    onBlur={handleHeightBlur}
                    className="w-16 px-2 py-0.5 text-sm border border-border-light rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-surface"
                  />
                  <span className="text-sm text-text-muted">cm</span>
                </div>
              ) : (
                <span className="text-sm font-bold text-text-primary">{height} cm</span>
              )}
            </div>
          </SummaryRow>
          
          <SummaryRow className="text-xs">
            <SummaryItem label="Jump (H)" value={`${jumpHorizontal} sp`} />
            <SummaryItem label="Jump (V)" value={`${jumpVertical} sp`} />
            <SummaryItem label="Climb" value={`${climbSpeed} sp`} />
            <SummaryItem label="Swim" value={`${swimSpeed} sp`} />
          </SummaryRow>
          
          {/* Fall Damage */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-secondary">Fall Damage:</span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRollFallDamage}
              disabled={!rollContext}
              title={rollContext ? 'Click to roll' : 'Roll log not available'}
            >
              {fallDice}
            </Button>
            <span className="text-text-muted">
              bludgeoning per 2 spaces fallen ({weightCategory}kg category)
            </span>
          </div>
        </div>
      </TabSummarySection>

      {/* Appearance - always editable */}
      <div>
        <SectionHeader title="Appearance" />
        <Textarea
          value={appearance}
          onChange={(e) => onAppearanceChange?.(e.target.value)}
          placeholder="Describe your character's appearance..."
          className="min-h-[80px]"
        />
      </div>

      {/* Archetype Description - always editable */}
      <div>
        <SectionHeader title="Archetype Description" />
        <Textarea
          value={archetypeDesc}
          onChange={(e) => onArchetypeDescChange?.(e.target.value)}
          placeholder="Describe your character's archetype background..."
          className="min-h-[80px]"
        />
      </div>

      {/* General Notes - always editable */}
      <div>
        <SectionHeader title="General Notes" />
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange?.(e.target.value)}
          placeholder="Additional notes, backstory, goals..."
          className="min-h-[120px]"
        />
      </div>

      {/* Named Notes Section */}
      <div>
        <SectionHeader 
          title="Custom Notes" 
          onAdd={onAddNote}
          addLabel="Add new note"
        />
        
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
