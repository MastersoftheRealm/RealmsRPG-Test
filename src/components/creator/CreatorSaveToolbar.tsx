'use client';

/**
 * CreatorSaveToolbar — Unified save/load/reset actions for standalone creators
 * ==========================================================================
 * Private/Public toggle (admin), Load, Reset, Save. Used by CreatorPageShell.
 */

import type { ReactNode } from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui';
import { SegmentedControl } from '@/components/patterns';

export interface CreatorSaveToolbarProps {
  saveTarget: 'private' | 'public';
  onSaveTargetChange: (target: 'private' | 'public') => void;
  onSave: () => void | Promise<void>;
  onLoad: () => void;
  onReset: () => void;
  saving: boolean;
  saveDisabled?: boolean | undefined;
  showPublicPrivate?: boolean | undefined;
  user: unknown;
  /**
   * When false, Load is usable while logged out (species creator).
   * Affects Load button aria/tooltip only — shell still owns the auth gate.
   */
  requireAuthToLoad?: boolean | undefined;
  className?: string | undefined;
  /** Optional InfoTippy beside Load */
  loadHelp?: ReactNode | undefined;
  /** Optional InfoTippy beside Reset */
  resetHelp?: ReactNode | undefined;
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
  loadHelp,
  resetHelp,
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
      <span className="inline-flex items-center gap-1">
        <Button variant="secondary" onClick={onLoad} title={loadLabel} aria-label={loadLabel}>
          <FolderOpen className="h-5 w-5" />
          Load
        </Button>
        {loadHelp}
      </span>
      <span className="inline-flex items-center gap-1">
        <Button variant="secondary" onClick={onReset} aria-label="Reset creator form">
          Reset
        </Button>
        {resetHelp}
      </span>
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
