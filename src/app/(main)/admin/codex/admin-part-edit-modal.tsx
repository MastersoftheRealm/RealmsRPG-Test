'use client';

import type { Dispatch, SetStateAction } from 'react';
import { ChipSelect } from '@/components/patterns/filters';
import { Modal, Input, Textarea } from '@/components/ui';
import { baseEnToPercent, percentToBaseEn, type PartFormState } from './admin-part-form';
import { AdminPartEditModalOptions } from './admin-part-edit-modal-options';
import { AdminCodexCopySourceBanner } from './admin-codex-copy-source-banner';
import { AdminCodexEditModalFooter } from './admin-codex-edit-modal-footer';

export type AdminPartEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  copySourceName: string | null;
  editingId: string | null;
  form: PartFormState;
  setForm: Dispatch<SetStateAction<PartFormState>>;
  filterCategories: string[];
  targetedDefenseOptions: string[];
  optionSlotCount: number;
  setOptionSlotCount: Dispatch<SetStateAction<number>>;
  deleteOptionAndCompact: (index1Based: 1 | 2 | 3) => void;
  saving: boolean;
  onDelete?: (() => void) | undefined;
  onSave: () => void;
};

export function AdminPartEditModal({
  isOpen,
  onClose,
  title,
  copySourceName,
  editingId,
  form,
  setForm,
  filterCategories,
  targetedDefenseOptions,
  optionSlotCount,
  setOptionSlotCount,
  deleteOptionAndCompact,
  saving,
  onDelete,
  onSave,
}: AdminPartEditModalProps) {
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
        <AdminCodexCopySourceBanner copySourceName={copySourceName} entityLabel="part" />
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Name *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Part name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Description</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Part description"
            className="min-h-[120px] resize-y"
            rows={4}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Category</label>
            <select
              value={
                form.category && filterCategories.includes(form.category)
                  ? form.category
                  : form.category
                    ? '__new__'
                    : ''
              }
              onChange={(e) => {
                const v = e.target.value;
                if (v === '__new__') setForm((f) => ({ ...f, category: f.category || '' }));
                else setForm((f) => ({ ...f, category: v }));
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
              aria-label="Part category"
            >
              <option value="">None</option>
              {filterCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="__new__">Add new category...</option>
            </select>
            {form.category && !filterCategories.includes(form.category) && (
              <Input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Type new category"
                className="mt-2"
              />
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Type</label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  type: e.target.value as 'power' | 'technique',
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
              aria-label="Part type (power or technique)"
            >
              <option value="power">Power</option>
              <option value="technique">Technique</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Base EN {form.percentage ? '(%)' : ''}
            </label>
            {form.percentage ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="any"
                  value={baseEnToPercent(form.base_en)}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      base_en: percentToBaseEn(e.target.value),
                    }))
                  }
                  placeholder="e.g. -12.5 or 12.5"
                />
                <span className="shrink-0 text-sm text-text-muted">%</span>
              </div>
            ) : (
              <Input
                type="number"
                min={0}
                step="any"
                value={form.base_en ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    base_en: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0,
                  }))
                }
              />
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Base TP</label>
            <Input
              type="number"
              min={0}
              step="any"
              value={form.base_tp ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  base_tp: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0,
                }))
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.mechanic}
              onChange={(e) => setForm((f) => ({ ...f, mechanic: e.target.checked }))}
            />
            <span className="text-sm text-text-secondary">Mechanic Part</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.percentage}
              onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.checked }))}
            />
            <span className="text-sm text-text-secondary">Percentage Cost</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: e.target.checked }))}
            />
            <span className="text-sm text-text-secondary">Affects Duration</span>
          </label>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Targeted defenses (optional)
          </label>
          <ChipSelect
            label=""
            placeholder="Choose defenses this part targets"
            options={targetedDefenseOptions.map((d) => ({
              value: d,
              label: d,
            }))}
            selectedValues={form.defense}
            onSelect={(v) => setForm((f) => ({ ...f, defense: [...f.defense, v] }))}
            onRemove={(v) =>
              setForm((f) => ({
                ...f,
                defense: f.defense.filter((x) => x !== v),
              }))
            }
          />
        </div>
        <AdminPartEditModalOptions
          form={form}
          setForm={setForm}
          optionSlotCount={optionSlotCount}
          setOptionSlotCount={setOptionSlotCount}
          deleteOptionAndCompact={deleteOptionAndCompact}
        />
      </div>
    </Modal>
  );
}
