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
      <div className="fixed top-24 right-4 z-overlay flex items-center gap-2 rounded-full border border-border-light bg-surface px-3 py-2 text-sm text-text-muted">
        View only
      </div>
    );
  }

  return (
    <div
      className="fixed right-4 bottom-4 left-4 z-overlay flex flex-row justify-center gap-2 md:top-24 md:right-4 md:bottom-auto md:left-auto md:flex-col md:justify-start md:gap-2"
      data-tour-id="sheet-tour-edit"
    >
      {/* Edit / Done Toggle */}
      <button
        onClick={onToggleEditMode}
        className={cn(
          'duration-base relative h-11 w-11 rounded-full shadow-lg transition-all ease-standard',
          'flex items-center justify-center',
          'hover:scale-110 active:scale-95',
          isEditMode
            ? 'bg-success-600 text-text-on-dark hover:bg-success-700'
            : 'border border-border-light bg-surface text-text-secondary hover:bg-surface-alt hover:text-text-primary',
        )}
        title={isEditMode ? 'Done editing' : 'Edit character'}
        aria-label={isEditMode ? 'Done editing' : 'Edit character'}
      >
        {isEditMode ? <Check className="h-5 w-5" /> : <Pencil className="h-4 w-4" />}
        {/* Notification dot for unapplied points */}
        {hasUnappliedPoints && !isEditMode && (
          <span
            className="absolute -top-0.5 -right-0.5 h-3 w-3 animate-pulse rounded-full bg-danger-500"
            title="You have unspent points!"
          />
        )}
      </button>

      {/* Recovery */}
      <button
        onClick={onRecovery}
        className={cn(
          'duration-base h-11 w-11 rounded-full shadow-lg transition-all ease-standard',
          'flex items-center justify-center',
          'border border-border-light bg-surface text-primary-link-fg',
          'hover:scale-110 hover:border-primary-subtle-border hover:bg-primary-subtle-bg active:scale-95 dark:hover:border-primary-outline-border dark:hover:bg-primary-subtle-bg',
        )}
        title="Recovery"
        aria-label="Recovery"
      >
        <Heart className="h-5 w-5" />
      </button>

      {/* Level Up */}
      <button
        onClick={onLevelUp}
        className={cn(
          'duration-base h-11 w-11 rounded-full shadow-lg transition-all ease-standard',
          'flex items-center justify-center',
          'border border-border-light bg-surface text-power-fg',
          'hover:scale-110 hover:border-power-border hover:bg-power-light active:scale-95',
        )}
        title="Level Up"
        aria-label="Level Up"
      >
        <ArrowUp className="h-5 w-5" />
      </button>

      {/* Character settings (visibility, etc.) */}
      {onSettings && (
        <button
          onClick={onSettings}
          className={cn(
            'duration-base h-11 w-11 rounded-full shadow-lg transition-all ease-standard',
            'flex items-center justify-center',
            'border border-border-light bg-surface text-text-secondary',
            'hover:scale-110 hover:bg-surface-alt hover:text-text-primary active:scale-95',
          )}
          title="Character settings"
          aria-label="Character settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
