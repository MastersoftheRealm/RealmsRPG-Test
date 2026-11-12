'use client';

import { Modal } from '@/components/ui';
import type { Feat, Skill } from '@/hooks';
import { featToFormState, type FeatFormState } from './admin-feat-form';
import {
  ADMIN_FEAT_MODAL_SELECT_CLASS,
  AdminFeatEditModalFields,
} from './admin-feat-edit-modal-fields';
import { AdminFeatLevelControls } from './admin-codex-feat-level-fields';
import { AdminCodexCopySourceBanner } from './admin-codex-copy-source-banner';
import { AdminCodexEditModalFooter } from './admin-codex-edit-modal-footer';
import { codexFeatEditorIsDirty } from './admin-codex-unsaved-leave';
import { useCodexEditorLeaveGuard } from './admin-codex-unsaved-leave-guard';
import { useAdminLeveledFeatSession } from './use-admin-leveled-feat-session';
import { getFeatLevel, peakFeatInFamily } from '@/lib/leveled-feats';

export function AdminFeatEditModal({
  isOpen,
  onClose,
  title,
  copySourceName,
  feats,
  levelFeats,
  skills,
  filterOptions,
  abilityOptions,
  saving,
  canDelete,
  onDelete,
  onSave,
  onSaveAll,
  initialForm,
  initialEditId,
  enableAddLevel,
  onAddLevel,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  copySourceName: string | null;
  feats: Feat[] | undefined;
  /** When editing a leveled feat family, this contains all feats in that family (sorted). */
  levelFeats: Feat[];
  skills: Skill[];
  filterOptions: {
    levels: number[];
    abilities: string[];
    categories: string[];
    tags: string[];
    abilReqAbilities: string[];
  };
  abilityOptions: { value: string; label: string }[];
  saving: boolean;
  canDelete: boolean;
  onDelete?: (() => void) | undefined;
  onSave: (id: string | null, form: FeatFormState) => void;
  onSaveAll: (editsById: Record<string, FeatFormState>) => void;
  initialForm: FeatFormState;
  initialEditId: string | null;
  enableAddLevel: boolean;
  onAddLevel?: ((form: FeatFormState, sourceDbFeatId: string) => void) | undefined;
}) {
  // Fresh state per open: parent remounts with key={modalSessionKey}.
  const session = useAdminLeveledFeatSession({
    initialForm,
    initialEditId,
    levelFeats,
    toForm: featToFormState,
  });
  const {
    form,
    setFormField,
    setFormUpdater,
    selectedEditId,
    hasLevels,
    levelOptions,
    dirtyLevelLabels,
    dirtyIds,
    handleSelectLevel,
    dirtyPayload,
  } = session;

  const leave = useCodexEditorLeaveGuard(
    codexFeatEditorIsDirty({
      hasLevels,
      dirtyLevelCount: dirtyIds.size,
      form,
      initialForm,
    }),
    onClose,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={leave.requestClose}
      title={title}
      size="full"
      fullScreenOnMobile
      footer={
        <AdminCodexEditModalFooter
          onDelete={canDelete ? onDelete : undefined}
          onClose={leave.requestClose}
          onSave={() => {
            if (hasLevels) {
              const payload = dirtyPayload();
              if (Object.keys(payload).length === 0) return;
              onSaveAll(payload);
              return;
            }
            onSave(selectedEditId, form);
          }}
          saveDisabled={saving || !form.name.trim() || (hasLevels && dirtyIds.size === 0)}
          saving={saving}
        />
      }
    >
      <div className="space-y-4">
        <AdminFeatLevelControls
          hasLevels={hasLevels}
          enableAddLevel={enableAddLevel && Boolean(onAddLevel)}
          saving={saving}
          selectedEditId={selectedEditId}
          canAddFromSingle={Boolean(initialEditId)}
          levelOptions={levelOptions}
          dirtyLevelLabels={dirtyLevelLabels}
          addLevelHelp="Save a new row for the next feat tier. Level and character level required are filled from the current feat."
          onSelectLevel={handleSelectLevel}
          onAddLevel={() => {
            const sourceId = hasLevels ? selectedEditId : initialEditId;
            if (!sourceId || !onAddLevel) return;
            const peak = peakFeatInFamily(levelFeats);
            if (peak != null && getFeatLevel(peak) > getFeatLevel({ feat_lvl: form.feat_lvl })) {
              const peakId = String(peak.id);
              onAddLevel(peakId === sourceId ? form : featToFormState(peak), peakId);
              return;
            }
            onAddLevel(form, sourceId);
          }}
          selectClassName={ADMIN_FEAT_MODAL_SELECT_CLASS}
        />
        <AdminCodexCopySourceBanner copySourceName={copySourceName} entityLabel="feat" />
        <AdminFeatEditModalFields
          form={form}
          setFormField={setFormField}
          setFormUpdater={setFormUpdater}
          feats={feats}
          skills={skills}
          filterOptions={filterOptions}
          abilityOptions={abilityOptions}
        />
      </div>
      {leave.prompt}
    </Modal>
  );
}
