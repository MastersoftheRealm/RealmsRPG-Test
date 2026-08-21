'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Modal, Input, Textarea } from '@/components/ui';
import { AdminCodexCopySourceBanner } from './admin-codex-copy-source-banner';
import { AdminCodexEditModalFooter } from './admin-codex-edit-modal-footer';

export type CreatureFeatFormState = {
  name: string;
  description: string;
  points: number | undefined;
  feat_lvl: number | undefined;
  lvl_req: number | undefined;
  mechanic: boolean;
};

export const EMPTY_CREATURE_FEAT_FORM: CreatureFeatFormState = {
  name: '',
  description: '',
  points: undefined,
  feat_lvl: undefined,
  lvl_req: undefined,
  mechanic: false,
};

type AdminCreatureFeatEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  copySourceName: string | null;
  editingId: string | null;
  form: CreatureFeatFormState;
  setForm: Dispatch<SetStateAction<CreatureFeatFormState>>;
  saving: boolean;
  onDelete?: (() => void) | undefined;
  onSave: () => void;
};

export function AdminCreatureFeatEditModal({
  isOpen,
  onClose,
  title,
  copySourceName,
  editingId,
  form,
  setForm,
  saving,
  onDelete,
  onSave,
}: AdminCreatureFeatEditModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="full"
      fullScreenOnMobile
      footer={
        <AdminCodexEditModalFooter
          onDelete={editingId ? onDelete : undefined}
          onClose={onClose}
          onSave={onSave}
          saveDisabled={saving || !form.name.trim()}
          saving={saving}
        />
      }
    >
      <div className="space-y-4">
        <AdminCodexCopySourceBanner copySourceName={copySourceName} entityLabel="creature feat" />
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Name *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Creature feat name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Description</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Feat description"
            className="min-h-[80px] resize-y"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Feat Points
            </label>
            <Input
              type="number"
              min={0}
              value={form.points ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  points:
                    e.target.value === '' ? undefined : (parseInt(e.target.value, 10) ?? undefined),
                }))
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
                setForm((f) => ({
                  ...f,
                  feat_lvl:
                    e.target.value === '' ? undefined : (parseInt(e.target.value, 10) ?? undefined),
                }))
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
                setForm((f) => ({
                  ...f,
                  lvl_req:
                    e.target.value === '' ? undefined : (parseInt(e.target.value, 10) ?? undefined),
                }))
              }
              placeholder="No value"
            />
          </div>
        </div>
        <label className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.mechanic}
            onChange={(e) => setForm((f) => ({ ...f, mechanic: e.target.checked }))}
          />
          <span className="text-sm text-text-secondary">
            Mechanic-only feat (not a normal selectable feat)
          </span>
        </label>
      </div>
    </Modal>
  );
}
