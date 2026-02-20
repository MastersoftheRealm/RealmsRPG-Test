'use client';

/**
 * CreatorSaveToolbar — Unified save/load/reset actions for all creators
 * =====================================================================
 * Renders Private/Public toggle (admin only), Load, Reset, and Save buttons.
 * Same styling and behavior across power, technique, item, and creature creators.
 */

import { FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

export interface CreatorSaveToolbarProps {
  /** Current save target (private or public library) */
  saveTarget: 'private' | 'public';
  /** Called when user toggles Private/Public */
  onSaveTargetChange: (target: 'private' | 'public') => void;
  /** Called when user clicks Save */
  onSave: () => void | Promise<void>;
  /** Called when user clicks Load */
  onLoad: () => void;
  /** Called when user clicks Reset */
  onReset: () => void;
  /** Save in progress */
  saving: boolean;
  /** Disable Save button (e.g. when name is empty) */
  saveDisabled?: boolean;
  /** Show My library / Public library toggle (admin only) */
  showPublicPrivate?: boolean;
  /** Whether user is logged in (for Load button tooltip) */
  user: unknown;
  /** Optional className for the actions wrapper */
  className?: string;
}

const toggleButtonClass = (active: boolean) =>
  cn(
    'px-2 py-1 rounded text-sm font-medium transition-colors',
    active ? 'bg-primary-600 text-white' : 'text-text-muted hover:text-text-secondary'
  );

export function CreatorSaveToolbar({
  saveTarget,
  onSaveTargetChange,
  onSave,
  onLoad,
  onReset,
  saving,
  saveDisabled = false,
  showPublicPrivate = false,
  user,
  className,
}: CreatorSaveToolbarProps) {
  return (
    <>
      {showPublicPrivate && (
        <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-alt">
          <button
            type="button"
            onClick={() => onSaveTargetChange('private')}
            className={toggleButtonClass(saveTarget === 'private')}
          >
            My library
          </button>
          <button
            type="button"
            onClick={() => onSaveTargetChange('public')}
            className={toggleButtonClass(saveTarget === 'public')}
          >
            Public library
          </button>
        </div>
      )}
      <Button
        variant="secondary"
        onClick={onLoad}
        title={user ? 'Load from library' : 'Log in to load from library'}
      >
        <FolderOpen className="w-5 h-5" />
        Load
      </Button>
      <Button variant="secondary" onClick={onReset}>
        Reset
      </Button>
      <Button
        onClick={onSave}
        disabled={saving || saveDisabled}
        isLoading={saving}
      >
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </>
  );
}
