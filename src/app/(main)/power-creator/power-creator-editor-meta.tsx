/**
 * Power Creator — meta section (TASK-616)
 */

'use client';

import type { ReactNode } from 'react';
import { RealmsImageField } from '@/components/patterns';
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
  /** Targeted-defenses picker — sits below description, beside image when present. */
  children?: ReactNode;
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
  children,
}: PowerCreatorEditorMetaProps) {
  const showImage = Boolean(isAdmin);
  return (
    <Card className="p-6 shadow-md">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="power-creator-name"
            className="mb-1 block text-sm font-medium text-text-secondary"
          >
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
            <label
              htmlFor="power-creator-description"
              className="text-sm font-medium text-text-secondary"
            >
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
        <div className={showImage && children ? 'grid min-w-0 gap-4 md:grid-cols-2' : 'min-w-0'}>
          {showImage && (
            <div className="min-w-0">
              <RealmsImageField
                categories="power"
                imageId={imageId}
                imageUrl={imageUrl}
                onChange={onImageChange}
                entityName={name}
                label="Power card art"
                hint="Uploads are saved to the shared image bank."
              />
            </div>
          )}
          {children ? <div className="min-w-0">{children}</div> : null}
        </div>
      </div>
    </Card>
  );
}
