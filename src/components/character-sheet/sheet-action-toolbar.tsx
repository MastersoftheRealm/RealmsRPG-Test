/**
 * Sheet Action Toolbar
 * ====================
 * Character-sheet actions. Below md this is the C4 bottom dock (opaque strip with
 * a reserved end slot for the RollLog FAB). From md it sits top-right under the
 * navbar. Do not add a second `fixed bottom-*` here — RollLog uses the shared
 * `.floating-dock-bottom-right` slot (ADR-0023 / TASK-837).
 *
 * Actions:
 * - Edit/Done toggle (notification dot: red overspend, green unspent, red/green mix when both, purple level-up)
 * - Temp Modifier toggle (mutually exclusive with Edit — ADR-0006 / TASK-782)
 * - Recovery modal trigger
 * - Level Up modal trigger
 */

'use client';

import { cn } from '@/lib/utils';
import type { SheetEditNotification } from '@/lib/character/sheet-edit-notification';
import { Pencil, Check, Heart, ArrowUp, Settings, SlidersHorizontal } from 'lucide-react';

interface SheetActionToolbarProps {
  isEditMode: boolean;
  isTempModifierMode?: boolean | undefined;
  sheetEditNotification: SheetEditNotification;
  /** Glow on the Temp control when persisted deltas exist (play or inactive). */
  hasTempModifiers?: boolean | undefined;
  onToggleEditMode: () => void;
  onToggleTempModifierMode?: (() => void) | undefined;
  onRecovery: () => void;
  onLevelUp: () => void;
  /** Open character sheet settings (e.g. visibility). Shown for owners. */
  onSettings?: (() => void) | undefined;
  /** When false, hide edit/temp/recovery/level-up (view-only mode for non-owners). */
  canEdit?: boolean | undefined;
}

export function SheetActionToolbar({
  isEditMode,
  isTempModifierMode = false,
  sheetEditNotification,
  hasTempModifiers = false,
  onToggleEditMode,
  onToggleTempModifierMode,
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
    <div className="sheet-mobile-action-dock" data-tour-id="sheet-tour-edit">
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
        aria-pressed={isEditMode}
      >
        {isEditMode ? <Check className="h-5 w-5" /> : <Pencil className="h-4 w-4" />}
        {sheetEditNotification.show && !isEditMode && (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full',
              sheetEditNotification.severity === 'overspent' && 'animate-pulse bg-danger-500',
              sheetEditNotification.severity === 'unspent' && 'animate-pulse bg-success-500',
              sheetEditNotification.severity === 'mixed' &&
                'animate-pulse bg-gradient-to-br from-danger-500 to-success-500',
              sheetEditNotification.severity === 'level-up' && 'bg-power-500',
            )}
            title={sheetEditNotification.title}
            aria-label={sheetEditNotification.title}
          />
        )}
      </button>

      {onToggleTempModifierMode && (
        <button
          onClick={onToggleTempModifierMode}
          className={cn(
            'duration-base relative h-11 w-11 rounded-full shadow-lg transition-all ease-standard',
            'flex items-center justify-center',
            'hover:scale-110 active:scale-95',
            isTempModifierMode
              ? 'bg-warning-600 text-text-on-dark hover:bg-warning-700'
              : 'border border-border-light bg-surface text-text-secondary hover:bg-surface-alt hover:text-text-primary',
          )}
          title={isTempModifierMode ? 'Done with Temp Modifier' : 'Temp Modifier'}
          aria-label={isTempModifierMode ? 'Done with Temp Modifier' : 'Temp Modifier'}
          aria-pressed={isTempModifierMode}
        >
          {isTempModifierMode ? (
            <Check className="h-5 w-5" />
          ) : (
            <SlidersHorizontal className="h-4 w-4" />
          )}
          {hasTempModifiers && !isTempModifierMode && (
            <span
              className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-warning-500"
              title="Temp Modifiers are active"
            />
          )}
        </button>
      )}

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
