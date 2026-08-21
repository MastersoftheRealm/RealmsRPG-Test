'use client';

import { RealmsImageField } from '@/components/patterns';
import { Input, Textarea, Card } from '@/components/ui';
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
>;

export function EmpoweredTechniqueEditorMeta({
  isAdmin,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  imageId,
  imageUrl,
  onImageChange,
}: EmpoweredTechniqueEditorMetaProps) {
  return (
    <Card className="space-y-4 p-6 shadow-md">
      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">
          Empowered Technique Name *
        </label>
        <Input
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Enter empowered technique name..."
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">Description</label>
        <Textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          rows={3}
          placeholder="Describe your empowered technique..."
        />
      </div>
      {isAdmin && (
        <RealmsImageField
          categories="empowered-technique"
          imageId={imageId}
          imageUrl={imageUrl}
          onChange={onImageChange}
          entityName={name}
          label="Empowered technique card art"
          hint="Uploads are tagged for both power and technique browsing."
        />
      )}
    </Card>
  );
}
