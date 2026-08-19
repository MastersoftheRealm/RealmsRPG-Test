'use client';

import Link from 'next/link';
import { Plus, Wand2, X, ExternalLink } from 'lucide-react';
import { GridListRow, InnateToggle, ListHeader } from '@/components/patterns';
import type { SelectableItem } from '@/components/patterns/select/unified-selection-modal';
import { Button, IconButton, EmptyState } from '@/components/ui';
import type { CharacterPower } from '@/types';
import { POWER_GRID_COLUMNS, POWER_MODAL_COLUMNS } from './modal-columns';

export interface PowersSelectedSectionProps {
  selectedPowers: CharacterPower[];
  selectedPowerItems: SelectableItem[];
  userPowersCount: number;
  showInnateControls: boolean;
  innateThreshold: number;
  innatePools: number;
  recommendedPowerRefs: Set<string>;
  pathName: string;
  addDisabled: boolean;
  powersLoading: boolean;
  hasContent: boolean;
  onAddClick: () => void;
  onToggleInnate: (powerId: string, isInnate: boolean) => void;
  onRemove: (powerId: string) => void;
}

export function PowersSelectedSection({
  selectedPowers,
  selectedPowerItems,
  userPowersCount,
  showInnateControls,
  innateThreshold,
  innatePools,
  recommendedPowerRefs,
  pathName,
  addDisabled,
  powersLoading,
  hasContent,
  onAddClick,
  onToggleInnate,
  onRemove,
}: PowersSelectedSectionProps) {
  if (!(hasContent || powersLoading)) return null;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Wand2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Powers</h3>
            <p className="text-sm text-text-muted">
              {selectedPowers.length} power{selectedPowers.length !== 1 ? 's' : ''} selected
              {showInnateControls && (
                <>
                  {' '}
                  · Tap ☆ to mark innate (up to {innateThreshold} EN, {innatePools} pool
                  {innatePools !== 1 ? 's' : ''})
                </>
              )}
            </p>
          </div>
        </div>
        <Button onClick={onAddClick} disabled={addDisabled}>
          <Plus className="h-4 w-4" />
          Add Powers
        </Button>
      </div>

      {selectedPowerItems.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border-light">
          <ListHeader
            columns={POWER_MODAL_COLUMNS.map(({ key, label }) => ({
              key,
              label,
              width: key === 'name' ? '1.4fr' : '0.7fr',
              align: (key === 'name' ? 'left' : 'center') as 'left' | 'center' | 'right',
            }))}
            gridColumns={POWER_GRID_COLUMNS}
            compact
            hasThumbnailColumn
            rowChrome={{ leftSlot: showInnateControls, rightSlot: true }}
          />
          <div className="flex flex-col gap-1">
            {selectedPowerItems.map((power) => {
              const idStr = String(power.id);
              const draftPower = selectedPowers.find((p) => String(p.id) === idStr);
              const isInnate = draftPower?.innate === true;
              const isPathRec =
                recommendedPowerRefs.has(idStr.toLowerCase()) ||
                recommendedPowerRefs.has(String(power.name).toLowerCase());
              const displayName = isPathRec ? `${power.name} (${pathName})` : power.name;
              return (
                <GridListRow
                  key={power.id}
                  id={power.id}
                  name={displayName}
                  description={power.description}
                  thumbnail={power.thumbnail}
                  columns={power.columns}
                  gridColumns={POWER_GRID_COLUMNS}
                  detailSections={power.detailSections}
                  totalCost={power.totalCost}
                  costLabel={power.costLabel}
                  badges={isPathRec ? undefined : power.badges}
                  innate={isInnate}
                  hideInnateBadge
                  leftSlot={
                    showInnateControls ? (
                      <InnateToggle
                        isInnate={isInnate}
                        onToggle={() => onToggleInnate(idStr, !isInnate)}
                      />
                    ) : undefined
                  }
                  rightSlot={
                    <IconButton
                      variant="danger"
                      size="sm"
                      onClick={() => onRemove(power.id)}
                      label="Remove power"
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
      ) : userPowersCount > 0 ? (
        <EmptyState
          title="No powers selected"
          description='Click "Add Powers" to choose from your library.'
          size="sm"
          className="rounded-lg border border-dashed border-border py-4"
        />
      ) : (
        <EmptyState
          title="No powers in your library"
          size="sm"
          className="rounded-lg border border-dashed border-border py-4"
          action={
            <Link
              href="/power-creator"
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
