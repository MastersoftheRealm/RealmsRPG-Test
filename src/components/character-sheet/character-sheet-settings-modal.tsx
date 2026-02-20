/**
 * Character Sheet Settings Modal
 * ===============================
 * Opens from the gear icon in the sheet toolbar.
 * Contains character-level settings (e.g. visibility/privacy).
 */

'use client';

import { Modal, Select } from '@/components/ui';
import type { CharacterVisibility } from '@/types';

const VISIBILITY_OPTIONS: { value: CharacterVisibility; label: string }[] = [
  { value: 'private', label: 'Private — Only you can view' },
  { value: 'campaign', label: 'Campaign — Realm Master & campaign members can view' },
  { value: 'public', label: 'Public — Anyone can view' },
];

export interface CharacterSheetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  visibility?: CharacterVisibility;
  onVisibilityChange?: (value: CharacterVisibility) => void;
  /** When false, visibility is read-only. */
  canEdit?: boolean;
}

export function CharacterSheetSettingsModal({
  isOpen,
  onClose,
  visibility = 'private',
  onVisibilityChange,
  canEdit = true,
}: CharacterSheetSettingsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Character settings"
      description="Adjust who can view this character sheet."
      size="md"
      showCloseButton
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-border-light bg-surface-alt p-3">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Character visibility</h3>
          <p className="text-xs text-text-muted mb-2">
            Controls who can view this character sheet. Realm Masters can view campaign members&apos; sheets when set to Campaign or Public.
          </p>
          {canEdit && onVisibilityChange ? (
            <Select
              options={VISIBILITY_OPTIONS}
              value={visibility}
              onChange={(e) => onVisibilityChange(e.target.value as CharacterVisibility)}
            />
          ) : (
            <p className="text-sm font-medium text-text-primary">
              {VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.label ?? visibility}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
