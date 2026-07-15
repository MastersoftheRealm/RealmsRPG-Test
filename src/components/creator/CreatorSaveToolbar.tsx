'use client';

/**
 * CreatorSaveToolbar — Unified save/load/reset actions for standalone creators
 * ==========================================================================
 * Private/Public toggle (admin), Load, Reset, Save. Used by CreatorPageShell.
 */

import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui';
import { SegmentedControl } from '@/components/shared';

export interface CreatorSaveToolbarProps {
  saveTarget: 'private' | 'public';
  onSaveTargetChange: (target: 'private' | 'public') => void;
  onSave: () => void | Promise<void>;
  onLoad: () => void;
  onReset: () => void;
  saving: boolean;
  saveDisabled?: boolean;
  showPublicPrivate?: boolean;
  user: unknown;
  /**
   * When false, Load is usable while logged out (species creator).
   * Affects Load button aria/tooltip only — shell still owns the auth gate.
   */
  requireAuthToLoad?: boolean;
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
  requireAuthToLoad = true,
}: CreatorSaveToolbarProps) {
  const loadNeedsLogin = requireAuthToLoad && !user;
  const loadLabel = loadNeedsLogin ? 'Log in to load from library' : 'Load from library';

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
      <Button variant="secondary" onClick={onLoad} title={loadLabel} aria-label={loadLabel}>
        <FolderOpen className="w-5 h-5" />
        Load
      </Button>
      <Button variant="secondary" onClick={onReset} aria-label="Reset creator form">
        Reset
      </Button>
      <Button
        onClick={onSave}
        disabled={saving || saveDisabled}
        isLoading={saving}
        aria-label={saving ? 'Saving' : 'Save'}
      >
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}
