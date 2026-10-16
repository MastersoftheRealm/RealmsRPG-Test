/**
 * Notes Tab
 * =========
 * Physical attributes, movement calculations, and character notes
 * Features:
 * - Appearance, backstory, and general notes are editable for the owner
 * - Support for multiple named notes with add/delete functionality
 * - Weight, height, and age require edit mode for modification
 *
 * Uses unified components: SectionHeader, TabSummarySection
 */

'use client';

import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { CHARACTER_AGE_MAX_LENGTH, clampCharacterAgeInput } from '@/lib/character/appearance-age';
import { useModalUnmountClickGuard } from '@/lib/modal-unmount-click-guard';
import { X, Pencil } from 'lucide-react';
import { Button, IconButton, Textarea } from '@/components/ui';
import { useRollsOptional } from '@/components/rolls';
import {
  TabSummarySection,
  SummaryItem,
  SummaryRow,
  LibraryCollapsibleSection,
  DeleteConfirmModal,
  SectionHeader,
} from '@/components/patterns';
import { formatSpeedString, type SpeedDisplayUnit } from '@/lib/utils/number';
import {
  NOTES_TAB_SECTION_DEFS,
  isNotesSectionVisible,
  moveInOrder,
  namedNoteHideBlocked,
  notesSectionHideBlocked,
  resolveNotesSectionOrder,
  resolveNotesSectionVisibility,
  type NotesTabSectionId,
} from '@/lib/character/notes-tab-sections';
import type { Abilities, CharacterVisibility } from '@/types';
import { NotesTabEditControls } from './notes-tab-edit-controls';

export interface CharacterNote {
  id: string;
  name: string;
  content: string;
  hidden?: boolean | undefined;
}

interface NotesTabProps {
  weight: number;
  height: number;
  age?: string | undefined;
  appearance: string;
  backstory?: string | undefined;
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
  onAgeChange?: ((value: string) => void) | undefined;
  onAppearanceChange?: ((value: string) => void) | undefined;
  onBackstoryChange?: ((value: string) => void) | undefined;
  onArchetypeDescChange?: ((value: string) => void) | undefined;
  onNotesChange?: ((value: string) => void) | undefined;
  // New: handlers for named notes
  onAddNote?: (() => void) | undefined;
  onUpdateNote?: ((id: string, updates: Partial<CharacterNote>) => void) | undefined;
  onDeleteNote?: ((id: string) => void) | undefined;
  notesSectionOrder?: NotesTabSectionId[] | undefined;
  notesSectionVisibility?: Partial<Record<NotesTabSectionId, boolean>> | undefined;
  onNotesSectionOrderChange?: ((next: NotesTabSectionId[]) => void) | undefined;
  onNotesSectionVisibilityChange?:
    | ((next: Partial<Record<NotesTabSectionId, boolean>>) => void)
    | undefined;
  onReorderNamedNote?: ((id: string, direction: 'up' | 'down') => void) | undefined;
}

/** Appearance, backstory, and notes. A viewer (no onChange) sees the text, not a field. */
export function SheetNoteField({
  value,
  onChange,
  placeholder,
  label,
  className,
}: {
  value: string;
  onChange?: ((value: string) => void) | undefined;
  placeholder: string;
  label: string;
  className?: string | undefined;
}) {
  if (!onChange) {
    return (
      <p className="text-sm whitespace-pre-wrap text-text-primary" aria-label={label}>
        {value.trim() ? value : <span className="text-text-muted">{placeholder}</span>}
      </p>
    );
  }
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={label}
      className={className}
    />
  );
}

function ReadOnlyNoteCard({ note }: { note: CharacterNote }) {
  const [isExpanded, setIsExpanded] = useState(true);
  return (
    <div className="overflow-hidden rounded-lg border border-border-light">
      <button
        type="button"
        className="flex w-full items-center gap-2 bg-surface-alt px-3 py-2 text-left"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span
          className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary"
          title={note.name}
        >
          {note.name}
        </span>
      </button>
      {isExpanded ? (
        <div className="p-3">
          <SheetNoteField
            value={note.content}
            placeholder="Write your note here..."
            label={note.name}
          />
        </div>
      ) : null}
    </div>
  );
}

