'use client';

import type { ReactNode } from 'react';
import { RealmsImageField } from '@/components/patterns';
import { Card } from '@/components/ui';
import { CreatorDescriptionField, CreatorNameField } from '@/components/creator/creator-text-fields';
import type { EmpoweredTechniqueCreatorEditorProps } from './empowered-technique-editor-config';

export type EmpoweredTechniqueEditorMetaProps = Pick<
  EmpoweredTechniqueCreatorEditorProps,
  | 'isAdmin'
  | 'name'
  | 'onNameChange'
  | 'description'
  | 'onDescriptionChange'
  | 'imageId'
  | 'imageUrl'
  | 'onImageChange'
> & {
  children?: ReactNode;
};

export function EmpoweredTechniqueEditorMeta({
  isAdmin,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  imageId,
  imageUrl,
  onImageChange,
  children,
}: EmpoweredTechniqueEditorMetaProps) {
  const showImage = Boolean(isAdmin);
  return (
    <Card className="space-y-4 p-6 shadow-md">
      <div>
        <label
          htmlFor="empowered-technique-creator-name"
          className="mb-1 block text-sm font-medium text-text-secondary"
        >
          Empowered Technique Name *
        </label>
        <CreatorNameField
          id="empowered-technique-creator-name"
          value={name}
          onChange={onNameChange}
          placeholder="Enter empowered technique name..."
        />
      </div>
      <div>
        <label
          htmlFor="empowered-technique-creator-description"
          className="mb-1 block text-sm font-medium text-text-secondary"
        >
          Description
        </label>
        <CreatorDescriptionField
          id="empowered-technique-creator-description"
          value={description}
          onChange={onDescriptionChange}
          rows={3}
          placeholder="Describe your empowered technique..."
        />
      </div>
      <div className={showImage && children ? 'grid min-w-0 gap-4 md:grid-cols-2' : 'min-w-0'}>
        {showImage && (
          <div className="min-w-0">
            <RealmsImageField
              categories="empowered-technique"
              imageId={imageId}
              imageUrl={imageUrl}
              onChange={onImageChange}
              entityName={name}
              label="Empowered technique card art"
              hint="Uploads are tagged for both power and technique browsing."
            />
          </div>
        )}
        {children ? <div className="min-w-0">{children}</div> : null}
      </div>
    </Card>
  );
}
