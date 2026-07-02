'use client';

/**
 * EncounterPageHeader — shared back link, editable title, type line, and save status
 * for combat, skill, and mixed encounter routes.
 */

import Link from 'next/link';
import { ChevronLeft, Cloud, CloudOff } from 'lucide-react';
import { PageHeader } from '@/components/ui';

export type EncounterTypeLabel = 'Combat' | 'Skill' | 'Mixed';

export interface EncounterPageHeaderProps {
  encounterType: EncounterTypeLabel;
  name: string;
  description?: string;
  isEditingName: boolean;
  nameInput: string;
  onNameInputChange: (value: string) => void;
  onStartEditingName: () => void;
  onCommitName: () => void;
  onCancelEdit: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

const TITLE_INPUT_CLASS =
  'text-3xl font-bold text-text-primary bg-transparent border-b-2 border-primary-outline-border outline-none w-full max-w-md';

export function EncounterPageHeader({
  encounterType,
  name,
  description,
  isEditingName,
  nameInput,
  onNameInputChange,
  onStartEditingName,
  onCommitName,
  onCancelEdit,
  isSaving,
  hasUnsavedChanges,
}: EncounterPageHeaderProps) {
  const typeLine = `${encounterType} Encounter${description ? ` \u2014 ${description}` : ''}`;

  return (
    <div className="mb-6">
      <Link
        href="/encounters"
        className="inline-flex items-center gap-1 text-text-secondary hover:text-primary-fg-hover mb-2 text-sm"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden />
        Back to Encounters
      </Link>
      <div className="min-w-0 flex-1">
        {isEditingName ? (
          <input
            type="text"
            value={nameInput}
            onChange={(e) => onNameInputChange(e.target.value)}
            onBlur={onCommitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCommitName();
              else if (e.key === 'Escape') onCancelEdit();
            }}
            className={TITLE_INPUT_CLASS}
            aria-label="Encounter name"
            autoFocus
          />
        ) : (
          <PageHeader
            title={name}
            description={typeLine}
            className="mb-0"
            onTitleClick={onStartEditingName}
            titleAriaLabel="Encounter name. Click to edit."
          />
        )}
        {!isEditingName && (
          <p className="text-xs mt-1 flex items-center gap-1">
            {isSaving ? (
              <span className="text-warning-fg flex items-center gap-1">
                <CloudOff className="w-3 h-3" aria-hidden />
                Saving...
              </span>
            ) : hasUnsavedChanges ? (
              <span className="text-warning-fg flex items-center gap-1">
                <CloudOff className="w-3 h-3" aria-hidden />
                Unsaved changes
              </span>
            ) : (
              <span className="text-success-fg flex items-center gap-1">
                <Cloud className="w-3 h-3" aria-hidden />
                Saved to cloud
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
