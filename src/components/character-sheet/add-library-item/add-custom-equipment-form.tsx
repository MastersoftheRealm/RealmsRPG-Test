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
    <div className="rounded-lg border border-border-light bg-surface-alt/60 p-3 space-y-3">
      <p className="text-xs font-medium text-text-secondary">
        Or add a custom item (not in your library)
      </p>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="custom-equipment-name" className="block text-xs text-text-muted mb-1">
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
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="custom-equipment-desc" className="block text-xs text-text-muted mb-1">
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
          <span className="block text-xs text-text-muted mb-1">Qty</span>
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
        <Button size="sm" onClick={handleAdd} disabled={!canAdd} className="shrink-0">
          <Plus className="w-4 h-4" />
          Add custom
        </Button>
      </div>
    </div>
  );
}
