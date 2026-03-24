'use client';

/**
 * CreatorSaveToolbar — Unified save/load/reset actions for all creators
 * =====================================================================
 * Renders Private/Public toggle (admin only), Load, Reset, and Save buttons.
 * Same styling and behavior across power, technique, item, and creature creators.
 */

import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui';
import { SegmentedControl } from '@/components/shared';

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
    <div className="flex flex-wrap items-center gap-2">
      {showPublicPrivate && (
        <SegmentedControl
          value={saveTarget}
          onChange={onSaveTargetChange}
          options={[
            { value: 'private', label: 'My library' },
            { value: 'public', label: 'Public library' },
          ]}
          aria-label="Save to my library or Realms Library"
        />
      )}
      <Button
        variant="secondary"
        onClick={onLoad}
        title={user ? 'Load from library' : 'Log in to load from library'}
        aria-label={user ? 'Load from library' : 'Log in to load from library'}
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
    </div>
  );
}
