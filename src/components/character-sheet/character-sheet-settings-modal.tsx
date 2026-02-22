/**
 * Character Sheet Settings Modal
 * ===============================
 * Opens from the gear icon in the sheet toolbar.
 * Contains character-level settings (visibility, speed display unit).
 * Use Confirm to save so it's clear the setting was saved.
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

export type SpeedDisplayUnit = 'spaces' | 'feet' | 'meters';

const SPEED_DISPLAY_OPTIONS: { value: SpeedDisplayUnit; label: string }[] = [
  { value: 'spaces', label: 'Spaces (sp)' },
  { value: 'feet', label: 'Feet (ft) — 1 space = 5 ft' },
  { value: 'meters', label: 'Meters (m) — 1 space = 1.5 m' },
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
  /** How to display speed (spaces, feet, or meters). Editing is always in spaces. */
  speedDisplayUnit?: SpeedDisplayUnit;
  onSpeedDisplayUnitChange?: (value: SpeedDisplayUnit) => void;
  /** Called on Confirm to save both visibility and speed display. If provided, overrides onConfirmVisibility for full save. */
  onConfirm?: (updates: { visibility?: CharacterVisibility; speedDisplayUnit?: SpeedDisplayUnit }) => void | Promise<void>;
}

export function CharacterSheetSettingsModal({
  isOpen,
  onClose,
  visibility = 'private',
  onVisibilityChange,
  onConfirmVisibility,
  canEdit = true,
  isInCampaign = false,
  speedDisplayUnit = 'spaces',
  onSpeedDisplayUnitChange,
  onConfirm,
}: CharacterSheetSettingsModalProps) {
  const [selectedVisibility, setSelectedVisibility] = useState<CharacterVisibility>(visibility);
  const [selectedSpeedUnit, setSelectedSpeedUnit] = useState<SpeedDisplayUnit>(speedDisplayUnit);

  useEffect(() => {
    if (isOpen) {
      setSelectedVisibility(visibility);
      setSelectedSpeedUnit(speedDisplayUnit);
    }
  }, [isOpen, visibility, speedDisplayUnit]);

  const visibilityOptions = VISIBILITY_OPTIONS.map((opt) => ({
    ...opt,
    disabled: isInCampaign && opt.value === 'private',
  }));

  const handleConfirm = async () => {
    const visChanged = selectedVisibility !== visibility;
    const speedChanged = selectedSpeedUnit !== speedDisplayUnit;
    if (onConfirm && (visChanged || speedChanged)) {
      await onConfirm({
        ...(visChanged ? { visibility: selectedVisibility } : {}),
        ...(speedChanged ? { speedDisplayUnit: selectedSpeedUnit } : {}),
      });
      if (visChanged) onVisibilityChange?.(selectedVisibility);
      if (speedChanged) onSpeedDisplayUnitChange?.(selectedSpeedUnit);
      onClose();
      return;
    }
    if (visChanged) {
      onVisibilityChange?.(selectedVisibility);
      await onConfirmVisibility?.(selectedVisibility);
    }
    onClose();
  };

  const canSave = canEdit && (onVisibilityChange != null || onConfirmVisibility != null || onConfirm != null);
  const hasChanged = selectedVisibility !== visibility || selectedSpeedUnit !== speedDisplayUnit;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Character settings"
      description="Adjust visibility and display preferences."
      size="md"
      showCloseButton
      fullScreenOnMobile
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-border-light bg-surface-alt dark:bg-[#21262d] p-3">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Speed display</h3>
          <p className="text-xs text-text-muted mb-2">
            Speed is always edited in spaces. Choose how it appears on the sheet: spaces, feet (1 sp = 5 ft), or meters (1 sp = 1.5 m).
          </p>
          {canEdit && onSpeedDisplayUnitChange ? (
            <Select
              options={SPEED_DISPLAY_OPTIONS}
              value={selectedSpeedUnit}
              onChange={(e) => setSelectedSpeedUnit(e.target.value as SpeedDisplayUnit)}
            />
          ) : (
            <p className="text-sm font-medium text-text-primary">
              {SPEED_DISPLAY_OPTIONS.find((o) => o.value === speedDisplayUnit)?.label ?? speedDisplayUnit}
            </p>
          )}
        </div>
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
              {hasChanged ? 'Confirm & save' : 'Done'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
