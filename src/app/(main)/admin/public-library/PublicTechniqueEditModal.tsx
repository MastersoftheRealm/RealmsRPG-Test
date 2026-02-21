/**
 * Public Technique Edit Modal — structured form: name, description, weapon, damage, action type, parts (add/remove, option levels).
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Modal, Button, Input, Textarea, Select } from '@/components/ui';
import { useTechniqueParts } from '@/hooks';
import { TECHNIQUE_DAMAGE_TYPES } from '@/lib/game/creator-constants';
import { Plus, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui';

const ACTION_TYPES = [
  { value: 'basic', label: 'Basic' },
  { value: 'full', label: 'Full' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'reaction', label: 'Reaction' },
] as const;

export interface TechniqueFormPart {
  id: string | number;
  name: string;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
  applyDuration: boolean;
}

export interface TechniqueFormState {
  name: string;
  description: string;
  actionType: string;
  weapon: string;
  damage: { amount: number; size: number; type: string };
  parts: TechniqueFormPart[];
}

const defaultForm: TechniqueFormState = {
  name: '',
  description: '',
  actionType: 'basic',
  weapon: '',
  damage: { amount: 0, size: 6, type: 'none' },
  parts: [],
};

function parseToForm(data: Record<string, unknown>): TechniqueFormState {
  const dmg = (data.damage as { amount?: number; size?: number; type?: string }) || {};
  const weaponObj = data.weapon as { id?: number; name?: string } | undefined;
  const partsRaw = (Array.isArray(data.parts) ? data.parts : []) as Array<{
    id?: number | string;
    name?: string;
    op_1_lvl?: number;
    op_2_lvl?: number;
    op_3_lvl?: number;
    applyDuration?: boolean;
  }>;
  const parts: TechniqueFormPart[] = partsRaw.map((p, i) => ({
    id: p.id ?? p.name ?? `p-${i}`,
    name: String(p.name ?? ''),
    op_1_lvl: p.op_1_lvl ?? 0,
    op_2_lvl: p.op_2_lvl ?? 0,
    op_3_lvl: p.op_3_lvl ?? 0,
    applyDuration: Boolean(p.applyDuration),
  }));
  return {
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    actionType: String(data.actionType ?? 'basic'),
    weapon: weaponObj?.name ?? String(weaponObj?.id ?? ''),
    damage: {
      amount: Number(dmg.amount ?? 0),
      size: Number(dmg.size ?? 6),
      type: String(dmg.type ?? 'none'),
    },
    parts,
  };
}

function formToPayload(form: TechniqueFormState, existingId?: string): Record<string, unknown> {
  const damage =
    form.damage.type !== 'none' && form.damage.amount > 0
      ? [{ amount: form.damage.amount, size: form.damage.size, type: form.damage.type }]
      : [];
  const parts = form.parts.map((p) => ({
    id: typeof p.id === 'string' && /^\d+$/.test(p.id) ? Number(p.id) : p.id,
    name: p.name,
    op_1_lvl: p.op_1_lvl,
    op_2_lvl: p.op_2_lvl,
    op_3_lvl: p.op_3_lvl,
    applyDuration: p.applyDuration,
  }));
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    description: form.description.trim(),
    actionType: form.actionType,
    weapon: form.weapon.trim() ? { name: form.weapon.trim() } : undefined,
    damage,
    parts,
  };
  if (existingId) payload.id = existingId;
  return payload;
}

interface PublicTechniqueEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Record<string, unknown> | null;
  existingId: string | null;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onDelete: (() => void) | null;
  saving: boolean;
  deleteConfirm: boolean;
}

export function PublicTechniqueEditModal({
  isOpen,
  onClose,
  initialData,
  existingId,
  onSave,
  onDelete,
  saving,
  deleteConfirm,
}: PublicTechniqueEditModalProps) {
  const [form, setForm] = useState<TechniqueFormState>(defaultForm);
  const { data: techniqueParts = [] } = useTechniqueParts();

  const partOptions = useMemo(
    () =>
      (techniqueParts as Array<{ id: string; name: string }>).map((p) => ({
        value: String(p.id),
        label: p.name,
      })),
    [techniqueParts]
  );

  useEffect(() => {
    if (isOpen && initialData) setForm(parseToForm(initialData));
    else if (isOpen && !initialData) setForm(defaultForm);
  }, [isOpen, initialData]);

  const addPart = () => {
    const first = (techniqueParts as Array<{ id: string; name: string }>)[0];
    setForm((f) => ({
      ...f,
      parts: [
        ...f.parts,
        {
          id: first?.id ?? '',
          name: first?.name ?? '',
          op_1_lvl: 1,
          op_2_lvl: 0,
          op_3_lvl: 0,
          applyDuration: false,
        },
      ],
    }));
  };

  const updatePart = (index: number, updates: Partial<TechniqueFormPart>) => {
    setForm((f) => ({ ...f, parts: f.parts.map((p, i) => (i === index ? { ...p, ...updates } : p)) }));
  };

  const removePart = (index: number) => {
    setForm((f) => ({ ...f, parts: f.parts.filter((_, i) => i !== index) }));
  };

  const handlePartSelect = (index: number, partId: string) => {
    const part = (techniqueParts as Array<{ id: string; name: string }>).find((p) => String(p.id) === partId);
    if (part) updatePart(index, { id: part.id, name: part.name });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    await onSave(formToPayload(form, existingId ?? undefined));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingId ? 'Edit Public Technique' : 'Add Public Technique'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Technique name"
          />
          <Select
            label="Action type"
            value={form.actionType}
            onChange={(e) => setForm((f) => ({ ...f, actionType: e.target.value }))}
            options={ACTION_TYPES.map((a) => ({ value: a.value, label: a.label }))}
          />
        </div>
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Optional description"
          rows={2}
        />
        <Input
          label="Weapon (name or ID)"
          value={form.weapon}
          onChange={(e) => setForm((f) => ({ ...f, weapon: e.target.value }))}
          placeholder="e.g. Unarmed, Longsword"
        />

        <div className="border-t border-border-light pt-4">
          <h4 className="text-sm font-medium text-text-primary mb-2">Damage</h4>
          <div className="grid grid-cols-3 gap-4">
            <Input
              type="number"
              label="Amount"
              value={form.damage.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, damage: { ...f.damage, amount: Number(e.target.value) || 0 } }))
              }
              min={0}
            />
            <Input
              type="number"
              label="Dice size"
              value={form.damage.size}
              onChange={(e) =>
                setForm((f) => ({ ...f, damage: { ...f.damage, size: Number(e.target.value) || 6 } }))
              }
              min={2}
            />
            <Select
              label="Type"
              value={form.damage.type}
              onChange={(e) => setForm((f) => ({ ...f, damage: { ...f.damage, type: e.target.value } }))}
              options={TECHNIQUE_DAMAGE_TYPES.map((t) => ({ value: t, label: t }))}
            />
          </div>
        </div>

        <div className="border-t border-border-light pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-text-primary">Parts & option levels</h4>
            <Button variant="outline" size="sm" onClick={addPart} className="gap-1">
              <Plus className="w-4 h-4" />
              Add part
            </Button>
          </div>
          {form.parts.length === 0 ? (
            <p className="text-sm text-text-muted">No parts. Add a part from the codex (Power & Technique Parts).</p>
          ) : (
            <div className="space-y-2">
              {form.parts.map((p, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-surface-alt border border-border-light"
                >
                  <Select
                    value={String(p.id)}
                    onChange={(e) => handlePartSelect(i, e.target.value)}
                    options={partOptions}
                    placeholder="Select part"
                    className="min-w-[140px]"
                  />
                  <Input
                    type="number"
                    placeholder="Op1"
                    value={p.op_1_lvl || ''}
                    onChange={(e) => updatePart(i, { op_1_lvl: Number(e.target.value) || 0 })}
                    className="w-16"
                  />
                  <Input
                    type="number"
                    placeholder="Op2"
                    value={p.op_2_lvl || ''}
                    onChange={(e) => updatePart(i, { op_2_lvl: Number(e.target.value) || 0 })}
                    className="w-16"
                  />
                  <Input
                    type="number"
                    placeholder="Op3"
                    value={p.op_3_lvl || ''}
                    onChange={(e) => updatePart(i, { op_3_lvl: Number(e.target.value) || 0 })}
                    className="w-16"
                  />
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={() => removePart(i)}
                    label="Remove part"
                    className="text-danger hover:text-danger-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
