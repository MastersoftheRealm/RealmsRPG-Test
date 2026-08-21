'use client';

/**
 * EncounterPageHeader — shared back link, editable title, type line, and save status
 * for combat, skill, and mixed encounter routes.
 */

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronLeft, Cloud, CloudOff } from 'lucide-react';
import { PageHeader } from '@/components/ui';

export type EncounterTypeLabel = 'Combat' | 'Skill' | 'Mixed';

export interface EncounterPageHeaderProps {
  encounterType: EncounterTypeLabel;
  name: string;
  description?: string | undefined;
  isEditingName: boolean;
  nameInput: string;
  onNameInputChange: (value: string) => void;
  onStartEditingName: () => void;
  onCommitName: () => void;
  onCancelEdit: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  actions?: ReactNode | undefined;
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
  actions,
}: EncounterPageHeaderProps) {
  const typeLine = `${encounterType} Encounter${description ? ` \u2014 ${description}` : ''}`;

  return (
    <div className="mb-6">
      <Link
        href="/encounters"
        className="mb-2 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary-fg-hover"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
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
            actions={actions}
          />
        )}
        {!isEditingName && (
          <p className="mt-1 flex items-center gap-1 text-xs">
            {isSaving ? (
              <span className="flex items-center gap-1 text-warning-fg">
                <CloudOff className="h-3 w-3" aria-hidden />
                Saving...
              </span>
            ) : hasUnsavedChanges ? (
              <span className="flex items-center gap-1 text-warning-fg">
                <CloudOff className="h-3 w-3" aria-hidden />
                Unsaved changes
              </span>
            ) : (
              <span className="flex items-center gap-1 text-success-fg">
                <Cloud className="h-3 w-3" aria-hidden />
                Saved to cloud
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
