'use client';

import { Modal, Input, Textarea } from '@/components/ui';
import type { CreatureFeat } from '@/hooks';
import { AdminCodexCopySourceBanner } from './admin-codex-copy-source-banner';
import { AdminCodexEditModalFooter } from './admin-codex-edit-modal-footer';
import { AdminCodexSourceField } from './admin-codex-source-field';
import {
  AdminBaseFeatSelect,
  AdminFeatLevelControls,
  AdminStoredCategoryField,
} from './admin-codex-feat-level-fields';
import { codexFeatEditorIsDirty } from './admin-codex-unsaved-leave';
import { useCodexEditorLeaveGuard } from './admin-codex-unsaved-leave-guard';
import { useAdminLeveledFeatSession } from './use-admin-leveled-feat-session';
import { getFeatLevel, peakFeatInFamily } from '@/lib/leveled-feats';
import {
  creatureFeatToFormState,
  parseOptionalAdminDecimalInput,
  type CreatureFeatFormState,
} from './admin-creature-feat-form';

export type { CreatureFeatFormState } from './admin-creature-feat-form';
export {
  EMPTY_CREATURE_FEAT_FORM,
  parseOptionalAdminDecimalInput,
} from './admin-creature-feat-form';

export function AdminCreatureFeatEditModal({
  isOpen,
  onClose,
  title,
  copySourceName,
  creatureFeats,
  levelFeats,
  categories,
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
  creatureFeats: CreatureFeat[];
  levelFeats: CreatureFeat[];
  categories: readonly string[];
  saving: boolean;
  canDelete: boolean;
  onDelete?: (() => void) | undefined;
  onSave: (id: string | null, form: CreatureFeatFormState) => void;
  onSaveAll: (editsById: Record<string, CreatureFeatFormState>) => void;
  initialForm: CreatureFeatFormState;
  initialEditId: string | null;
  enableAddLevel: boolean;
  onAddLevel?: ((form: CreatureFeatFormState, sourceDbFeatId: string) => void) | undefined;
}) {
  const session = useAdminLeveledFeatSession({
    initialForm,
    initialEditId,
    levelFeats,
    toForm: creatureFeatToFormState,
  });
  const {
    form,
    setFormField,
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
          addLevelHelp="Save a new row for the next creature-feat tier. Feat level is one higher, and the base feat is the level-1 creature feat. Required level is copied."
          onSelectLevel={handleSelectLevel}
          onAddLevel={() => {
            const sourceId = hasLevels ? selectedEditId : initialEditId;
            if (!sourceId || !onAddLevel) return;
            const peak = peakFeatInFamily(levelFeats);
            const selectedLvl = form.feat_lvl != null && form.feat_lvl > 0 ? form.feat_lvl : 1;
            if (peak != null && getFeatLevel(peak) > selectedLvl) {
              const peakId = String(peak.id);
              onAddLevel(peakId === sourceId ? form : creatureFeatToFormState(peak), peakId);
              return;
            }
            onAddLevel(form, sourceId);
          }}
        />
        <AdminCodexCopySourceBanner copySourceName={copySourceName} entityLabel="creature feat" />
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Name *</label>
          <Input
            value={form.name}
            onChange={(e) => setFormField('name', e.target.value)}
            placeholder="Creature feat name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Description</label>
          <Textarea
            value={form.description}
            onChange={(e) => setFormField('description', e.target.value)}
            placeholder="Feat description"
            className="min-h-[80px] resize-y"
            rows={3}
          />
        </div>
        <AdminCodexSourceField
          value={form.sources}
          onChange={(sources) => setFormField('sources', sources)}
        />
        <div className="grid grid-cols-2 gap-4">
          <AdminStoredCategoryField
            label="Category"
            ariaLabel="Creature feat category"
            value={form.category}
            categories={categories}
            onChange={(category) => setFormField('category', category)}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Feat Points
            </label>
            <Input
              type="number"
              step="any"
              value={form.points ?? ''}
              onChange={(e) =>
                setFormField('points', parseOptionalAdminDecimalInput(e.target.value))
              }
              placeholder="No value"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Feat Level</label>
            <Input
              type="number"
              min={0}
              value={form.feat_lvl ?? ''}
              onChange={(e) =>
                setFormField(
                  'feat_lvl',
                  e.target.value === '' ? undefined : (parseInt(e.target.value, 10) ?? undefined),
                )
              }
              placeholder="No value"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Required Creature Level
            </label>
            <Input
              type="number"
              min={0}
              value={form.lvl_req ?? ''}
              onChange={(e) =>
                setFormField(
                  'lvl_req',
                  e.target.value === '' ? undefined : (parseInt(e.target.value, 10) ?? undefined),
                )
              }
              placeholder="No value"
            />
          </div>
          <AdminBaseFeatSelect
            id="admin-creature-feat-base-feat-id"
            value={form.base_feat_id}
            onChange={(baseFeatId) => setFormField('base_feat_id', baseFeatId)}
            feats={creatureFeats}
            hint="For level 2+ creature feats, select the level-1 creature feat in this family."
          />
        </div>
        <label className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.mechanic}
            onChange={(e) => setFormField('mechanic', e.target.checked)}
          />
          <span className="text-sm text-text-secondary">
            Mechanic-only feat (not a normal selectable feat)
          </span>
        </label>
      </div>
      {leave.prompt}
    </Modal>
  );
}
