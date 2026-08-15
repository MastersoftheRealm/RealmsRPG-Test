'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { ValueStepper } from '@/components/shared';
import { buildCustomEquipmentItem } from './build-custom-equipment';
import type { Item } from '@/types';

interface AddCustomEquipmentFormProps {
  onAdd: (item: Item) => void;
}

export function AddCustomEquipmentForm({ onAdd }: AddCustomEquipmentFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);

  const canAdd = name.trim().length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd(buildCustomEquipmentItem(name, description, quantity));
    setName('');
    setDescription('');
    setQuantity(1);
  };

  return (
    <div className="space-y-3 rounded-lg border border-border-light bg-surface-alt/60 p-3">
      <p className="text-xs font-medium text-text-secondary">
        Or add a custom item (not in your library)
      </p>
      <div className="flex flex-col flex-wrap items-end gap-3 sm:flex-row">
        <div className="min-w-[140px] flex-1">
          <label htmlFor="custom-equipment-name" className="mb-1 block text-xs text-text-muted">
            Name
          </label>
          <Input
            id="custom-equipment-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rope, Quest key"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canAdd) handleAdd();
            }}
          />
        </div>
        <div className="min-w-[140px] flex-1">
          <label htmlFor="custom-equipment-desc" className="mb-1 block text-xs text-text-muted">
            Notes (optional)
          </label>
          <Input
            id="custom-equipment-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description"
          />
        </div>
        <div>
          <span className="mb-1 block text-xs text-text-muted">Qty</span>
          <ValueStepper
            value={quantity}
            onChange={setQuantity}
            min={1}
            size="sm"
            variant="inline"
            decrementTitle="Decrease quantity"
            incrementTitle="Increase quantity"
          />
        </div>
        <Button type="button" size="sm" onClick={handleAdd} disabled={!canAdd} className="shrink-0">
          <Plus className="h-4 w-4" />
          Add custom
        </Button>
      </div>
    </div>
  );
}
