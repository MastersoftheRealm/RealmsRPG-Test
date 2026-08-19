/**
 * Item Creator — meta + type selector (TASK-616)
 */

'use client';

import { cn } from '@/lib/utils';
import { RealmsImageField } from '@/components/patterns';
import { Card } from '@/components/ui';
import type { ArmamentType } from './item-creator-bootstrap';
import { ARMAMENT_TYPES } from './item-creator-helpers';

type ItemCreatorEditorMetaProps = {
  isAdmin: boolean;
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  imageId: string | null;
  imageUrl: string | null;
  onImageChange: (selection: { imageId: string | null; imageUrl: string | null }) => void;
  imageCategory: 'weapon' | 'armor' | 'shield';
  armamentType: ArmamentType;
  onArmamentTypeChange: (type: ArmamentType) => void;
};

export function ItemCreatorEditorMeta({
  isAdmin,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  imageId,
  imageUrl,
  onImageChange,
  imageCategory,
  armamentType,
  onArmamentTypeChange,
}: ItemCreatorEditorMetaProps) {
  return (
    <Card className="p-6 shadow-md">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Item Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter item name..."
            className="w-full rounded-lg border border-border-light px-4 py-2 focus:border-warning-500 focus:ring-2 focus:ring-warning-500"
          />
        </div>

        {isAdmin && (
          <RealmsImageField
            categories={imageCategory}
            imageId={imageId}
            imageUrl={imageUrl}
            onChange={onImageChange}
            entityName={name}
            label="Armament card art"
            hint="Shown on guided creator loadout cards. Uploads are saved to the shared image bank."
          />
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">Item Type</label>
          <div className="grid grid-cols-4 gap-2">
            {ARMAMENT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => onArmamentTypeChange(type.value)}
                className={cn(
                  'flex min-h-[44px] items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  armamentType === type.value
                    ? 'bg-warning-600 text-text-on-dark hover:bg-warning-700 dark:bg-warning-700 dark:text-text-on-dark dark:hover:bg-warning-600'
                    : 'bg-surface-alt text-text-primary hover:bg-surface dark:bg-surface',
                )}
              >
                <type.icon className="h-4 w-4" />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Description</label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe your item..."
            rows={2}
            className="w-full rounded-lg border border-border-light px-4 py-2 focus:border-warning-500 focus:ring-2 focus:ring-warning-500"
          />
        </div>
      </div>
    </Card>
  );
}
