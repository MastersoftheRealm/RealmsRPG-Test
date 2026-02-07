/**
 * Sheet Action Toolbar
 * ====================
 * Floating action icons for the character sheet.
 * Positioned top-right, below the main navbar.
 * Replaces the old sticky top bar with compact, unintrusive icons.
 * 
 * Actions:
 * - Edit/Done toggle (with notification dot for unapplied points)
 * - Recovery modal trigger
 * - Level Up modal trigger
 * - Save state indicator
 */

'use client';

import { cn } from '@/lib/utils';
import { Pencil, Check, Heart, ArrowUp, Save, Loader2, AlertCircle } from 'lucide-react';

interface SheetActionToolbarProps {
  isEditMode: boolean;
  hasUnappliedPoints: boolean;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  onToggleEditMode: () => void;
  onRecovery: () => void;
  onLevelUp: () => void;
}

export function SheetActionToolbar({
  isEditMode,
  hasUnappliedPoints,
  hasUnsavedChanges,
  isSaving,
  lastSaved,
  onToggleEditMode,
  onRecovery,
  onLevelUp,
}: SheetActionToolbarProps) {
  return (
    <div className="fixed top-24 right-4 z-50 flex flex-col gap-2">
      {/* Edit / Done Toggle */}
      <button
        onClick={onToggleEditMode}
        className={cn(
          'relative w-11 h-11 rounded-full shadow-lg transition-all duration-200',
          'flex items-center justify-center',
          'hover:scale-110 active:scale-95',
          isEditMode
            ? 'bg-success-600 hover:bg-success-700 text-white'
            : 'bg-surface border border-border-light text-text-secondary hover:text-text-primary hover:bg-surface-alt'
        )}
        title={isEditMode ? 'Done editing' : 'Edit character'}
        aria-label={isEditMode ? 'Done editing' : 'Edit character'}
      >
        {isEditMode ? (
          <Check className="w-5 h-5" />
        ) : (
          <Pencil className="w-4 h-4" />
        )}
        {/* Notification dot for unapplied points */}
        {hasUnappliedPoints && !isEditMode && (
          <span
            className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full animate-pulse"
            title="You have unspent points!"
          />
        )}
      </button>

      {/* Recovery */}
      <button
        onClick={onRecovery}
        className={cn(
          'w-11 h-11 rounded-full shadow-lg transition-all duration-200',
          'flex items-center justify-center',
          'bg-surface border border-border-light text-blue-600',
          'hover:scale-110 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-200 dark:hover:border-blue-700/50 active:scale-95'
        )}
        title="Recovery"
        aria-label="Recovery"
      >
        <Heart className="w-5 h-5" />
      </button>

      {/* Level Up */}
      <button
        onClick={onLevelUp}
        className={cn(
          'w-11 h-11 rounded-full shadow-lg transition-all duration-200',
          'flex items-center justify-center',
          'bg-surface border border-border-light text-violet-600',
          'hover:scale-110 hover:bg-violet-50 hover:border-violet-200 active:scale-95'
        )}
        title="Level Up"
        aria-label="Level Up"
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      {/* Save State Indicator */}
      <div
        className={cn(
          'w-11 h-11 rounded-full shadow-lg transition-all duration-200',
          'flex items-center justify-center',
          isSaving
            ? 'bg-surface border border-border-light text-text-muted'
            : hasUnsavedChanges
              ? 'bg-amber-50 border border-amber-300 text-amber-600'
              : lastSaved
                ? 'bg-green-50 border border-green-300 text-green-600'
                : 'bg-surface border border-border-light text-text-muted'
        )}
        title={
          isSaving
            ? 'Saving...'
            : hasUnsavedChanges
              ? 'Unsaved changes'
              : lastSaved
                ? 'Saved'
                : 'No changes'
        }
        aria-label={
          isSaving
            ? 'Saving...'
            : hasUnsavedChanges
              ? 'Unsaved changes'
              : 'Saved'
        }
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : hasUnsavedChanges ? (
          <AlertCircle className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
      </div>
    </div>
  );
}
