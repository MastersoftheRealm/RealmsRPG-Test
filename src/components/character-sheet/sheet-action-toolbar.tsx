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
 */

'use client';

import { cn } from '@/lib/utils';
import { Pencil, Check, Heart, ArrowUp, Settings } from 'lucide-react';

interface SheetActionToolbarProps {
  isEditMode: boolean;
  hasUnappliedPoints: boolean;
  onToggleEditMode: () => void;
  onRecovery: () => void;
  onLevelUp: () => void;
  /** Open character sheet settings (e.g. visibility). Shown for owners. */
  onSettings?: () => void;
  /** When false, hide edit/recovery/level-up (view-only mode for non-owners). */
  canEdit?: boolean;
}

export function SheetActionToolbar({
  isEditMode,
  hasUnappliedPoints,
  onToggleEditMode,
  onRecovery,
  onLevelUp,
  onSettings,
  canEdit = true,
}: SheetActionToolbarProps) {
  if (!canEdit) {
    return (
      <div className="fixed top-24 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-surface border border-border-light text-text-muted text-sm">
        View only
      </div>
    );
  }

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
            className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-danger-500 rounded-full animate-pulse"
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
          'bg-surface border border-border-light text-primary-600',
          'hover:scale-110 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-200 dark:hover:border-primary-700/50 active:scale-95'
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

      {/* Character settings (visibility, etc.) */}
      {onSettings && (
        <button
          onClick={onSettings}
          className={cn(
            'w-11 h-11 rounded-full shadow-lg transition-all duration-200',
            'flex items-center justify-center',
            'bg-surface border border-border-light text-text-secondary',
            'hover:scale-110 hover:text-text-primary hover:bg-surface-alt active:scale-95'
          )}
          title="Character settings"
          aria-label="Character settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
