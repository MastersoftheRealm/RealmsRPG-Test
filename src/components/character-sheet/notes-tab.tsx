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
import { X, Pencil } from 'lucide-react';
import { Button, IconButton, Textarea } from '@/components/ui';
import { useRollsOptional } from '@/components/rolls';
import {
  TabSummarySection,
  SummaryItem,
  SummaryRow,
  LibraryCollapsibleSection,
} from '@/components/patterns';
import { formatSpeedString, type SpeedDisplayUnit } from '@/lib/utils/number';
import type { Abilities } from '@/types';
import type { CharacterVisibility } from '@/types';

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
  namedNotes?: CharacterNote[] | undefined;
  abilities: Abilities;
  isEditMode?: boolean | undefined;
  /** Character visibility: who can view this sheet (private, campaign members, or public) */
  visibility?: CharacterVisibility | undefined;
  onVisibilityChange?: ((value: CharacterVisibility) => void) | undefined;
  /** How to display speed (spaces, feet, or meters) for Jump/Climb/Swim */
  speedDisplayUnit?: SpeedDisplayUnit | undefined;
  onWeightChange?: ((value: number) => void) | undefined;
  onHeightChange?: ((value: number) => void) | undefined;
  onAppearanceChange?: ((value: string) => void) | undefined;
  onArchetypeDescChange?: ((value: string) => void) | undefined;
  onNotesChange?: ((value: string) => void) | undefined;
  // New: handlers for named notes
  onAddNote?: (() => void) | undefined;
  onUpdateNote?: ((id: string, updates: Partial<CharacterNote>) => void) | undefined;
  onDeleteNote?: ((id: string) => void) | undefined;
}

// Collapsible note component with editable name
function NoteCard({
  note,
  onUpdate,
  onDelete,
  isEditMode,
}: {
  note: CharacterNote;
  onUpdate?: ((updates: Partial<CharacterNote>) => void) | undefined;
  onDelete?: (() => void) | undefined;
  isEditMode?: boolean | undefined;
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
    <div className="overflow-hidden rounded-lg border border-border-light">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center gap-2 bg-surface-alt px-3 py-2"
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
            className="flex-1 rounded border border-primary-subtle-border px-2 py-0.5 text-sm font-medium focus:ring-2 focus:ring-primary-outline-border"
            autoFocus
          />
        ) : (
          <span
            className="flex-1 cursor-pointer text-sm font-medium text-text-primary hover:text-primary-fg-hover"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingName(true);
            }}
            title="Click to rename"
          >
            {note.name}
            <Pencil className="ml-1 inline h-3 w-3 text-text-muted" />
          </span>
        )}

        {isEditMode && onDelete && (
          <IconButton variant="danger" size="sm" onClick={onDelete} label="Delete note">
            <X className="h-4 w-4" />
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
  speedDisplayUnit = 'spaces',
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
  const speedUnit = speedDisplayUnit;

  // Local state for editing
  const [weightInput, setWeightInput] = useState(weight.toString());
  const [heightInput, setHeightInput] = useState(height.toString());

  // Get abilities for movement calculations
  const strength = abilities.strength || 0;
  const agility = abilities.agility || 0;
  const vitality = abilities.vitality || 0;

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
      rollContext.rollDamage(fallDice, 0, 'Fall Damage');
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
    <div className="space-y-2">
      {/* Character visibility is in Character settings (gear icon in toolbar). */}

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
                    className="w-16 rounded border border-border-light bg-surface px-2 py-0.5 text-sm focus:ring-2 focus:ring-primary-outline-border"
                    aria-label="Weight in kg"
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
                    className="w-16 rounded border border-border-light bg-surface px-2 py-0.5 text-sm focus:ring-2 focus:ring-primary-outline-border"
                    aria-label="Height in cm"
                  />
                  <span className="text-sm text-text-muted">cm</span>
                </div>
              ) : (
                <span className="text-sm font-bold text-text-primary">{height} cm</span>
              )}
            </div>
          </SummaryRow>

          <SummaryRow className="text-xs">
            <SummaryItem label="Jump (H)" value={formatSpeedString(jumpHorizontal, speedUnit)} />
            <SummaryItem label="Jump (V)" value={formatSpeedString(jumpVertical, speedUnit)} />
            <SummaryItem label="Climb" value={formatSpeedString(climbSpeed, speedUnit)} />
            <SummaryItem label="Swim" value={formatSpeedString(swimSpeed, speedUnit)} />
          </SummaryRow>

          {/* Fall Damage */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-secondary">Fall Damage:</span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRollFallDamage}
              disabled={!rollContext || rollContext.canRoll === false}
              title={
                rollContext?.canRoll === false
                  ? "Can't roll for another user's character"
                  : rollContext
                    ? 'Click to roll'
                    : 'Roll log not available'
              }
            >
              {fallDice}
            </Button>
            <span className="text-text-muted">
              bludgeoning per 2 spaces fallen ({weightCategory}kg category)
            </span>
          </div>
        </div>
      </TabSummarySection>

      <LibraryCollapsibleSection title="Appearance" itemCount={appearance.trim() ? 1 : 0}>
        <Textarea
          value={appearance}
          onChange={(e) => onAppearanceChange?.(e.target.value)}
          placeholder="Describe your character's appearance..."
          className="min-h-[80px]"
        />
      </LibraryCollapsibleSection>

      <LibraryCollapsibleSection
        title="Archetype Description"
        itemCount={archetypeDesc.trim() ? 1 : 0}
      >
        <Textarea
          value={archetypeDesc}
          onChange={(e) => onArchetypeDescChange?.(e.target.value)}
          placeholder="Describe your character's archetype background..."
          className="min-h-[80px]"
        />
      </LibraryCollapsibleSection>

      <LibraryCollapsibleSection title="General Notes" itemCount={notes.trim() ? 1 : 0}>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange?.(e.target.value)}
          placeholder="Additional notes, backstory, goals..."
          className="min-h-[120px]"
        />
      </LibraryCollapsibleSection>

      <LibraryCollapsibleSection
        title="Custom Notes"
        itemCount={namedNotes.length}
        onAdd={onAddNote}
        addLabel="Add new note"
      >
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
          <p className="py-4 text-center text-sm text-text-muted italic">
            No custom notes yet. Click + to add one.
          </p>
        )}
      </LibraryCollapsibleSection>
    </div>
  );
}
