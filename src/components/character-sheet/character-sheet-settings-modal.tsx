/**
 * Character Sheet Settings Modal
 * ===============================
 * Opens from the gear icon in the sheet toolbar.
 * Contains character-level settings (visibility, speed display unit).
 * Use Confirm to save so it's clear the setting was saved.
 */

'use client';

import { useState } from 'react';
import { Modal, Select, Button } from '@/components/ui';
import { ONBOARDING_COPY } from '@/lib/constants/copy/onboarding-copy';
import { areTutorialsEnabled } from '@/lib/onboarding-preferences';
import type { CharacterVisibility } from '@/types';

const VISIBILITY_OPTIONS: { value: CharacterVisibility; label: string }[] = [
  { value: 'private', label: 'Private (only you can view)' },
  { value: 'campaign', label: 'Campaign (Realm Master and campaign members can view)' },
  { value: 'public', label: 'Public (anyone can view)' },
];

export type SpeedDisplayUnit = 'spaces' | 'feet' | 'meters';

const SPEED_DISPLAY_OPTIONS: { value: SpeedDisplayUnit; label: string }[] = [
  { value: 'spaces', label: 'Spaces (sp)' },
  { value: 'feet', label: 'Feet (ft) (1 space = 5 ft)' },
  { value: 'meters', label: 'Meters (m) (1 space = 1.5 m)' },
];

export interface CharacterSheetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  visibility?: CharacterVisibility | undefined;
  onVisibilityChange?: ((value: CharacterVisibility) => void) | undefined;
  /** Called when user clicks Confirm: save visibility then show feedback. Parent should save, toast, and close. */
  onConfirmVisibility?: ((value: CharacterVisibility) => void | Promise<void>) | undefined;
  /** When false, visibility is read-only. */
  canEdit?: boolean | undefined;
  /** When true, Private option is disabled (character must leave campaign to set private). */
  isInCampaign?: boolean | undefined;
  /** How to display speed (spaces, feet, or meters). Editing is always in spaces. */
  speedDisplayUnit?: SpeedDisplayUnit | undefined;
  onSpeedDisplayUnitChange?: ((value: SpeedDisplayUnit) => void) | undefined;
  /** Called on Confirm to save both visibility and speed display. If provided, overrides onConfirmVisibility for full save. */
  onConfirm?:
    | ((updates: {
        visibility?: CharacterVisibility | undefined;
        speedDisplayUnit?: SpeedDisplayUnit | undefined;
      }) => void | Promise<void>)
    | undefined;
  /** When true, visibility cannot be changed (guest local sheet). */
  visibilityLocked?: boolean | undefined;
  visibilityLockedMessage?: string | undefined;
  /** Restart the post-save sheet tour from step 1 (owner only). */
  onTakeSheetTour?: (() => void) | undefined;
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
  onTakeSheetTour,
  visibilityLocked = false,
  visibilityLockedMessage,
}: CharacterSheetSettingsModalProps) {
  const tourCopy = ONBOARDING_COPY.sheetSettings;
  const tutorialsEnabled = areTutorialsEnabled();
  // Fresh drafts per open — parent mounts only while showSettingsModal is true.
  const [selectedVisibility, setSelectedVisibility] = useState<CharacterVisibility>(visibility);
  const [selectedSpeedUnit, setSelectedSpeedUnit] = useState<SpeedDisplayUnit>(speedDisplayUnit);

  const visibilityOptions = VISIBILITY_OPTIONS.map((opt) => ({
    ...opt,
    disabled: isInCampaign && opt.value === 'private',
  }));

  const handleConfirm = async () => {
    const visChanged = !visibilityLocked && selectedVisibility !== visibility;
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

  const canSave =
    canEdit && (onVisibilityChange != null || onConfirmVisibility != null || onConfirm != null);
  const hasChanged = selectedVisibility !== visibility || selectedSpeedUnit !== speedDisplayUnit;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Character settings"
      description="Adjust visibility, display preferences, and sheet tour."
      size="md"
      showCloseButton
      fullScreenOnMobile
      footer={
        canSave ? (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button size="lg" onClick={() => void handleConfirm()}>
              {hasChanged ? 'Confirm & save' : 'Done'}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-border-light bg-surface-alt p-3">
          <h3 className="mb-1 text-sm font-semibold text-text-primary">Speed display</h3>
          <p className="mb-2 text-xs text-text-muted">
            Speed is always edited in spaces. Choose how it appears on the sheet: spaces, feet (1 sp
            = 5 ft), or meters (1 sp = 1.5 m).
          </p>
          {canEdit && onSpeedDisplayUnitChange ? (
            <Select
              aria-label="Speed display unit"
              options={SPEED_DISPLAY_OPTIONS}
              value={selectedSpeedUnit}
              onChange={(e) => setSelectedSpeedUnit(e.target.value as SpeedDisplayUnit)}
            />
          ) : (
            <p className="text-sm font-medium text-text-primary">
              {SPEED_DISPLAY_OPTIONS.find((o) => o.value === speedDisplayUnit)?.label ??
                speedDisplayUnit}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-border-light bg-surface-alt p-3">
          <h3 className="mb-1 text-sm font-semibold text-text-primary">Character visibility</h3>
          <p className="mb-2 text-xs text-text-muted">
            Controls who can view this character sheet. Realm Masters can view campaign
            members&apos; sheets when set to Campaign or Public.
          </p>
          {visibilityLocked ? (
            <p className="text-sm text-text-primary">
              {visibilityLockedMessage ?? 'This character stays in this browser until you sign in.'}
            </p>
          ) : (
            <>
              {isInCampaign ? (
                <p className="mb-2 text-xs text-warning-fg">
                  This character is in a campaign. To set visibility to Private, remove them from
                  the campaign first.
                </p>
              ) : null}
              {canEdit && onVisibilityChange ? (
                <Select
                  aria-label="Character visibility"
                  options={visibilityOptions}
                  value={selectedVisibility}
                  onChange={(e) => setSelectedVisibility(e.target.value as CharacterVisibility)}
                />
              ) : (
                <p className="text-sm font-medium text-text-primary">
                  {VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.label ?? visibility}
                </p>
              )}
            </>
          )}
        </div>
        {onTakeSheetTour && (
          <div className="rounded-lg border border-border-light bg-surface-alt p-3">
            <h3 className="mb-1 text-sm font-semibold text-text-primary">{tourCopy.tourTitle}</h3>
            <p className="mb-3 text-xs text-text-muted">{tourCopy.tourDescription}</p>
            {!tutorialsEnabled && (
              <p className="mb-3 text-xs text-text-muted">{tourCopy.tourDisabledHint}</p>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-11"
              disabled={!tutorialsEnabled}
              onClick={() => {
                onTakeSheetTour();
                onClose();
              }}
            >
              {tourCopy.tourRetake}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
