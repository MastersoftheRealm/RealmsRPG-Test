'use client';

import Link from 'next/link';
import { Plus, Swords, X, ExternalLink } from 'lucide-react';
import { GridListRow, ListHeader } from '@/components/shared';
import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import { Button, IconButton, EmptyState } from '@/components/ui';
import type { CharacterTechnique } from '@/types';
import { TECHNIQUE_GRID_COLUMNS, TECHNIQUE_MODAL_COLUMNS } from './modal-columns';

export interface TechniquesSelectedSectionProps {
  selectedTechniques: CharacterTechnique[];
  selectedTechniqueItems: SelectableItem[];
  userTechniquesCount: number;
  recommendedTechniqueRefs: Set<string>;
  pathName: string;
  addDisabled: boolean;
  techniquesLoading: boolean;
  hasContent: boolean;
  onAddClick: () => void;
  onRemove: (techniqueId: string) => void;
}

export function TechniquesSelectedSection({
  selectedTechniques,
  selectedTechniqueItems,
  userTechniquesCount,
  recommendedTechniqueRefs,
  pathName,
  addDisabled,
  techniquesLoading,
  hasContent,
  onAddClick,
  onRemove,
}: TechniquesSelectedSectionProps) {
  if (!(hasContent || techniquesLoading)) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-martial-light flex items-center justify-center">
            <Swords className="w-5 h-5 text-martial-fg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Techniques</h3>
            <p className="text-sm text-text-muted dark:text-text-secondary">
              {selectedTechniques.length} technique{selectedTechniques.length !== 1 ? 's' : ''}{' '}
              selected
            </p>
          </div>
        </div>
        <Button
          onClick={onAddClick}
          disabled={addDisabled}
          className="bg-martial-dark hover:bg-martial-text"
        >
          <Plus className="w-4 h-4" />
          Add Techniques
        </Button>
      </div>

      {selectedTechniqueItems.length > 0 ? (
        <div className="border border-border-light rounded-lg overflow-hidden">
          <ListHeader
            columns={TECHNIQUE_MODAL_COLUMNS.map(({ key, label }) => ({
              key,
              label,
              width:
                key === 'name'
                  ? '1.4fr'
                  : key === 'Energy'
                    ? '0.7fr'
                    : key === 'Weapon'
                      ? '1fr'
                      : '0.8fr',
              align: (key === 'name' ? 'left' : 'center') as 'left' | 'center' | 'right',
            }))}
            gridColumns={TECHNIQUE_GRID_COLUMNS}
            compact
            hasThumbnailColumn
          />
          <div className="space-y-1">
            {selectedTechniqueItems.map((tech) => {
              const idStr = String(tech.id);
              const isPathRec =
                recommendedTechniqueRefs.has(idStr.toLowerCase()) ||
                recommendedTechniqueRefs.has(String(tech.name).toLowerCase());
              const displayName = isPathRec ? `${tech.name} (${pathName})` : tech.name;
              return (
                <GridListRow
                  key={tech.id}
                  id={tech.id}
                  name={displayName}
                  description={tech.description}
                  thumbnail={tech.thumbnail}
                  columns={tech.columns}
                  gridColumns={TECHNIQUE_GRID_COLUMNS}
                  detailSections={tech.detailSections}
                  totalCost={tech.totalCost}
                  costLabel={tech.costLabel}
                  badges={isPathRec ? undefined : tech.badges}
                  rightSlot={
                    <IconButton
                      variant="danger"
                      size="sm"
                      onClick={() => onRemove(tech.id)}
                      label="Remove technique"
                    >
                      <X className="w-4 h-4" />
                    </IconButton>
                  }
                  compact
                />
              );
            })}
          </div>
        </div>
      ) : userTechniquesCount > 0 ? (
        <EmptyState
          title="No techniques selected"
          description='Click "Add Techniques" to choose from your library.'
          size="sm"
          className="py-4 rounded-lg border border-dashed border-border"
        />
      ) : (
        <EmptyState
          title="No techniques in your library"
          size="sm"
          className="py-4 rounded-lg border border-dashed border-border"
          action={
            <Link
              href="/technique-creator"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Create one <ExternalLink className="w-3 h-3" />
            </Link>
          }
        />
      )}
    </section>
  );
}
