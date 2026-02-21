/**
 * Public Item (Armament) Edit Modal — structured form: name, description, type, properties (add/remove, option level), damage.
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Modal, Button, Input, Textarea, Select } from '@/components/ui';
import { useItemProperties } from '@/hooks';
import { WEAPON_DAMAGE_TYPES } from '@/lib/game/creator-constants';
import { Plus, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui';

const ITEM_TYPES = [
  { value: 'weapon', label: 'Weapon' },
  { value: 'armor', label: 'Armor' },
  { value: 'shield', label: 'Shield' },
  { value: 'equipment', label: 'Equipment' },
] as const;

export interface ItemFormProperty {
  id: string | number;
  name: string;
  op_1_lvl: number;
}

export interface ItemFormState {
  name: string;
  description: string;
  type: string;
  damage: { amount: number; size: number; type: string };
  properties: ItemFormProperty[];
}

const defaultForm: ItemFormState = {
  name: '',
  description: '',
  type: 'weapon',
  damage: { amount: 0, size: 6, type: 'none' },
  properties: [],
};

function parseToForm(data: Record<string, unknown>): ItemFormState {
  const damageArr = Array.isArray(data.damage) ? data.damage : [];
  const dmg = (damageArr[0] as { amount?: number; size?: number; type?: string }) || {};
  const propsRaw = (Array.isArray(data.properties) ? data.properties : []) as Array<{
    id?: number | string;
    name?: string;
    op_1_lvl?: number;
  }>;
  const properties: ItemFormProperty[] = propsRaw.map((p, i) => ({
    id: p.id ?? p.name ?? `prop-${i}`,
    name: String(p.name ?? ''),
    op_1_lvl: p.op_1_lvl ?? 1,
  }));
  return {
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    type: String((data.type ?? data.armamentType ?? 'weapon')).toLowerCase(),
    damage: {
      amount: Number(dmg.amount ?? 0),
      size: Number(dmg.size ?? 6),
      type: String(dmg.type ?? 'none'),
    },
    properties,
  };
}

function formToPayload(form: ItemFormState, existingId?: string): Record<string, unknown> {
  const damage =
    form.damage.type !== 'none' && form.damage.amount > 0
      ? [{ amount: form.damage.amount, size: form.damage.size, type: form.damage.type }]
      : [];
  const properties = form.properties.map((p) => ({
    id: typeof p.id === 'string' && /^\d+$/.test(p.id) ? Number(p.id) : p.id,
    name: p.name,
    op_1_lvl: p.op_1_lvl,
  }));
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    description: form.description.trim(),
    type: form.type,
    damage,
    properties,
  };
  if (existingId) payload.id = existingId;
  return payload;
}

interface PublicItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Record<string, unknown> | null;
  existingId: string | null;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onDelete: (() => void) | null;
  saving: boolean;
  deleteConfirm: boolean;
}

export function PublicItemEditModal({
  isOpen,
  onClose,
  initialData,
  existingId,
  onSave,
  onDelete,
  saving,
  deleteConfirm,
}: PublicItemEditModalProps) {
  const [form, setForm] = useState<ItemFormState>(defaultForm);
  const { data: itemProperties = [] } = useItemProperties();

  const propertyOptions = useMemo(
    () =>
      (itemProperties as Array<{ id: string; name: string }>).map((p) => ({
        value: String(p.id),
        label: p.name,
      })),
    [itemProperties]
  );

  const damageTypeOptions = useMemo(
    () => [{ value: 'none', label: 'None' }, ...WEAPON_DAMAGE_TYPES.map((t) => ({ value: t, label: t }))],
    []
  );

  useEffect(() => {
    if (isOpen && initialData) setForm(parseToForm(initialData));
    else if (isOpen && !initialData) setForm(defaultForm);
  }, [isOpen, initialData]);

  const addProperty = () => {
    const first = (itemProperties as Array<{ id: string; name: string }>)[0];
    setForm((f) => ({
      ...f,
      properties: [
        ...f.properties,
        { id: first?.id ?? '', name: first?.name ?? '', op_1_lvl: 1 },
      ],
    }));
  };

  const updateProperty = (index: number, updates: Partial<ItemFormProperty>) => {
    setForm((f) => ({
      ...f,
      properties: f.properties.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    }));
  };

  const removeProperty = (index: number) => {
    setForm((f) => ({ ...f, properties: f.properties.filter((_, i) => i !== index) }));
  };

  const handlePropertySelect = (index: number, propId: string) => {
    const prop = (itemProperties as Array<{ id: string; name: string }>).find((p) => String(p.id) === propId);
    if (prop) updateProperty(index, { id: prop.id, name: prop.name });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    await onSave(formToPayload(form, existingId ?? undefined));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingId ? 'Edit Public Armament' : 'Add Public Armament'}
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
            placeholder="Item name"
          />
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            options={ITEM_TYPES.map((a) => ({ value: a.value, label: a.label }))}
          />
        </div>
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Optional description"
          rows={2}
        />

        <div className="border-t border-border-light pt-4">
          <h4 className="text-sm font-medium text-text-primary mb-2">Damage (weapons)</h4>
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
              options={damageTypeOptions}
            />
          </div>
        </div>

        <div className="border-t border-border-light pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-text-primary">Properties & option levels</h4>
            <Button variant="outline" size="sm" onClick={addProperty} className="gap-1">
              <Plus className="w-4 h-4" />
              Add property
            </Button>
          </div>
          {form.properties.length === 0 ? (
            <p className="text-sm text-text-muted">No properties. Add from codex (Armament Properties).</p>
          ) : (
            <div className="space-y-2">
              {form.properties.map((p, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-surface-alt border border-border-light"
                >
                  <Select
                    value={String(p.id)}
                    onChange={(e) => handlePropertySelect(i, e.target.value)}
                    options={propertyOptions}
                    placeholder="Select property"
                    className="min-w-[140px]"
                  />
                  <Input
                    type="number"
                    label="Level"
                    value={p.op_1_lvl || ''}
                    onChange={(e) => updateProperty(i, { op_1_lvl: Number(e.target.value) || 1 })}
                    min={1}
                    className="w-20"
                  />
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProperty(i)}
                    label="Remove property"
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
