/**
 * Character Sheet Settings Modal
 * ===============================
 * Opens from the gear icon in the sheet toolbar.
 * Contains character-level settings (e.g. visibility/privacy).
 * Use Confirm to save visibility so it's clear the setting was saved.
 */

'use client';

import { useState, useEffect } from 'react';
import { Modal, Select, Button } from '@/components/ui';
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
  /** Called when user clicks Confirm: save visibility then show feedback. Parent should save, toast, and close. */
  onConfirmVisibility?: (value: CharacterVisibility) => void | Promise<void>;
  /** When false, visibility is read-only. */
  canEdit?: boolean;
  /** When true, Private option is disabled (character must leave campaign to set private). */
  isInCampaign?: boolean;
}

export function CharacterSheetSettingsModal({
  isOpen,
  onClose,
  visibility = 'private',
  onVisibilityChange,
  onConfirmVisibility,
  canEdit = true,
  isInCampaign = false,
}: CharacterSheetSettingsModalProps) {
  const [selectedVisibility, setSelectedVisibility] = useState<CharacterVisibility>(visibility);

  useEffect(() => {
    if (isOpen) setSelectedVisibility(visibility);
  }, [isOpen, visibility]);

  const visibilityOptions = VISIBILITY_OPTIONS.map((opt) => ({
    ...opt,
    disabled: isInCampaign && opt.value === 'private',
  }));

  const handleConfirm = async () => {
    if (selectedVisibility !== visibility) {
      onVisibilityChange?.(selectedVisibility);
      await onConfirmVisibility?.(selectedVisibility);
    } else {
      onClose();
    }
  };

  const canSave = canEdit && (onVisibilityChange != null || onConfirmVisibility != null);
  const hasChanged = selectedVisibility !== visibility;

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
        <div className="rounded-lg border border-border-light bg-surface-alt dark:bg-[#21262d] p-3">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Character visibility</h3>
          <p className="text-xs text-text-muted mb-2">
            Controls who can view this character sheet. Realm Masters can view campaign members&apos; sheets when set to Campaign or Public.
          </p>
          {isInCampaign && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
              This character is in a campaign. To set visibility to Private, remove them from the campaign first.
            </p>
          )}
          {canEdit && onVisibilityChange ? (
            <Select
              options={visibilityOptions}
              value={selectedVisibility}
              onChange={(e) => setSelectedVisibility(e.target.value as CharacterVisibility)}
            />
          ) : (
            <p className="text-sm font-medium text-text-primary">
              {VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.label ?? visibility}
            </p>
          )}
        </div>
        {canSave && (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              {hasChanged ? 'Confirm & save visibility' : 'Done'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
