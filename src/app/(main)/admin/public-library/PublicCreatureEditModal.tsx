/**
 * Public Creature Edit Modal — key fields (name, description, level, type) + optional Advanced JSON.
 */

'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Textarea } from '@/components/ui';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreatureFormState {
  name: string;
  description: string;
  level: number;
  type: string;
  jsonRest: string;
}

const defaultForm: CreatureFormState = {
  name: '',
  description: '',
  level: 1,
  type: '',
  jsonRest: '{}',
};

function parseToForm(data: Record<string, unknown>): CreatureFormState {
  const { name, description, level, type, ...rest } = data;
  return {
    name: String(name ?? ''),
    description: String(description ?? ''),
    level: Number(level ?? 1),
    type: String(type ?? ''),
    jsonRest: Object.keys(rest).length ? JSON.stringify(rest, null, 2) : '{}',
  };
}

function formToPayload(form: CreatureFormState, existingId?: string): Record<string, unknown> {
  let rest: Record<string, unknown> = {};
  try {
    if (form.jsonRest.trim()) rest = JSON.parse(form.jsonRest) as Record<string, unknown>;
  } catch {
    // ignore invalid JSON; save only key fields
  }
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    description: form.description.trim(),
    level: form.level,
    type: form.type.trim() || undefined,
    ...rest,
  };
  if (existingId) payload.id = existingId;
  return payload;
}

interface PublicCreatureEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Record<string, unknown> | null;
  existingId: string | null;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onDelete: (() => void) | null;
  saving: boolean;
  deleteConfirm: boolean;
}

export function PublicCreatureEditModal({
  isOpen,
  onClose,
  initialData,
  existingId,
  onSave,
  onDelete,
  saving,
  deleteConfirm,
}: PublicCreatureEditModalProps) {
  const [form, setForm] = useState<CreatureFormState>(defaultForm);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) setForm(parseToForm(initialData));
    else if (isOpen && !initialData) setForm(defaultForm);
  }, [isOpen, initialData]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    await onSave(formToPayload(form, existingId ?? undefined));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingId ? 'Edit Public Creature' : 'Add Public Creature'}
      size="2xl"
      flexLayout
      footer={
        <div className="p-4 border-t border-border-light flex-shrink-0 bg-surface flex justify-between w-full">
          <div>
            {onDelete && (
              <Button variant="outline" onClick={onDelete} disabled={saving}>
                {deleteConfirm ? 'Confirm delete?' : 'Delete'}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>Save</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        <Input
          label="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Creature name"
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Optional description"
          rows={2}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="number"
            label="Level"
            value={form.level}
            onChange={(e) => setForm((f) => ({ ...f, level: Number(e.target.value) || 1 }))}
            min={1}
          />
          <Input
            label="Type"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            placeholder="e.g. Beast, Humanoid"
          />
        </div>

        <div className="border-t border-border-light pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className={cn(
              'flex items-center gap-2 w-full py-2 text-sm font-medium text-text-secondary hover:text-text-primary'
            )}
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Advanced (full document JSON)
          </button>
          {showAdvanced && (
            <div className="mt-2">
              <Textarea
                value={form.jsonRest}
                onChange={(e) => setForm((f) => ({ ...f, jsonRest: e.target.value }))}
                className="font-mono text-sm"
                rows={12}
                placeholder='{ "hp": 20, "abilities": {}, ... }'
              />
              <p className="text-xs text-text-muted mt-1">
                Merge with name, description, level, type on save. Use for abilities, defenses, skills, etc.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