function EditableNoteCard({
  note,
  onUpdate,
  onDelete,
  isEditMode,
  sectionEditControls,
}: {
  note: CharacterNote;
  onUpdate: (updates: Partial<CharacterNote>) => void;
  onDelete?: (() => void) | undefined;
  isEditMode?: boolean | undefined;
  sectionEditControls?: ReactNode | undefined;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(note.name);

  const handleNameSubmit = () => {
    if (nameInput.trim() && nameInput !== note.name) {
      onUpdate({ name: nameInput.trim() });
    }
    setIsEditingName(false);
  };

  return (
    <div
      className={`overflow-hidden rounded-lg border border-border-light${note.hidden && isEditMode ? 'opacity-60' : ''}`}
    >
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
            className="min-w-0 flex-1 rounded border border-primary-subtle-border px-2 py-0.5 text-sm font-medium focus:ring-2 focus:ring-primary-outline-border"
            autoFocus
          />
        ) : (
          <div className="flex min-w-0 flex-1 items-center">
            <span
              className="flex max-w-full min-w-0 cursor-pointer items-center gap-1 text-sm font-medium text-text-primary hover:text-primary-fg-hover"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
              }}
              title={note.name}
            >
              <span className="truncate">{note.name}</span>
              <Pencil className="h-3 w-3 shrink-0 text-text-muted" />
            </span>
          </div>
        )}

        {sectionEditControls ? <span className="shrink-0">{sectionEditControls}</span> : null}

        {isEditMode && onDelete && (
          <span className="shrink-0">
            <IconButton
              variant="danger"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              label="Delete note"
            >
              <X className="h-4 w-4" />
            </IconButton>
          </span>
        )}
      </div>

      {isExpanded && (
        <div className="p-3">
          <SheetNoteField
            value={note.content}
            onChange={(content) => onUpdate({ content })}
            placeholder="Write your note here..."
            label={note.name}
            className="min-h-[80px]"
          />
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note,
  onUpdate,
  onDelete,
  isEditMode,
  sectionEditControls,
}: {
  note: CharacterNote;
  onUpdate?: ((updates: Partial<CharacterNote>) => void) | undefined;
  onDelete?: (() => void) | undefined;
  isEditMode?: boolean | undefined;
  sectionEditControls?: ReactNode | undefined;
}) {
  if (!onUpdate) {
    return <ReadOnlyNoteCard note={note} />;
  }
  return (
    <EditableNoteCard
      note={note}
      onUpdate={onUpdate}
      onDelete={onDelete}
      isEditMode={isEditMode}
      sectionEditControls={sectionEditControls}
    />
  );
}

