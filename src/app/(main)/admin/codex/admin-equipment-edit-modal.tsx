'use client';

import type { Dispatch, SetStateAction } from 'react';
import { RealmsImageField } from '@/components/patterns';
import { Modal, Input, Textarea } from '@/components/ui';
import { AdminCodexCopySourceBanner } from './admin-codex-copy-source-banner';
import { AdminCodexEditModalFooter } from './admin-codex-edit-modal-footer';

export type EquipmentFormState = {
  name: string;
  description: string;
  category: string;
  currency: number;
  rarity: string;
  imageId: string | null;
  imageUrl: string | null;
};

export const EMPTY_EQUIPMENT_FORM: EquipmentFormState = {
  name: '',
  description: '',
  category: '',
  currency: 0,
  rarity: 'Common',
  imageId: null,
  imageUrl: null,
};

type AdminEquipmentEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  copySourceName: string | null;
  editingId: string | null;
  form: EquipmentFormState;
  setForm: Dispatch<SetStateAction<EquipmentFormState>>;
  categoryIsNew: boolean;
  setCategoryIsNew: Dispatch<SetStateAction<boolean>>;
  categories: string[];
  saving: boolean;
  onDelete?: (() => void) | undefined;
  onSave: () => void;
};

export function AdminEquipmentEditModal({
  isOpen,
  onClose,
  title,
  copySourceName,
  editingId,
  form,
  setForm,
  categoryIsNew,
  setCategoryIsNew,
  categories,
  saving,
  onDelete,
  onSave,
}: AdminEquipmentEditModalProps) {
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
        <AdminCodexCopySourceBanner copySourceName={copySourceName} entityLabel="equipment" />
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Name *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Equipment name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Description</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Equipment description"
            className="min-h-[120px] resize-y"
            rows={4}
          />
        </div>
        <RealmsImageField
          categories="equipment"
          imageId={form.imageId}
          imageUrl={form.imageUrl}
          onChange={({ imageId, imageUrl }) => setForm((f) => ({ ...f, imageId, imageUrl }))}
          entityName={form.name}
          label="Equipment card art"
        />
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <label className="mb-1 block text-sm font-medium text-text-secondary">Category</label>
            <select
              value={categoryIsNew ? '__new__' : form.category || ''}
              onChange={(e) => {
                const v = e.target.value;
                setCategoryIsNew(v === '__new__');
                setForm((f) => ({ ...f, category: v === '__new__' ? '' : v }));
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
              aria-label="Category"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="__new__">Add new category...</option>
            </select>
            {categoryIsNew && (
              <Input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Type new category"
                className="mt-2"
              />
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Currency Cost
            </label>
            <Input
              type="number"
              min={0}
              step="any"
              value={form.currency}
              onChange={(e) =>
                setForm((f) => ({ ...f, currency: parseFloat(e.target.value) || 0 }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Rarity</label>
            <select
              value={form.rarity}
              onChange={(e) => setForm((f) => ({ ...f, rarity: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
              aria-label="Rarity"
            >
              {['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Ascended'].map(
                (r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}
