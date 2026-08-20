'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Modal, Button, Input, Textarea } from '@/components/ui';
import { Plus, X } from 'lucide-react';
import { PROPERTY_TYPES, type PropertyFormState } from './admin-property-form';
import { AdminCodexCopySourceBanner } from './admin-codex-copy-source-banner';
import { AdminCodexEditModalFooter } from './admin-codex-edit-modal-footer';

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
  onDelete?: (() => void) | undefined;
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
  onDelete,
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
        <AdminCodexCopySourceBanner copySourceName={copySourceName} entityLabel="property" />
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Name *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Property name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Description</label>
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
            <label className="mb-1 block text-sm font-medium text-text-secondary">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
              aria-label="Property type"
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <label className="mt-6 flex items-center gap-2">
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
            <label className="mb-1 block text-sm font-medium text-text-secondary">Base IP</label>
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
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
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
                <Plus className="mr-1 inline h-4 w-4" />
                Add option
              </Button>
            )}
          </div>
          {optionSlotCount === 0 ? (
            <p className="text-sm text-text-muted">
              No option. Click &quot;Add option&quot; if this property has a cost option.
            </p>
          ) : (
            <div className="space-y-3 rounded-lg border border-border-light bg-surface-alt/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-secondary">Option</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-text-muted hover:text-danger-fg"
                  onClick={clearOption}
                  aria-label="Remove option"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  Description
                </label>
                <textarea
                  value={form.op_1_desc}
                  onChange={(e) => setForm((f) => ({ ...f, op_1_desc: e.target.value }))}
                  placeholder="What this option does"
                  className="min-h-[80px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-text-primary"
                  rows={3}
                />
              </div>
              <div className="grid max-w-sm grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
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
                        op_1_ip:
                          e.target.value === '' ? undefined : parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="-"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
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
                        op_1_tp:
                          e.target.value === '' ? undefined : parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="-"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
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