export function NotesTab({
  weight = 70,
  height = 170,
  age = '',
  appearance = '',
  backstory = '',
  archetypeDesc = '',
  notes = '',
  namedNotes = [],
  abilities,
  isEditMode = false,
  speedDisplayUnit = 'spaces',
  onWeightChange,
  onHeightChange,
  onAgeChange,
  onAppearanceChange,
  onBackstoryChange,
  onArchetypeDescChange,
  onNotesChange,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  notesSectionOrder,
  notesSectionVisibility,
  onNotesSectionOrderChange,
  onNotesSectionVisibilityChange,
  onReorderNamedNote,
}: NotesTabProps) {
  const rollContext = useRollsOptional();
  const speedUnit = speedDisplayUnit;

  // Local state for editing
  const [weightInput, setWeightInput] = useState(weight.toString());
  const [heightInput, setHeightInput] = useState(height.toString());
  const [ageInput, setAgeInput] = useState(age);
  const [notePendingDelete, setNotePendingDelete] = useState<CharacterNote | null>(null);
  useModalUnmountClickGuard(notePendingDelete != null);

  const confirmDeleteNote = useCallback(() => {
    if (notePendingDelete) onDeleteNote?.(notePendingDelete.id);
    setNotePendingDelete(null);
  }, [notePendingDelete, onDeleteNote]);

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

  const handleAgeBlur = () => {
    const trimmed = clampCharacterAgeInput(ageInput.trim());
    setAgeInput(trimmed);
    if (trimmed !== age && onAgeChange) {
      onAgeChange(trimmed);
    }
  };

  const resolvedSectionOrder = useMemo(
    () => resolveNotesSectionOrder(notesSectionOrder),
    [notesSectionOrder],
  );
  const resolvedSectionVisibility = useMemo(
    () => resolveNotesSectionVisibility(notesSectionVisibility),
    [notesSectionVisibility],
  );
  const canLayoutEdit =
    isEditMode && Boolean(onNotesSectionOrderChange && onNotesSectionVisibilityChange);

  const sectionTitle = useCallback(
    (sectionId: NotesTabSectionId) =>
      NOTES_TAB_SECTION_DEFS.find((section) => section.id === sectionId)?.title ?? sectionId,
    [],
  );

  const sectionEditControls = useCallback(
    (sectionId: NotesTabSectionId) => {
      if (!canLayoutEdit) return undefined;
      const orderIndex = resolvedSectionOrder.indexOf(sectionId);
      const visibleOutsideEdit = resolvedSectionVisibility[sectionId] !== false;
      return (
        <NotesTabEditControls
          title={sectionTitle(sectionId)}
          visibleOutsideEdit={visibleOutsideEdit}
          hideBlocked={notesSectionHideBlocked(resolvedSectionVisibility, sectionId)}
          canMoveUp={orderIndex > 0}
          canMoveDown={orderIndex >= 0 && orderIndex < resolvedSectionOrder.length - 1}
          onMoveUp={() =>
            onNotesSectionOrderChange?.(moveInOrder(resolvedSectionOrder, sectionId, 'up'))
          }
          onMoveDown={() =>
            onNotesSectionOrderChange?.(moveInOrder(resolvedSectionOrder, sectionId, 'down'))
          }
          onToggleVisibility={() => {
            if (notesSectionHideBlocked(resolvedSectionVisibility, sectionId)) return;
            onNotesSectionVisibilityChange?.({
              ...resolvedSectionVisibility,
              [sectionId]: !visibleOutsideEdit,
            });
          }}
        />
      );
    },
    [
      canLayoutEdit,
      resolvedSectionOrder,
      resolvedSectionVisibility,
      sectionTitle,
      onNotesSectionOrderChange,
      onNotesSectionVisibilityChange,
    ],
  );

  const visibleNamedNotes = useMemo(() => {
    if (isEditMode) return namedNotes;
    return namedNotes.filter((note) => !note.hidden);
  }, [isEditMode, namedNotes]);

  const namedNoteEditControls = useCallback(
    (note: CharacterNote, index: number) => {
      if (!isEditMode || !onUpdateNote) return undefined;
      const visibleOutsideEdit = !note.hidden;
      return (
        <NotesTabEditControls
          title={note.name}
          visibleOutsideEdit={visibleOutsideEdit}
          hideBlocked={namedNoteHideBlocked(namedNotes, note.id)}
          canMoveUp={Boolean(onReorderNamedNote) && index > 0}
          canMoveDown={Boolean(onReorderNamedNote) && index < namedNotes.length - 1}
          onMoveUp={onReorderNamedNote ? () => onReorderNamedNote(note.id, 'up') : undefined}
          onMoveDown={onReorderNamedNote ? () => onReorderNamedNote(note.id, 'down') : undefined}
          onToggleVisibility={() => {
            if (namedNoteHideBlocked(namedNotes, note.id)) return;
            onUpdateNote(note.id, { hidden: visibleOutsideEdit });
          }}
        />
      );
    },
    [isEditMode, namedNotes, onReorderNamedNote, onUpdateNote],
  );

  const sectionWrapperClass = (sectionId: NotesTabSectionId) =>
    isEditMode && resolvedSectionVisibility[sectionId] === false ? 'opacity-60' : undefined;

  const physicalSection = (
    <div className={sectionWrapperClass('physical')}>
      {canLayoutEdit ? (
        <SectionHeader
          title={sectionTitle('physical')}
          size="lg"
          rightContent={sectionEditControls('physical')}
        />
      ) : null}
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

            {/* Age */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-secondary">Age:</span>
              {isEditMode && onAgeChange ? (
                <input
                  type="text"
                  value={ageInput}
                  maxLength={CHARACTER_AGE_MAX_LENGTH}
                  onChange={(e) => setAgeInput(clampCharacterAgeInput(e.target.value))}
                  onBlur={handleAgeBlur}
                  placeholder="—"
                  className="max-w-[14rem] min-w-[5rem] flex-1 rounded border border-border-light bg-surface px-2 py-0.5 text-sm focus:ring-2 focus:ring-primary-outline-border"
                  aria-label="Character age"
                />
              ) : age ? (
                <span className="text-sm font-bold text-text-primary">{age}</span>
              ) : (
                <span className="text-sm text-text-muted">—</span>
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
              data-roll-trigger=""
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
    </div>
  );

  const appearanceSection = (
    <LibraryCollapsibleSection
      title={sectionTitle('appearance')}
      itemCount={appearance.trim() ? 1 : 0}
      rightContent={sectionEditControls('appearance')}
      className={sectionWrapperClass('appearance')}
    >
      <SheetNoteField
        value={appearance}
        onChange={onAppearanceChange}
        placeholder="Describe your character's appearance..."
        label="Appearance"
        className="min-h-[80px]"
      />
    </LibraryCollapsibleSection>
  );

  const backstorySection = (
    <LibraryCollapsibleSection
      title={sectionTitle('backstory')}
      itemCount={backstory.trim() ? 1 : 0}
      rightContent={sectionEditControls('backstory')}
      className={sectionWrapperClass('backstory')}
    >
      <SheetNoteField
        value={backstory}
        onChange={onBackstoryChange}
        placeholder="Background, personality, bonds, and history..."
        label="Backstory"
        className="min-h-[80px]"
      />
    </LibraryCollapsibleSection>
  );

  const archetypeSection = (
    <LibraryCollapsibleSection
      title={sectionTitle('archetypeDesc')}
      itemCount={archetypeDesc.trim() ? 1 : 0}
      rightContent={sectionEditControls('archetypeDesc')}
      className={sectionWrapperClass('archetypeDesc')}
    >
      <SheetNoteField
        value={archetypeDesc}
        onChange={onArchetypeDescChange}
        placeholder="Describe your character's archetype background..."
        label="Archetype Description"
        className="min-h-[80px]"
      />
    </LibraryCollapsibleSection>
  );

  const generalNotesSection = (
    <LibraryCollapsibleSection
      title={sectionTitle('generalNotes')}
      itemCount={notes.trim() ? 1 : 0}
      rightContent={sectionEditControls('generalNotes')}
      className={sectionWrapperClass('generalNotes')}
    >
      <SheetNoteField
        value={notes}
        onChange={onNotesChange}
        placeholder="Additional notes, goals, and reminders..."
        label="General Notes"
        className="min-h-[120px]"
      />
    </LibraryCollapsibleSection>
  );

  const customNotesSection = (
    <LibraryCollapsibleSection
      title={sectionTitle('customNotes')}
      itemCount={visibleNamedNotes.length}
      onAdd={onAddNote}
      addLabel="Add new note"
      rightContent={sectionEditControls('customNotes')}
      className={sectionWrapperClass('customNotes')}
    >
      {namedNotes.length > 0 ? (
        <div className="space-y-3">
          {(isEditMode ? namedNotes : visibleNamedNotes).map((note, index) => (
            <NoteCard
              key={note.id}
              note={note}
              onUpdate={onUpdateNote ? (updates) => onUpdateNote(note.id, updates) : undefined}
              onDelete={onDeleteNote ? () => setNotePendingDelete(note) : undefined}
              isEditMode={isEditMode}
              sectionEditControls={namedNoteEditControls(note, index)}
            />
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-text-muted italic">
          {onAddNote ? 'No custom notes yet. Click + to add one.' : 'No custom notes yet.'}
        </p>
      )}
    </LibraryCollapsibleSection>
  );

  const sectionById: Record<NotesTabSectionId, ReactNode> = {
    physical: physicalSection,
    appearance: appearanceSection,
    backstory: backstorySection,
    archetypeDesc: archetypeSection,
    generalNotes: generalNotesSection,
    customNotes: customNotesSection,
  };

  return (
    <div className="space-y-2">
      {resolvedSectionOrder.map((sectionId) => {
        if (
          !isNotesSectionVisible(sectionId, {
            isEditMode,
            visibility: notesSectionVisibility,
          })
        ) {
          return null;
        }
        return <div key={sectionId}>{sectionById[sectionId]}</div>;
      })}

      {notePendingDelete ? (
        <DeleteConfirmModal
          isOpen
          itemName={notePendingDelete.name}
          itemType="note"
          deleteContext="character"
          onConfirm={confirmDeleteNote}
          onClose={() => setNotePendingDelete(null)}
        />
      ) : null}
    </div>
  );
}
