'use client';

import Link from 'next/link';
import { Plus, Swords, X, ExternalLink } from 'lucide-react';
import { GridListRow, ListHeader } from '@/components/patterns';
import type { SelectableItem } from '@/components/patterns/select/unified-selection-modal';
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
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-martial-light">
            <Swords className="h-5 w-5 text-martial-fg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Techniques</h3>
            <p className="text-sm text-text-muted">
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
          <Plus className="h-4 w-4" />
          Add Techniques
        </Button>
      </div>

      {selectedTechniqueItems.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border-light">
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
            rowChrome={{ rightSlot: true }}
          />
          <div className="flex flex-col gap-1">
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
                      <X className="h-4 w-4" />
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
          className="rounded-lg border border-dashed border-border py-4"
        />
      ) : (
        <EmptyState
          title="No techniques in your library"
          size="sm"
          className="rounded-lg border border-dashed border-border py-4"
          action={
            <Link
              href="/technique-creator"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Create one <ExternalLink className="h-3 w-3" />
            </Link>
          }
        />
      )}
    </section>
  );
}
