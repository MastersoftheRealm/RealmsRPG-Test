/**
 * Power Creator — meta section (TASK-616)
 */

'use client';

import Link from 'next/link';
import { RealmsImageField } from '@/components/shared';
import { Card, Input, Textarea } from '@/components/ui';
import { PowerCreatorHelp } from './power-creator-help';

type PowerCreatorEditorMetaProps = {
  isAdmin: boolean;
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  imageId: string | null;
  imageUrl: string | null;
  onImageChange: (selection: { imageId: string | null; imageUrl: string | null }) => void;
};

export function PowerCreatorEditorMeta({
  isAdmin,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  imageId,
  imageUrl,
  onImageChange,
}: PowerCreatorEditorMetaProps) {
  return (
    <Card className="shadow-md p-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-text-secondary">
            Building a hybrid? Use the dedicated empowered creator for combined power + technique rules.
          </p>
          <Link
            href="/empowered-technique-creator"
            className="inline-flex items-center rounded-lg border border-border-light bg-surface-alt px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface min-h-[44px]"
          >
            Open Empowered Creator
          </Link>
        </div>
        <div>
          <label htmlFor="power-creator-name" className="block text-sm font-medium text-text-secondary mb-1">
            Power Name *
          </label>
          <Input
            id="power-creator-name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter power name..."
          />
        </div>
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <label htmlFor="power-creator-description" className="text-sm font-medium text-text-secondary">
              Description
            </label>
            <PowerCreatorHelp topic="description" />
          </div>
          <Textarea
            id="power-creator-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe what your power does..."
            rows={3}
          />
        </div>
        {isAdmin && (
          <RealmsImageField
            categories="power"
            imageId={imageId}
            imageUrl={imageUrl}
            onChange={onImageChange}
            entityName={name}
            label="Power card art"
            hint="Uploads are saved to the shared image bank."
          />
        )}
      </div>
    </Card>
  );
}
