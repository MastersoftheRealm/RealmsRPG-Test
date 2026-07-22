'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Modal, Button, Input, Textarea } from '@/components/ui';
import { Plus, X } from 'lucide-react';
import type { PropertyFormState } from './admin-property-form';

export type AdminPropertyEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  copySourceName: string | null;
  editingId: string | null;
  form: PropertyFormState;
  setForm: Dispatch<SetStateAction<PropertyFormState>>;
  optionSlotCount: number;
  setOptionSlotCount: Dispatch<SetStateAction<number>>;
  clearOption: () => void;
  saving: boolean;
  deleteConfirm: string | null;
  onRequestDelete: () => void;
  onSave: () => void;
};

export function AdminPropertyEditModal({
  isOpen,
  onClose,
  title,
  copySourceName,
  editingId,
  form,
  setForm,
  optionSlotCount,
  setOptionSlotCount,
  clearOption,
  saving,
  deleteConfirm,
  onRequestDelete,
  onSave,
}: AdminPropertyEditModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="full"
      fullScreenOnMobile
      footer={
        <div className="flex justify-between">
          <div>
            {editingId && (
              <Button
                variant="outline"
                onClick={onRequestDelete}
                className={
                  deleteConfirm === editingId
                    ? 'border-danger-500 text-danger-700 dark:text-danger-400'
                    : ''
                }
              >
                {deleteConfirm === editingId ? 'Click again to confirm delete' : 'Delete'}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {copySourceName && (
          <p className="text-sm text-text-secondary rounded-md bg-surface-alt px-3 py-2 border border-border-light">
            Creating a copy of <strong className="text-text-primary">{copySourceName}</strong>. Change
            the name and details as needed, then save to add the new property.
          </p>
        )}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Property name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Property description"
            className="min-h-[140px] resize-y"
            rows={5}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
              aria-label="Property type"
            >
              <option value="Armor">Armor</option>
              <option value="Shield">Shield</option>
              <option value="Weapon">Weapon</option>
            </select>
          </div>
          <label className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={form.mechanic}
              onChange={(e) => setForm((f) => ({ ...f, mechanic: e.target.checked }))}
            />
            <span className="text-sm text-text-secondary">Mechanic Property</span>
          </label>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Base IP</label>
            <Input
              type="number"
              min={0}
              step="any"
              value={form.base_ip ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  base_ip: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0,
                }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Base TP</label>
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
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Base Cost Multiplier
            </label>
            <Input
              type="number"
              min={0}
              step="any"
              value={form.base_c ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  base_c: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0,
                }))
              }
            />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text-secondary">Option</h4>
            {optionSlotCount === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOptionSlotCount(1)}
                aria-label="Add option"
              >
                <Plus className="w-4 h-4 mr-1 inline" />
                Add option
              </Button>
            )}
          </div>
          {optionSlotCount === 0 ? (
            <p className="text-sm text-text-muted">
              No option. Click &quot;Add option&quot; if this property has a cost option.
            </p>
          ) : (
            <div className="rounded-lg border border-border-light bg-surface-alt/50 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-secondary">Option</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-text-muted hover:text-danger-fg"
                  onClick={clearOption}
                  aria-label="Remove option"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Description
                </label>
                <textarea
                  value={form.op_1_desc}
                  onChange={(e) => setForm((f) => ({ ...f, op_1_desc: e.target.value }))}
                  placeholder="What this option does"
                  className="w-full min-h-[80px] resize-y px-3 py-2 rounded-md border border-border bg-background text-text-primary"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 max-w-sm">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    IP (Item Points)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={form.op_1_ip ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        op_1_ip: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="-"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    TP (Training Points)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={form.op_1_tp ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        op_1_tp: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="-"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Cost multiplier
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={form.op_1_c ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        op_1_c: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="-"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
